import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import process from 'node:process';
import Database from 'better-sqlite3';
(async () => {
  const db = new Database(':memory:');
  db.pragma('foreign_keys=ON');
  for (const file of fs
    .readdirSync('src/main/infrastructure/database/migrations')
    .filter((f) => f.endsWith('.sql'))
    .sort())
    db.exec(
      fs.readFileSync(
        'src/main/infrastructure/database/migrations/' + file,
        'utf8',
      ),
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
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        'src/main/application/repositories/investment-repository.ts',
        'utf8',
      ),
      { compilerOptions: { module: 1, target: 9 } },
    ).outputText,
    { exports, require: () => ({ getDataSource: () => source }) },
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
  db.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
