import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('avalia fontes habilitadas e usa chave estável para não duplicar avisos', async () => {
  const notifications = new Map();
  let scheduled = 0;
  const settings = {
    investmentYieldEnabled: true,
    billDueEnabled: true,
    billDueDaysBefore: 3,
    lowBalanceEnabled: true,
    lowBalanceThreshold: 100,
    budgetExceededEnabled: true,
    budgetThresholdPercent: 80,
    goalReachedEnabled: true,
    invoiceClosingEnabled: true,
    invoiceClosingDaysBefore: 3,
  };
  const database = {
    query: async (sql, values) => {
      if (sql.startsWith('INSERT'))
        notifications.set(
          [values[0], values[1], values[5], values[6]].join('|'),
          values,
        );
      if (sql.includes('FROM investments')) return [{ id: 7, name: 'CDB' }];
      if (sql.includes('FROM goals')) return [{ id: 3, name: 'Reserva' }];
      if (sql.includes('FROM accounts'))
        return [{ id: 4, name: 'Cartão', closingDay: new Date().getDate() }];
      return [];
    },
  };
  const dependencies = {
    '@main/infrastructure/database/data-source': {
      getDataSource: () => database,
    },
    './notification-service': {
      NotificationService: class {
        async getSettings() {
          return settings;
        }
        async processScheduledNotifications() {
          scheduled++;
        }
      },
    },
    './alert-service': {
      AlertService: class {
        async checkAlerts() {
          return [
            {
              alertId: 1,
              status: 'critical',
              categoryName: 'Moradia',
              percentage: 110,
            },
          ];
        }
      },
    },
    './budget-service': {
      BudgetService: class {
        async findAll() {
          return [{ id: 2, percentUsed: 110, categoryName: 'Mercado' }];
        }
      },
    },
    '../repositories/repository-cache': {
      repositoryCache: {
        transactionRepository: {
          findUpcomingBills: async () => [
            { id: 5, description: 'Conta', dueDate: '2026-11-01' },
          ],
        },
        accountRepository: {
          findAllByUserId: async () => [
            { id: 6, name: 'Carteira', balance: 10 },
          ],
        },
      },
    },
  };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        'src/main/application/services/notification-evaluation-service.ts',
        'utf8',
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
    { exports, require: (name) => dependencies[name], Date },
  );
  const service = new exports.NotificationEvaluationService();
  await service.refresh(42);
  await service.refresh(42);
  assert.equal(notifications.size, 7);
  assert.equal(scheduled, 2);
  notifications.clear();
  for (const key of Object.keys(settings))
    if (typeof settings[key] === 'boolean') settings[key] = false;
  await service.refresh(42);
  assert.equal(notifications.size, 1);
  assert.equal([...notifications.values()][0][1], 'custom');
});
