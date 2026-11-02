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
        if (!(name in deps)) throw new Error(name);
        return deps[name];
      },
    },
  );
  return exports;
}
const calendar = load('src/shared/finance/calendar-date.ts');
const { nextRecurringDate, isBrazilBusinessDay } = load(
  'src/shared/finance/recurring-schedule.ts',
  { './calendar-date': calendar },
);
const day = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
test('primeiro dia útil exclui feriados nacionais e finais de semana', () => {
  for (const [start, expected] of [
    ['2026-05-01', '2026-05-04'],
    ['2026-11-01', '2026-11-03'],
    ['2027-01-01', '2027-01-04'],
  ])
    assert.equal(
      day(
        nextRecurringDate(
          start,
          'monthly',
          undefined,
          undefined,
          false,
          'first_business_day',
        ),
      ),
      expected,
    );
  for (const date of ['2026-04-03', '2026-11-20', '2026-12-25'])
    assert.equal(isBrazilBusinessDay(calendar.parseCalendarDate(date)), false);
  assert.equal(
    isBrazilBusinessDay(calendar.parseCalendarDate('2026-02-17')),
    true,
    'Carnaval não é feriado nacional neste calendário',
  );
});
test('último dia útil, fevereiro bissexto e virada do ano', () => {
  assert.equal(
    day(
      nextRecurringDate(
        '2026-05-01',
        'monthly',
        undefined,
        undefined,
        false,
        'last_business_day',
      ),
    ),
    '2026-05-29',
  );
  assert.equal(
    day(
      nextRecurringDate(
        '2028-02-01',
        'monthly',
        undefined,
        undefined,
        false,
        'last_business_day',
      ),
    ),
    '2028-02-29',
  );
  assert.equal(
    day(
      nextRecurringDate(
        '2026-12-31',
        'monthly',
        undefined,
        undefined,
        true,
        'first_business_day',
      ),
    ),
    '2027-01-04',
  );
});
test('não agenda antes do início e mantém âncora 31 após fevereiro', () => {
  assert.equal(
    day(
      nextRecurringDate(
        '2026-05-05',
        'monthly',
        undefined,
        undefined,
        false,
        'first_business_day',
      ),
    ),
    '2026-06-01',
  );
  const feb = nextRecurringDate('2026-01-31', 'monthly', 31, undefined, true);
  assert.equal(day(feb), '2026-02-28');
  assert.equal(
    day(nextRecurringDate(feb, 'monthly', 31, undefined, true)),
    '2026-03-31',
  );
  assert.equal(
    day(
      nextRecurringDate(
        new Date(2026, 4, 4, 15),
        'monthly',
        undefined,
        undefined,
        false,
        'first_business_day',
      ),
    ),
    '2026-05-04',
  );
});
test('rejeita calendário inválido, regra incompatível e parâmetros fora do domínio', () => {
  assert.throws(() => nextRecurringDate('2026-02-30', 'monthly'));
  assert.throws(() =>
    nextRecurringDate(
      '2026-01-01',
      'weekly',
      undefined,
      undefined,
      false,
      'first_business_day',
    ),
  );
  assert.throws(() => nextRecurringDate('2026-01-01', 'monthly', 32));
  assert.throws(() => nextRecurringDate('2026-01-01', 'weekly', undefined, 7));
});
