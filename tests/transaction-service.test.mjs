import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import crypto from 'node:crypto';
function load(file, deps = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: 1, target: 9 },
    }).outputText,
    {
      exports,
      Date,
      crypto,
      require: (name) => {
        if (!(name in deps)) throw new Error('Missing ' + name);
        return deps[name];
      },
    },
  );
  return exports;
}
function fixture(failAt = 0) {
  let state = { rows: [], balance: 0 };
  class Transactions {
    async createTransaction(data) {
      state.rows.push({ ...data, id: state.rows.length + 1 });
      if (failAt === state.rows.length) throw new Error('write failure');
      return state.rows.at(-1);
    }
  }
  Transactions.prototype.findById = async function (id) {
    return state.rows.find((row) => row.id === id);
  };
  Transactions.prototype.updateTransaction = async function (id, user, data) {
    const row = state.rows.find((row) => row.id === id);
    const updated = { ...row, ...data };
    state.rows = state.rows.map((item) => (item.id === id ? updated : item));
    return updated;
  };
  Transactions.prototype.deleteTransaction = async function (id) {
    state.rows = state.rows.filter((row) => row.id !== id);
    return true;
  };
  class Accounts {
    async findById() {
      return { id: 1 };
    }
  }
  class Categories {
    async findById() {
      return { id: 1, type: 'expense' };
    }
  }
  class Balances {
    async updateBalanceAfterCreate(user, account, type, amount) {
      state.balance += type === 'expense' ? -amount : amount;
    }
  }
  Balances.prototype.updateBalanceAfterUpdate = async function (
    user,
    account,
    oldType,
    oldAmount,
    newType,
    newAmount,
  ) {
    state.balance -= oldType === 'expense' ? -oldAmount : oldAmount;
    state.balance += newType === 'expense' ? -newAmount : newAmount;
  };
  Balances.prototype.updateBalanceAfterDelete = async function (
    user,
    account,
    type,
    amount,
  ) {
    state.balance -= type === 'expense' ? -amount : amount;
  };
  const source = {
    transaction: async (callback) => {
      const snapshot = structuredClone(state);
      try {
        return await callback({});
      } catch (error) {
        state = snapshot;
        throw error;
      }
    },
  };
  const { TransactionService } = load(
    'src/main/application/services/transaction-service.ts',
    {
      '@shared/finance/entry-state': load('src/shared/finance/entry-state.ts', {
        './calendar-date': load('src/shared/finance/calendar-date.ts'),
      }),
      '@shared/finance/entry-schedule': load(
        'src/shared/finance/entry-schedule.ts',
      ),
      '@main/infrastructure/database/data-source': {
        getDataSource: () => source,
      },
      '../../domain/financial-validation': load(
        'src/main/domain/financial-validation.ts',
      ),
      '../repositories/transaction-repository': {
        TransactionRepository: Transactions,
      },
      '../repositories/account-repository': { AccountRepository: Accounts },
      '../repositories/category-repository': { CategoryRepository: Categories },
      './balance-calculator-service': { BalanceCalculatorService: Balances },
      './credit-card-service': { CreditCardService: class {} },
      '@main/infrastructure/log/logger': {
        logger: new Proxy({}, { get: () => () => {} }),
      },
      '../repositories/repository-cache': { repositoryCache: {} },
      '@main/infrastructure/utils/date-utils': {
        parseDateSafe: load('src/shared/finance/calendar-date.ts')
          .parseCalendarDate,
      },
    },
  );
  return { service: new TransactionService(), state: () => state };
}
const input = {
  description: 'Compra teste',
  amount: 100,
  type: 'expense',
  transactionDate: new Date(2026, 0, 31),
  accountId: 1,
  categoryId: 1,
};
test('falha na segunda parcela reverte também a primeira e seu saldo', async () => {
  const f = fixture(2);
  await assert.rejects(
    () => f.service.create(1, { ...input, totalInstallments: 3 }),
    /write failure/,
  );
  assert.equal(f.state().rows.length, 0);
  assert.equal(f.state().balance, 0);
});
test('parcelamento completo confirma grupo e saldo juntos', async () => {
  const f = fixture();
  await f.service.create(1, { ...input, totalInstallments: 3 });
  assert.equal(f.state().rows.length, 3);
  assert.equal(Math.round(f.state().balance * 100), -3333);
  assert.equal(f.state().rows[1].transactionDate.getDate(), 28);
});
test('serviço gera datas semanais reais e rejeita valores inválidos antes de gravar', async () => {
  const f = fixture();
  await assert.rejects(() => f.service.create(1, { ...input, amount: 1.001 }));
  assert.equal(f.state().rows.length, 0);
  await f.service.create(1, { ...input, recurrence: 'weekly' });
  assert.equal(f.state().rows[1].transactionDate.getMonth(), 1);
  assert.equal(f.state().rows[1].transactionDate.getDate(), 7);
});

test('pendência não afeta saldo; liquidar, cancelar e excluir revertem somente realizado', async () => {
  const f = fixture();
  const result = await f.service.create(1, { ...input, status: 'pending' });
  assert.equal(f.state().balance, 0);
  await f.service.update(1, result.id, {
    status: 'settled',
    settlementDate: new Date(2026, 1, 2),
  });
  assert.equal(f.state().balance, -100);
  await f.service.update(1, result.id, { status: 'cancelled' });
  assert.equal(f.state().balance, 0);
  await f.service.delete(1, result.id);
  assert.equal(f.state().balance, 0);
});
