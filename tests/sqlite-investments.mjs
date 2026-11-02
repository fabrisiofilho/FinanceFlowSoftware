import crypto from 'node:crypto';
import zlib from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import process from 'node:process';
import Database from 'better-sqlite3';
(async () => {
  const db = new Database(':memory:');
  db.pragma('foreign_keys=ON');
  db.exec(
    'CREATE TABLE migrations(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,applied_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
  );
  for (const file of fs
    .readdirSync('src/main/infrastructure/database/migrations')
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    if (file.startsWith('011_')) {
      db.exec(
        "INSERT INTO finance_users(id,name,email,password_hash) VALUES(999,'Migração','migration@example.test','dummy'); INSERT INTO accounts(id,user_id,name,type,balance,initial_balance) VALUES(999,999,'Conta preservada','wallet',12345,12345); INSERT INTO categories(id,name,type,icon,is_default) VALUES(999,'Moradia','expense','home',1);",
      );
    }
    if (file.startsWith('012_'))
      db.exec(
        "INSERT INTO recurring_transactions(id,user_id,description,amount,type,frequency,account_id,category_id,start_date,next_occurrence) VALUES(999,999,'Regra preservada',1234,'expense','monthly',999,999,'2026-01-31','2026-02-28')",
      );
    db.exec(
      fs.readFileSync(
        'src/main/infrastructure/database/migrations/' + file,
        'utf8',
      ),
    );
    if (file.startsWith('012_')) {
      const rule = db
        .prepare(
          'SELECT amount,monthly_rule,day_of_month,next_occurrence FROM recurring_transactions WHERE id=999',
        )
        .get();
      assert.deepEqual(rule, {
        amount: 1234,
        monthly_rule: 'calendar_day',
        day_of_month: 31,
        next_occurrence: '2026-02-28',
      });
    }
    if (file.startsWith('011_')) {
      assert.equal(
        db.prepare('SELECT balance FROM accounts WHERE id=999').get().balance,
        12345,
      );
      assert.equal(
        db.prepare('SELECT icon FROM categories WHERE id=999').get().icon,
        'Home',
      );
      assert.equal(
        db.prepare('SELECT image_data FROM accounts WHERE id=999').get()
          .image_data,
        null,
      );
    }
  }
  for (const file of fs
    .readdirSync('src/main/infrastructure/database/migrations')
    .filter((file) => file.endsWith('.sql')))
    db.prepare('INSERT INTO migrations(name) VALUES(?)').run(
      file.replace('.sql', ''),
    );
  db.prepare(
    'INSERT INTO finance_users(id,name,email,password_hash) VALUES(?,?,?,?)',
  ).run(1, 'Teste', 'test1@example.test', 'dummy');
  db.prepare(
    'INSERT INTO finance_users(id,name,email,password_hash) VALUES(?,?,?,?)',
  ).run(2, 'Outro', 'test2@example.test', 'dummy');
  const query = async (sql, parameters = []) =>
    /^SELECT/i.test(sql)
      ? db.prepare(sql).all(...parameters)
      : db.prepare(sql).run(...parameters);
  const source = {
    query,
    transaction: async (callback) => {
      db.exec('BEGIN');
      try {
        await callback({ query });
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const financialQueue = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        'src/main/infrastructure/database/financial-transaction.ts',
        'utf8',
      ),
      { compilerOptions: { module: 1, target: 9 } },
    ).outputText,
    {
      exports: financialQueue,
      require: () => ({ getDataSource: () => source }),
    },
  );
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        'src/main/application/repositories/investment-repository.ts',
        'utf8',
      ),
      { compilerOptions: { module: 1, target: 9 } },
    ).outputText,
    {
      exports,
      require: (name) =>
        name.includes('financial-transaction')
          ? {
              financialTransaction: (operation) =>
                source.transaction(operation),
            }
          : { getDataSource: () => source },
    },
  );
  const repository = new exports.InvestmentRepository();
  await repository.create(1, {
    name: 'CDB',
    kind: 'CDB',
    principalCents: 3000000,
    startMonth: '2026-01',
    monthlyRate: 0.8,
  });
  const investment = (await repository.list(1))[0];
  assert.equal((await repository.list(2)).length, 0);
  await repository.record(investment.id, '2026-02', 20000);
  await repository.record(investment.id, '2026-02', 25000);
  assert.equal((await repository.yields(1)).length, 1);
  assert.equal((await repository.yields(1))[0].amountCents, 25000);
  await repository.remove(2, investment.id);
  assert.equal((await repository.list(1)).length, 1);
  await repository.remove(1, investment.id);
  assert.equal((await repository.yields(1)).length, 0);
  db.prepare(
    "INSERT INTO accounts(id,user_id,name,type,balance,initial_balance) VALUES(100,1,'Conta de teste','checking',5000000,5000000)",
  ).run();
  await repository.create(1, {
    name: 'CDB vinculado',
    kind: 'CDB',
    principalCents: 3000000,
    startMonth: '2026-01',
    monthlyRate: 0,
    accountId: 100,
  });
  const linked = (await repository.list(1)).find(
    (item) => item.name === 'CDB vinculado',
  );
  const cash = () =>
    db.prepare('SELECT balance FROM accounts WHERE id=100').get().balance / 100;
  assert.equal(cash(), 20000);
  const deposit = {
    investmentId: linked.id,
    accountId: 100,
    kind: 'deposit',
    amountCents: 100000,
    eventDate: '2026-02-01',
    requestId: 'deposit-test',
  };
  await repository.event(1, deposit);
  await repository.event(1, deposit);
  assert.equal(cash(), 19000);
  assert.equal(
    (await repository.events(1)).filter((item) => item.kind === 'deposit')
      .length,
    1,
  );
  await assert.rejects(() =>
    repository.event(2, { ...deposit, requestId: 'other-user' }),
  );
  assert.equal(cash(), 19000);
  await assert.rejects(() =>
    repository.event(1, {
      ...deposit,
      amountCents: 99000000,
      requestId: 'too-large',
    }),
  );
  assert.equal(cash(), 19000);
  await repository.event(1, {
    ...deposit,
    kind: 'withdrawal',
    amountCents: 200000,
    requestId: 'withdraw-test',
  });
  assert.equal(cash(), 21000);
  await repository.event(1, {
    ...deposit,
    accountId: undefined,
    kind: 'fee',
    amountCents: 10000,
    requestId: 'fee-test',
  });
  assert.equal(cash(), 21000);
  const events = await repository.events(1);
  const position =
    linked.principalCents +
    events
      .filter((item) => item.investmentId === linked.id)
      .reduce(
        (sum, item) =>
          sum +
          (item.kind === 'initial'
            ? 0
            : item.kind === 'deposit'
              ? item.amountCents
              : -item.amountCents),
        0,
      );
  assert.equal(position, 2890000);
  await assert.rejects(() => repository.remove(1, linked.id));
  assert.equal((await repository.list(1)).length, 1);
  db.prepare(
    "INSERT INTO categories(id,user_id,name,type) VALUES(100,1,'Gastos teste','expense')",
  ).run();
  const insert = db.prepare(
    "INSERT INTO transactions(description,amount,type,transaction_date,account_id,category_id,status,settlement_date,origin) VALUES('Teste',?,?,?,?,?,?,?,?)",
  );
  insert.run(
    500000,
    'income',
    '2026-01-01',
    100,
    100,
    'settled',
    '2026-02-01',
    'entry',
  );
  insert.run(
    120000,
    'expense',
    '2026-01-01',
    100,
    100,
    'settled',
    '2026-02-02',
    'entry',
  );
  insert.run(
    50000,
    'expense',
    '2026-02-01',
    100,
    100,
    'pending',
    null,
    'entry',
  );
  insert.run(
    90000,
    'expense',
    '2026-02-01',
    100,
    100,
    'cancelled',
    null,
    'entry',
  );
  insert.run(
    100000,
    'income',
    '2026-02-01',
    100,
    100,
    'settled',
    '2026-02-01',
    'transfer',
  );
  const transactionExports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        'src/main/application/repositories/transaction-repository.ts',
        'utf8',
      ),
      { compilerOptions: { module: 1, target: 9 } },
    ).outputText,
    {
      exports: transactionExports,
      require: (name) =>
        name.includes('base-repository')
          ? {
              BaseRepository: class {
                constructor() {
                  this.repository = { manager: { query } };
                }
              },
            }
          : { TransactionEntity: class {} },
    },
  );
  const summary =
    await new transactionExports.TransactionRepository().getCashSummary(
      1,
      2026,
      2,
    );
  assert.equal(summary.received, 5000);
  assert.equal(summary.paid, 1200);
  assert.equal(summary.pendingExpenses, 500);
  assert.equal(summary.received - summary.paid, 3800);
  const other =
    await new transactionExports.TransactionRepository().getCashSummary(
      2,
      2026,
      2,
    );
  assert.equal(other.received, 0);
  console.log(
    'Caixa/carteira, idempotência, isolamento, saldo insuficiente e liquidação por mês: OK',
  );
  for (let index = 0; index < 2; index++)
    db.prepare(
      "INSERT OR IGNORE INTO notifications(user_id,type,title,message,reference_type,reference_id) VALUES(1,'custom','Teste','Teste','auto:alert:2026-11',1)",
    ).run();
  assert.equal(
    db.prepare('SELECT COUNT(*) AS count FROM notifications').get().count,
    1,
  );
  console.log(
    'Migrações, persistência, atualização mensal, isolamento, exclusão e deduplicação: OK',
  );
  const codec = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync('src/main/domain/backup-codec.ts', 'utf8'),
      { compilerOptions: { module: 1, target: 9 } },
    ).outputText,
    {
      exports: codec,
      Buffer,
      require: (name) => (name === 'node:crypto' ? crypto : zlib),
    },
  );
  const secret = 'senha-teste-12345';
  const encrypted = codec.encryptBackup(db.serialize(), secret);
  assert.throws(() => codec.decryptBackup(encrypted, 'senha-errada-12345'));
  const tampered = JSON.parse(encrypted);
  tampered.data = tampered.data.slice(0, 12) + 'AAAA' + tampered.data.slice(16);
  assert.throws(() => codec.decryptBackup(JSON.stringify(tampered), secret));
  const restored = new Database(codec.decryptBackup(encrypted, secret));
  assert.equal(restored.pragma('integrity_check', { simple: true }), 'ok');
  assert.equal(
    restored.prepare('SELECT balance FROM accounts WHERE id=100').get().balance,
    2100000,
  );
  assert.equal(
    restored.prepare('SELECT count(*) AS count FROM investment_events').get()
      .count,
    4,
  );
  assert.equal(
    restored.prepare('SELECT count(*) AS count FROM transactions').get().count,
    5,
  );
  assert.equal(restored.pragma('foreign_key_check').length, 0);
  restored.close();
  const directory = fs.mkdtempSync(
    path.join(process.cwd(), '.qa', 'contabily-test-restore-'),
  );
  const active = path.join(directory, 'active.sqlite'),
    archive = path.join(directory, 'test.ctbackup');
  const note = path.join(directory, 'sample.txt');
  fs.writeFileSync(note, 'teste-anexo');
  db.prepare(
    "INSERT INTO attachments(transaction_id,filename,original_name,mime_type,file_size,file_path) VALUES(1,'sample.txt','sample.txt','text/plain',?,?)",
  ).run(Buffer.byteLength('teste-anexo'), note);
  fs.writeFileSync(active, db.serialize());
  let local = new Database(active);
  const attachmentExports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        'src/main/application/services/backup/backup-attachments.ts',
        'utf8',
      ),
      { compilerOptions: { module: 1, target: 9, esModuleInterop: true } },
    ).outputText,
    {
      exports: attachmentExports,
      Buffer,
      require: (name) =>
        ({ 'node:fs': fs, 'node:path': path, 'node:crypto': crypto })[name],
    },
  );
  const serviceExports = {};
  const dependencies = {
    'node:fs': fs,
    'node:path': path,
    'node:os': os,
    'better-sqlite3': Database,
    '../../../domain/backup-codec': codec,
    './backup-attachments': attachmentExports,
    '@main/infrastructure/database/financial-transaction': financialQueue,
    '@main/infrastructure/database/data-source': {
      getDatabasePath: () => active,
      getDataSource: () => ({
        query: async (sql, values) => local.prepare(sql).run(...values),
      }),
      closeDatabase: async () => local.close(),
      initializeDatabase: async () => {
        local = new Database(active);
      },
    },
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        'src/main/application/services/backup/backup-service.ts',
        'utf8',
      ),
      { compilerOptions: { module: 1, target: 9, esModuleInterop: true } },
    ).outputText,
    {
      exports: serviceExports,
      Date,
      Buffer,
      require: (name) => dependencies[name],
    },
  );
  const backups = new serviceExports.BackupService(directory);
  await backups.export(archive, secret);
  local.prepare('UPDATE accounts SET balance=1 WHERE id=100').run();
  await assert.rejects(() => backups.restore(archive, 'errada-123456'));
  assert.equal(
    local.prepare('SELECT balance FROM accounts WHERE id=100').get().balance,
    1,
  );
  await backups.restore(archive, secret);
  local = new Database(active);
  assert.equal(
    local.prepare('SELECT balance FROM accounts WHERE id=100').get().balance,
    2100000,
  );
  local.close();
  for (const file of fs.readdirSync(directory))
    fs.unlinkSync(path.join(directory, file));
  fs.rmdirSync(directory);
  console.log(
    'Backup criptografado, senha incorreta, adulteração e restauração integral em arquivo temporário: OK',
  );
  db.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
