import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function compile(path, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    { exports, require: (name) => dependencies[name], Date },
  );
  return exports;
}
const rules = compile('src/shared/finance/investments.ts');
test('projeção de CDB usa centavos inteiros e juros compostos', () => {
  const result = rules.projectInvestment(3000000, 0.8, 2);
  assert.equal(result[0].yieldCents, 24000);
  assert.equal(result[1].yieldCents, 24192);
  assert.equal(result[1].balanceCents, 3048192);
});
test('projeção rejeita valores e prazos inválidos', () => {
  for (const [balance, rate, months] of [
    [-1, 1, 12],
    [100, NaN, 12],
    [100, -100, 12],
    [100, 1, 0],
    [100, 1, 361],
    [1.1, 1, 12],
  ])
    assert.throws(() => rules.projectInvestment(balance, rate, months));
});
test('rendimentos pertencem ao usuário e corrigir mês substitui registro', async () => {
  const entries = [];
  const repository = {
    list: async (userId) =>
      userId === 42
        ? [{ id: 1, startMonth: '2020-01', principalCents: 3000000 }]
        : [],
    yields: async () => entries,
    events: async () => [],
    record: async (id, month, amount) => {
      const index = entries.findIndex((item) => item.month === month);
      const entry = { investmentId: id, month, amountCents: amount };
      if (index >= 0) entries[index] = entry;
      else entries.push(entry);
    },
  };
  const { InvestmentService } = compile(
    'src/main/application/services/investment-service.ts',
    {
      '../repositories/investment-repository': {},
      '@shared/finance/investments': rules,
    },
  );
  const service = new InvestmentService(repository);
  await service.record(42, 1, '2020-02', 20000);
  await service.record(42, 1, '2020-02', 25000);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].amountCents, 25000);
  await assert.rejects(service.record(99, 1, '2020-02', 20000));
  await assert.rejects(service.record(42, 1, '2019-12', 1));
  await assert.rejects(service.record(42, 1, '2099-12', 1));
  await assert.rejects(service.record(42, 1, '2020-03', -99999999));
});
