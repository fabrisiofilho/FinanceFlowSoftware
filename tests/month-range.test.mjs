import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      'src/renderer/src/components/Filters/month-range.ts',
      'utf8',
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { exports },
);
const { changeMonthRange } = exports;
const range = { startYear: 2026, startMonth: 11, endYear: 2026, endMonth: 12 };
test('filtro corrige extremos invertidos inclusive na virada de ano', () => {
  const next = changeMonthRange(range, 'start', '2027-02');
  assert.equal(next.startYear, 2027);
  assert.equal(next.endYear, 2027);
  assert.equal(next.endMonth, 2);
  const previous = changeMonthRange(range, 'end', '2025-12');
  assert.equal(previous.startYear, 2025);
  assert.equal(previous.startMonth, 12);
  assert.equal(range.startYear, 2026);
});
test('filtro ignora mês inválido e mantém a outra extremidade de um intervalo válido', () => {
  for (const value of ['', '2026-00', '2026-13', '26-01'])
    assert.equal(changeMonthRange(range, 'start', value), range);
  const next = changeMonthRange(range, 'start', '2026-10');
  assert.equal(next.startMonth, 10);
  assert.equal(next.endMonth, 12);
});
