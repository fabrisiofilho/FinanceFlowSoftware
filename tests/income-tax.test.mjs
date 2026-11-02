import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync('src/shared/finance/income-tax.ts', 'utf8'),
    { compilerOptions: { module: 1 } },
  ).outputText,
  { exports },
);
const { simulateIncomeTax } = exports;
const base = {
  taxableCents: 0,
  expectedCents: 0,
  withheldCents: 0,
  socialSecurityCents: 0,
  medicalCents: 0,
  dependents: 0,
  educationCents: [0],
  pensionCents: 0,
  pgblCents: 0,
};
test('IR anual: isenção, projeção e restituição de antecipações', () => {
  const result = simulateIncomeTax({
    ...base,
    taxableCents: 3000000,
    expectedCents: 3000000,
    withheldCents: 100000,
  });
  assert.equal(result.income, 6000000);
  assert.equal(result.simplified.tax, 0);
  assert.equal(result.simplified.balance, -100000);
});
test('IR anual: tabela progressiva, simplificado e saldo a pagar', () => {
  const result = simulateIncomeTax({
    ...base,
    taxableCents: 12000000,
    withheldCents: 1000000,
  });
  assert.equal(result.simplified.deduction, 1764000);
  assert.equal(result.simplified.tax, 1724434);
  assert.equal(result.simplified.balance, 724434);
});
test('redução anual usa renda bruta e é limitada ao imposto', () => {
  const result = simulateIncomeTax({ ...base, taxableCents: 7200000 });
  assert.equal(result.simplified.reduction, 154833);
  assert.equal(result.simplified.tax, 338701);
  assert.equal(
    simulateIncomeTax({ ...base, taxableCents: 8820000 }).simplified.reduction,
    0,
  );
  assert.equal(simulateIncomeTax(base).legal.tax, 0);
});
test('deduções individuais de educação e limite de PGBL', () => {
  const result = simulateIncomeTax({
    ...base,
    taxableCents: 12000000,
    dependents: 1,
    educationCents: [1000000, 10000],
    pgblCents: 3000000,
    medicalCents: 4000000,
  });
  assert.equal(result.legal.deduction, 6033658);
  assert.equal(result.best, 'legal');
});
test('validação e altas rendas fora do escopo', () => {
  for (const value of [-1, NaN, Infinity, 1.1])
    assert.throws(() => simulateIncomeTax({ ...base, taxableCents: value }));
  assert.throws(() => simulateIncomeTax({ ...base, dependents: 1 }));
  assert.equal(
    simulateIncomeTax({ ...base, taxableCents: 60000001 }).outsideScope,
    true,
  );
});
