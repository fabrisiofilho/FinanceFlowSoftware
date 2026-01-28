import type { IFinanceAuthController } from '@shared/interfaces/controllers/finance-auth.controller.interface';
import type { IAccountController } from '@shared/interfaces/controllers/account.controller.interface';
import type { ICategoryController } from '@shared/interfaces/controllers/category.controller.interface';
import type { ITransactionController } from '@shared/interfaces/controllers/transaction.controller.interface';
import type { IGoalController } from '@shared/interfaces/controllers/goal.controller.interface';
import type { IAlertController } from '@shared/interfaces/controllers/alert.controller.interface';
import type { ICreditCardController } from '@shared/interfaces/controllers/credit-card.controller.interface';
import type { IReportController } from '@shared/interfaces/controllers/report.controller.interface';
import type { IImportController } from '@shared/interfaces/controllers/import.controller.interface';
import type { IAutoUpdaterController } from '@shared/interfaces/types/auto-updater.types';

export const CONTROLLER_CONFIG = {
  financeAuth: {
    prefix: 'financeAuth',
    methods: [
      'register',
      'login',
      'logout',
      'checkAuth',
      'getCurrentUser',
      'updateProfile',
      'changePassword',
    ] as const satisfies readonly (keyof IFinanceAuthController)[],
  },

  account: {
    prefix: 'account',
    methods: [
      'create',
      'update',
      'delete',
      'findById',
      'findAll',
      'getBalance',
      'getTotalBalance',
    ] as const satisfies readonly (keyof IAccountController)[],
  },

  category: {
    prefix: 'category',
    methods: [
      'create',
      'update',
      'delete',
      'findById',
      'findAll',
      'findByType',
      'initializeDefaults',
    ] as const satisfies readonly (keyof ICategoryController)[],
  },

  transaction: {
    prefix: 'transaction',
    methods: [
      'create',
      'update',
      'delete',
      'deleteMany',
      'findById',
      'findAll',
      'findByPeriod',
      'findByCategory',
      'getMonthSummary',
    ] as const satisfies readonly (keyof ITransactionController)[],
  },

  goal: {
    prefix: 'goal',
    methods: [
      'create',
      'update',
      'delete',
      'findById',
      'findAll',
      'addContribution',
      'getProgress',
    ] as const satisfies readonly (keyof IGoalController)[],
  },

  alert: {
    prefix: 'alert',
    methods: [
      'create',
      'update',
      'delete',
      'findAll',
      'checkAlerts',
    ] as const satisfies readonly (keyof IAlertController)[],
  },

  creditCard: {
    prefix: 'creditCard',
    methods: [
      'getInvoices',
      'getInvoiceDetails',
      'payInvoice',
      'getCreditCardsSummary',
      'getCreditCardSummary',
      'closeCurrentInvoice',
    ] as const satisfies readonly (keyof ICreditCardController)[],
  },

  report: {
    prefix: 'report',
    methods: [
      'generatePDF',
      'generateCSV',
      'getExpensesByCategory',
      'getIncomeVsExpenses',
    ] as const satisfies readonly (keyof IReportController)[],
  },

  import: {
    prefix: 'import',
    methods: [
      'previewCSV',
      'importCSV',
    ] as const satisfies readonly (keyof IImportController)[],
  },

  autoUpdater: {
    prefix: 'autoUpdater',
    methods: [
      'getAppVersion',
      'checkForUpdates',
      'downloadUpdate',
      'installUpdate',
      'getUpdateState',
    ] as const satisfies readonly (keyof IAutoUpdaterController)[],
  },
} as const;

export type ControllerConfigType = typeof CONTROLLER_CONFIG;
