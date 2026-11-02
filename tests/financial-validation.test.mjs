import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadRules() {
  const source = fs.readFileSync('src/shared/finance/validation.ts', 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports });
  return exports;
}
const { assertPositiveAmount, validateTransferValues } = loadRules();

test('rejeita valores inválidos antes de alterar saldos', () => {
  for (const amount of [
    0,
    -10,
    NaN,
    Infinity,
    -Infinity,
    '100',
    null,
    undefined,
  ]) {
    assert.throws(() => assertPositiveAmount(amount));
  }
});
test('valida taxa e resultado da conversão', () => {
  assert.equal(validateTransferValues(100, 1.5), 150);
  assert.equal(validateTransferValues(100), 100);
  for (const rate of [0, -1, NaN, Infinity, '2'])
    assert.throws(() => validateTransferValues(100, rate));
  assert.throws(() => validateTransferValues(Number.MAX_VALUE, 2));
});
