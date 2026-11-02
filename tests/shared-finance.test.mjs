import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, deps = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: 1, target: 9 },
    }).outputText,
    {
      exports,
      Date,
      require: (name) => {
        if (!(name in deps)) throw new Error('Dependência inesperada: ' + name);
        return deps[name];
      },
    },
  );
  return exports;
}
const schedule = load('src/shared/finance/entry-schedule.ts');
const core = load('src/shared/finance/ledger.ts', {
  './entry-schedule': schedule,
});
test('núcleo compartilhado conserva centavos e aceita impacto zero de pendência', () => {
  assert.equal(core.balanceImpactCents('income', 0.29), 29);
  assert.equal(core.balanceImpactCents('expense', 0.29), -29);
  assert.equal(core.balanceImpactCents('expense', 0), 0);
  for (const amount of [-1, NaN, Infinity, 0.001])
    assert.throws(() => core.balanceImpactCents('expense', amount));
});
test('caso de contribuição exige propriedade antes de gravar e envia centavos à porta', async () => {
  const writes = [];
  const port = {
    findOwnedGoal: async (actor) =>
      actor === 1 ? { currentCents: 90, targetCents: 100 } : null,
    append: async (...args) => writes.push(args),
    recompute: async () => ({ currentCents: 100 }),
  };
  const command = {
    actorId: 2,
    goalId: 1,
    amount: 0.1,
    date: new Date(2026, 0, 1),
  };
  await assert.rejects(
    () => core.contributeToGoal(port, command),
    /Meta não encontrada/,
  );
  assert.equal(writes.length, 0);
  const result = await core.contributeToGoal(port, { ...command, actorId: 1 });
  assert.equal(writes[0][1], 10);
  assert.equal(result.entity.currentCents, 100);
  assert.equal(result.wasCompleted, false);
});
test('fatura rejeita outro cartão, receita, transferência e cancelamento', () => {
  const entry = {
    accountId: 1,
    type: 'expense',
    status: 'settled',
    origin: 'entry',
  };
  assert.doesNotThrow(() => core.assertInvoiceLink(entry, { accountId: 1 }));
  for (const invalid of [
    { accountId: 2 },
    { type: 'income' },
    { status: 'cancelled' },
    { origin: 'transfer' },
  ])
    assert.throws(() =>
      core.assertInvoiceLink({ ...entry, ...invalid }, { accountId: 1 }),
    );
});
test('núcleo financeiro não depende de Electron, Node, TypeORM ou React', () => {
  for (const name of fs
    .readdirSync('src/shared/finance')
    .filter((name) => name.endsWith('.ts'))) {
    const source = fs.readFileSync('src/shared/finance/' + name, 'utf8');
    for (const item of ts.preProcessFile(source).importedFiles)
      assert.ok(
        !/electron|typeorm|node:|@main|renderer|react|^fs$/.test(item.fileName),
        name + ': ' + item.fileName,
      );
  }
});
