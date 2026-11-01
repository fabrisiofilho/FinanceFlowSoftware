import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
function compile(path, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      require: (name) => dependencies[name] ?? require(name),
    },
  );
  return exports;
}
test('relatório encaminha filtros e agrega todas as competências selecionadas', async () => {
  const dates = compile('src/main/infrastructure/utils/date-utils.ts');
  const { ReportService } = compile(
    'src/main/application/services/report-service.ts',
    {
      '@main/infrastructure/log/logger': {
        logger: { info: () => undefined, success: () => undefined },
      },
      '../repositories/repository-cache': { repositoryCache: {} },
      '@main/infrastructure/utils/date-utils': dates,
      electron: { app: {} },
    },
  );
  let received;
  const service = new ReportService({
    findWithFiltersNoPagination: async (userId, filters) => {
      received = { userId, filters };
      return [
        {
          amount: 100,
          type: 'expense',
          transactionDate: '2026-11-01',
          categoryId: 3,
          category: { name: 'Moradia' },
        },
        {
          amount: 200,
          type: 'expense',
          transactionDate: '2026-12-01',
          categoryId: 3,
          category: { name: 'Moradia' },
        },
      ];
    },
  });
  const report = await service.generateReport(42, {
    startDate: new Date(2026, 10, 1),
    endDate: new Date(2026, 11, 31),
    categoryId: 3,
    accountId: 7,
    type: 'expense',
  });
  assert.equal(received.userId, 42);
  assert.equal(received.filters.categoryId, 3);
  assert.equal(received.filters.accountId, 7);
  assert.equal(received.filters.type, 'expense');
  assert.equal(report.summary.totalExpenses, 300);
  assert.equal(report.summary.balance, -300);
  assert.equal(report.summary.expensesByCategory[0].totalAmount, 300);
  assert.equal(report.incomeVsExpenses.length, 2);
  assert.equal(report.incomeVsExpenses[0].month, 11);
  assert.equal(report.incomeVsExpenses[1].expense, 200);
});
