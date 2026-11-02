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
  diagnostics: {prefix:'diagnostics',methods:['snapshot'] as const},
  financing: { prefix: 'financing', methods: ['list','create','detail','pay','reverse','adjust'] as const },
  externalData: { prefix: 'externalData', methods: ['snapshot'] as const },
  onboarding: { prefix: 'onboarding', methods: ['state', 'advance'] as const },
  listing: { prefix: 'listing', methods: ['query'] as const },
  backup: { prefix: 'backup', methods: ['export', 'restore'] as const },
  investment: {
    prefix: 'investment',
    methods: [
      'list',
      'query',
      'create',
      'recordYield',
      'remove',
      'event',
    ] as const,
  },
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
      'recalculateBalance',
      'recalculateAllBalances',
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
      'findUpcomingBills',
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
      'occurrences','dismissOccurrence',
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
      'generateReport',
      'generatePDF',
      'generateCSV',
      'getExpensesByCategory',
      'getIncomeVsExpenses',
    ] as const satisfies readonly (keyof IReportController)[],
  },

  import: {
    prefix: 'import',
    methods: [
      'getCSVPreview',
      'previewImport',
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

  budget: {
    prefix: 'budget',
    methods: [
      'create',
      'update',
      'delete',
      'findById',
      'findAll',
      'getSummary',
      'getAlerts',
      'copyFromPreviousMonth',
    ] as const,
  },

  tag: {
    prefix: 'tag',
    methods: [
      'create',
      'update',
      'delete',
      'findAll',
      'getTransactionTags',
      'setTransactionTags',
    ] as const,
  },

  transfer: {
    prefix: 'transfer',
    methods: ['create', 'delete', 'findById', 'findAll', 'getSummary'] as const,
  },

  notification: {
    prefix: 'notification',
    methods: [
      'refresh',
      'findAll',
      'getSummary',
      'markAsRead',
      'markAllAsRead',
      'dismiss',
      'delete',
      'getSettings',
      'updateSettings',
      'processScheduled',
    ] as const,
  },

  recurring: {
    prefix: 'recurring',
    methods: [
      'create',
      'update',
      'delete',
      'findById',
      'findAll',
      'generate',
    ] as const,
  },

  bankImport: {
    prefix: 'bankImport',
    methods: [
      'create',
      'process',
      'findById',
      'getTransactions',
      'getReconciliationSuggestions',
      'delete',
    ] as const,
  },

  advancedReport: {
    prefix: 'advancedReport',
    methods: [
      'reserveSources','configureReserve','queryV2',
      'yearComparison',
      'trendAnalysis',
      'spendingPatterns',
      'categoryBreakdown',
      'financialHealth',
      'incomeVsExpenseHistory',
    ] as const,
  },

  cashFlow: {
    prefix: 'cashFlow',
    methods: ['getProjection', 'getMonthlyProjections'] as const,
  },

  currency: {
    prefix: 'currency',
    methods: [
      'create',
      'update',
      'delete',
      'findAll',
      'findByCode',
      'getDefault',
      'setDefault',
      'convert',
      'updateRates',
    ] as const,
  },

  attachment: {
    prefix: 'attachment',
    methods: ['upload', 'delete', 'findByTransaction', 'getFile'] as const,
  },
} as const;

export type ControllerConfigType = typeof CONTROLLER_CONFIG;

