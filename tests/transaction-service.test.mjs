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
  assert.equal(Math.round(f.state().balance * 100), -10000);
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
