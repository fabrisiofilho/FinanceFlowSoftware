import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
function load(file) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: 1 },
    }).outputText,
    { exports, Date },
  );
  return exports;
}
const { amountToCents, installmentAmounts, occurrenceDate } = load(
  'src/shared/finance/entry-schedule.ts',
);
const { parseCalendarDate } = load('src/shared/finance/calendar-date.ts');
const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
test('parcelas preservam cada centavo e a soma, inclusive valores pequenos', () => {
  for (let cents = 1; cents <= 1000; cents++)
    for (const count of [1, 2, 3, 7, 12].filter((n) => n <= cents)) {
      const values = installmentAmounts(cents / 100, count);
      assert.equal(
        values.reduce((sum, value) => sum + Math.round(value * 100), 0),
        cents,
      );
      assert.equal(values.length, count);
      assert.ok(values.every((value) => value > 0));
    }
  assert.deepEqual(
    Array.from(installmentAmounts(100, 3)),
    [33.33, 33.33, 33.34],
  );
});
test('rejeita centavos fracionários, parcelas fracionárias e estouro de precisão', () => {
  for (const amount of [0, -1, NaN, Infinity, 1.001, Number.MAX_SAFE_INTEGER])
    assert.throws(() => amountToCents(amount));
  for (const count of [0, 1.5, 361, NaN, Infinity])
    assert.throws(() => installmentAmounts(10, count));
  assert.throws(() => installmentAmounts(0.01, 2));
});
test('datas mensais preservam âncora em janeiro, fevereiro bissexto e março', () => {
  const anchor = new Date(2024, 0, 31);
  assert.equal(iso(occurrenceDate(anchor, 1)), '2024-02-29');
  assert.equal(iso(occurrenceDate(anchor, 2)), '2024-03-31');
  assert.equal(iso(anchor), '2024-01-31');
  assert.equal(iso(occurrenceDate(new Date(2025, 0, 31), 1)), '2025-02-28');
});
test('recorrência semanal avança sete dias, inclusive virada de ano', () => {
  assert.equal(
    iso(occurrenceDate(new Date(2026, 11, 28), 1, 'weekly')),
    '2027-01-04',
  );
  assert.equal(
    iso(occurrenceDate(new Date(2026, 11, 28), 2, 'weekly')),
    '2027-01-11',
  );
});
test('datas inválidas não são corrigidas silenciosamente pelo JavaScript', () => {
  for (const value of [
    '2026-02-30',
    '2026-13-01',
    '2026-00-01',
    '2026-01-00',
    'texto',
    new Date(NaN),
  ])
    assert.equal(parseCalendarDate(value), null);
  assert.equal(
    iso(parseCalendarDate('2024-02-29T00:00:00.000Z')),
    '2024-02-29',
  );
});
