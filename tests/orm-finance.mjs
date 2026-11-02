import { verifyRoadmap } from './roadmap-orm.mjs';
import Module, { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import process from 'node:process';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith('@main/'))
    request = path.resolve('src/main', request.slice(6));
  if (request.startsWith('@shared/'))
    request = path.resolve('src/shared', request.slice(8));
  return originalResolve.call(this, request, ...args);
};
const log = new Proxy(
  { colors: new Proxy({}, { get: () => (value) => value }) },
  { get: (target, key) => target[key] ?? (() => {}) },
);
Module._load = function (request, ...args) {
  if (request === '@main/infrastructure/log/logger') return { logger: log };
  return originalLoad.call(this, request, ...args);
};
Module._extensions['.ts'] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: 1,
        target: 9,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
process.env.NODE_ENV = 'development';
const directory = fs.mkdtempSync(path.resolve('.qa', 'orm-finance-'));
const file = path.join(directory, 'test.sqlite');
const database = require('../src/main/infrastructure/database/data-source.ts');
try {
  database.setDatabasePath(file);
  await database.initializeDatabase();
  const source = database.getDataSource();
  // Prova que cada coluna mapeada existe no esquema entregue, inclusive payment_date.
  for (const metadata of source.entityMetadatas) {
    const columns = await source.query(
      `PRAGMA table_info("${metadata.tableName}")`,
    );
    const names = new Set(columns.map((column) => column.name));
    for (const column of metadata.columns)
      assert.ok(
        names.has(column.databaseName),
        `${metadata.tableName}.${column.databaseName} ausente`,
      );
    await source.getRepository(metadata.target).find({ take: 1 });
  }
  await source.query(
    "INSERT INTO finance_users(id,name,email,password_hash) VALUES(1,'Teste','orm@example.test','dummy')",
  );
  await source.query(
    "INSERT INTO categories(id,user_id,name,type) VALUES(100,1,'Despesa','expense'),(101,1,'Receita','income')",
  );
  const {
    AccountService,
  } = require('../src/main/application/services/account-service.ts');
  const {
    TransactionService,
  } = require('../src/main/application/services/transaction-service.ts');
  const {
    TransferService,
  } = require('../src/main/application/services/transfer-service.ts');
  const {
    InvestmentRepository,
  } = require('../src/main/application/repositories/investment-repository.ts');
  const {
    BalanceCalculatorService,
  } = require('../src/main/application/services/balance-calculator-service.ts');
  const accounts = new AccountService(),
    entries = new TransactionService();
  const account = await accounts.create(1, {
    name: 'Conta teste',
    type: 'checking',
    balance: 50000,
  });
  assert.equal(account.balance, 50000);
  const fractionalAccount = await accounts.create(1, {
    name: 'Saldo fracionado',
    type: 'wallet',
    balance: 123.45,
  });
  assert.equal(fractionalAccount.balance, 123.45);
  assert.equal(await accounts.getBalance(1, fractionalAccount.id), 123.45);
  await accounts.delete(1, fractionalAccount.id);
  const other = await accounts.create(1, {
    name: 'Outra conta',
    type: 'checking',
    balance: 0,
  });
  const cash = () => accounts.getBalance(1, account.id);
  const input = {
    description: 'Teste real ORM',
    amount: 100,
    type: 'expense',
    transactionDate: new Date(2026, 0, 1),
    status: 'pending',
    accountId: account.id,
    categoryId: 100,
  };
  const pending = await entries.create(1, input);
  assert.equal(await cash(), 50000);
  await entries.update(1, pending.id, {
    status: 'settled',
    settlementDate: new Date(2026, 1, 1),
  });
  assert.equal(await cash(), 49900);
  await entries.update(1, pending.id, { status: 'cancelled' });
  assert.equal(await cash(), 50000);
  await entries.delete(1, pending.id);
  assert.equal(await cash(), 50000);
  await entries.create(1, {
    ...input,
    amount: 5000,
    type: 'income',
    categoryId: 101,
    status: 'settled',
    settlementDate: new Date(2026, 1, 1),
  });
  await entries.create(1, {
    ...input,
    amount: 1200,
    status: 'settled',
    settlementDate: new Date(2026, 1, 2),
  });
  const summary = await entries.getMonthSummary(1, 2026, 2);
  assert.equal(summary.received - summary.paid, 3800);
  const transfer = new TransferService();
  await transfer.create(1, {
    fromAccountId: account.id,
    toAccountId: other.id,
    amount: 1000,
    transferDate: new Date(2026, 0, 5),
  });
  assert.equal(await accounts.getTotalBalance(1), 53800);
  const monthly = await entries.getMonthSummary(1, 2026, 0 + 1);
  assert.equal(monthly.totalIncome, 5000);
  assert.equal(monthly.totalExpenses, 1200);
  const investments = new InvestmentRepository();
  await investments.create(1, {
    name: 'CDB teste',
    kind: 'CDB',
    principalCents: 1000000,
    startMonth: '2026-01',
    monthlyRate: 0,
    accountId: account.id,
  });
  assert.equal(await cash(), 42800);
  const recheck =
    await new BalanceCalculatorService().recalculateAccountBalance(
      1,
      account.id,
    );
  assert.equal(recheck, 42800);
  const raw = await source.query(
    'SELECT balance,typeof(balance) AS storage FROM accounts WHERE id=?',
    [account.id],
  );
  assert.equal(raw[0].balance, 4280000);
  assert.equal(raw[0].storage, 'integer');
  const card = await accounts.create(1, {
    name: 'Cartão teste',
    type: 'credit_card',
    creditLimit: 1000,
    closingDay: 20,
  });
  await entries.create(1, {
    ...input,
    accountId: card.id,
    amount: 300,
    paymentMethod: 'credit',
    status: 'settled',
    settlementDate: new Date(2026, 0, 10),
  });
  const invoices = await source.query(
    'SELECT id,total_amount FROM credit_card_invoices WHERE account_id=? AND total_amount>0',
    [card.id],
  );
  assert.equal(invoices.length, 1);
  assert.equal(invoices[0].total_amount, 30000);
  const {
    CreditCardService,
  } = require('../src/main/application/services/credit-card-service.ts');
  const cards = new CreditCardService();
  await assert.rejects(() =>
    cards.payInvoice(1, {
      invoiceId: invoices[0].id,
      paymentAccountId: account.id,
      amount: 100,
    }),
  );
  assert.equal(await cash(), 42800);
  await cards.payInvoice(1, {
    invoiceId: invoices[0].id,
    paymentAccountId: account.id,
  });
  assert.equal(await cash(), 42500);
  await assert.rejects(() =>
    cards.payInvoice(1, {
      invoiceId: invoices[0].id,
      paymentAccountId: account.id,
    }),
  );
  assert.equal(await cash(), 42500);
  assert.equal(
    await new BalanceCalculatorService().recalculateAccountBalance(
      1,
      account.id,
    ),
    42500,
  );

  const {
    RecurringTransactionEntity,
  } = require('../src/main/application/entities/recurring-transaction.entity.ts');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const rule = await source.getRepository(RecurringTransactionEntity).save({
    userId: 1,
    description: 'Regra teste',
    amount: 50,
    type: 'expense',
    paymentMethod: 'debit',
    frequency: 'monthly',
    startDate: now,
    nextOccurrence: now,
    dayOfMonth: now.getDate(),
    isActive: true,
    autoConfirm: false,
    accountId: account.id,
    categoryId: 100,
  });
  const {
    RecurringTransactionService,
  } = require('../src/main/application/services/recurring-transaction-service.ts');
  const recurring = new RecurringTransactionService();
  const before = await cash();
  await Promise.all([
    recurring.generatePendingTransactions(1),
    recurring.generatePendingTransactions(1),
  ]);
  const again = await recurring.generatePendingTransactions(1);
  assert.equal(again.generated.length, 0);
  const occurrences = await source.query(
    'SELECT id,status,amount FROM transactions WHERE recurring_rule_id=?',
    [rule.id],
  );
  assert.equal(occurrences.length, 1);
  assert.equal(occurrences[0].status, 'pending');
  assert.equal(occurrences[0].amount, 5000);
  assert.equal(await cash(), before);
  const recurringInput = {
    description: 'Regra de dia útil',
    amount: 10,
    type: 'expense',
    paymentMethod: 'debit',
    frequency: 'monthly',
    accountId: account.id,
    categoryId: 100,
    startDate: new Date(2026, 4, 1),
    endDate: new Date(2026, 4, 10),
    monthlyRule: 'first_business_day',
  };
  for (const invalid of [
    { description: '   ' },
    { amount: NaN },
    { amount: 0.001 },
    { frequency: 'weekly' },
    { monthlyRule: 'unknown' },
    { startDate: '2026-02-30' },
    { accountId: -1 },
  ])
    await assert.rejects(() =>
      recurring.create(1, { ...recurringInput, ...invalid }),
    );
  const businessRule = await recurring.create(1, recurringInput);
  assert.equal(businessRule.nextOccurrence.getMonth(), 4);
  assert.equal(businessRule.nextOccurrence.getDate(), 4);
  assert.equal(businessRule.monthlyRule, 'first_business_day');
  const unchanged = await recurring.update(1, businessRule.id, {
    description: 'Descrição revisada',
    frequency: 'monthly',
    monthlyRule: 'first_business_day',
    userId: 999,
    nextOccurrence: new Date(2030, 0, 1),
  });
  assert.equal(unchanged.userId, 1);
  assert.equal(
    unchanged.nextOccurrence.getTime(),
    businessRule.nextOccurrence.getTime(),
    'editar descrição não reagenda ocorrência',
  );
  await recurring.generatePendingTransactions(1);
  const generatedBusiness = await source.query(
    'SELECT transaction_date FROM transactions WHERE recurring_rule_id=?',
    [businessRule.id],
  );
  assert.equal(generatedBusiness.length, 1);
  assert.equal(generatedBusiness[0].transaction_date, '2026-05-04');
  await recurring.generatePendingTransactions(1);
  assert.equal(
    (
      await source.query(
        'SELECT id FROM transactions WHERE recurring_rule_id=?',
        [businessRule.id],
      )
    ).length,
    1,
  );
  const moved = await entries.create(1, { ...input, status: 'pending' });
  await entries.update(1, moved.id, {
    accountId: other.id,
    status: 'settled',
    settlementDate: new Date(2026, 1, 1),
  });
  assert.equal(await accounts.getBalance(1, other.id), 900);
  await entries.update(1, moved.id, {
    type: 'income',
    categoryId: 101,
    amount: 150,
  });
  assert.equal(await accounts.getBalance(1, other.id), 1150);
  await entries.delete(1, moved.id);
  assert.equal(await accounts.getBalance(1, other.id), 1000);
  const transferRows = await source.query(
    "SELECT id FROM transactions WHERE origin='transfer'",
  );
  await assert.rejects(() => entries.deleteMany(1, [transferRows[0].id]));
  assert.equal(await cash(), before);
  const [purchase] = await source.query(
    'SELECT id FROM transactions WHERE credit_card_invoice_id=?',
    [invoices[0].id],
  );
  await assert.rejects(() => entries.deleteMany(1, [purchase.id]));

  const {
    CashFlowService,
  } = require('../src/main/application/services/cash-flow-service.ts');
  const flow = new CashFlowService();
  const forecastIncome = await entries.create(1, {
    ...input,
    type: 'income',
    categoryId: 101,
    amount: 321.12,
    transactionDate: new Date(2027, 0, 1),
    dueDate: new Date(2027, 1, 28),
  });
  const forecastExpense = await entries.create(1, {
    ...input,
    amount: 41.12,
    transactionDate: new Date(2027, 0, 1),
    dueDate: new Date(2027, 1, 28),
  });
  const forecast = await flow.getProjection(1, {
    startDate: new Date(2027, 1, 1),
    endDate: new Date(2027, 1, 28),
    includeRecurring: false,
  });
  assert.equal(forecast.currentBalance, await accounts.getTotalBalance(1));
  assert.equal(forecast.totalIncome, 321.12);
  assert.equal(forecast.totalExpenses, 41.12);
  assert.equal(forecast.projectedBalance, forecast.currentBalance + 280);
  const withoutBills = await flow.getProjection(1, {
    startDate: new Date(2027, 1, 1),
    endDate: new Date(2027, 1, 28),
    includeRecurring: false,
    includePendingBills: false,
  });
  assert.equal(withoutBills.totalIncome, 321.12);
  assert.equal(withoutBills.totalExpenses, 0);
  const {
    CreditCardInvoiceEntity,
  } = require('../src/main/application/entities/credit-card-invoice.entity.ts');
  const pendingInvoice = await source
    .getRepository(CreditCardInvoiceEntity)
    .save({
      accountId: card.id,
      year: 2027,
      month: 2,
      totalAmount: 77.23,
      dueDate: new Date(2027, 1, 28),
      status: 'closed',
    });
  const withInvoice = await flow.getProjection(1, {
    startDate: new Date(2027, 1, 1),
    endDate: new Date(2027, 1, 28),
    includeRecurring: false,
  });
  assert.equal(withInvoice.totalExpenses, 118.35);
  const accountOnly = await flow.getProjection(1, {
    startDate: new Date(2027, 1, 1),
    endDate: new Date(2027, 1, 28),
    includeRecurring: false,
    accountId: account.id,
  });
  assert.equal(accountOnly.totalExpenses, 41.12);
  await source.getRepository(CreditCardInvoiceEntity).delete(pendingInvoice.id);
  await entries.deleteMany(1, [forecastIncome.id, forecastExpense.id]);
  await assert.rejects(() => flow.getMonthlyProjections(1, 0));
  await assert.rejects(() =>
    flow.getProjection(1, {
      startDate: new Date(2027, 1, 1),
      endDate: new Date(2027, 0, 1),
    }),
  );
  await source.getRepository(RecurringTransactionEntity).save({
    ...rule,
    id: undefined,
    description: 'Fim de mês',
    nextOccurrence: new Date(2027, 0, 31),
    startDate: new Date(2027, 0, 31),
    endDate: new Date(2027, 1, 28),
    dayOfMonth: 31,
  });
  const future = await flow.getProjection(1, {
    startDate: new Date(2027, 0, 1),
    endDate: new Date(2027, 2, 31),
  });
  const occurrencesInForecast = future.projections
    .flatMap((day) => day.details)
    .filter((detail) => detail.description.includes('Fim de mês'));
  assert.deepEqual(
    occurrencesInForecast.map((detail) => [
      detail.date.getMonth() + 1,
      detail.date.getDate(),
    ]),
    [
      [1, 31],
      [2, 28],
    ],
  );
  const {
    DashboardService,
  } = require('../src/main/application/services/dashboard-service.ts');
  const {
    AdvancedReportService,
  } = require('../src/main/application/services/advanced-report-service.ts');
  const {
    ReportService,
  } = require('../src/main/application/services/report-service.ts');
  const {
    BudgetService,
  } = require('../src/main/application/services/budget-service.ts');
  const advanced = new AdvancedReportService();
  const {
    NotificationService,
  } = require('../src/main/application/services/notification-service.ts');
  const notifications = new NotificationService();
  assert.equal((await notifications.getSettings(1)).lowBalanceThreshold, 100);
  assert.equal((await notifications.getSettings(1)).lowBalanceThreshold, 100);
  assert.equal(
    (await notifications.updateSettings(1, { lowBalanceThreshold: 123.45 }))
      .lowBalanceThreshold,
    123.45,
  );
  assert.equal(
    (await notifications.getSettings(1)).lowBalanceThreshold,
    123.45,
  );
  const {
    GoalService,
  } = require('../src/main/application/services/goal-service.ts');
  const goal = await new GoalService().create(1, {
    name: 'Meta fracionada',
    targetAmount: 987.65,
  });
  assert.equal(goal.targetAmount, 987.65);
  assert.equal(goal.currentAmount, 0);
  await new DashboardService().getDashboardData(1, { year: 2026, month: 2 });
  await new ReportService().generateReport(1, {
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 11, 31),
  });
  await new BudgetService().getSummary(1, 2026, 2);
  await advanced.getYearComparison(1, 2026);
  await advanced.getTrendAnalysis(1, 12);
  await advanced.getSpendingPatterns(1, {
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 11, 31),
  });
  await advanced.getCategoryBreakdown(1, {
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 11, 31),
  });
  await advanced.getFinancialHealth(1);
  await advanced.getIncomeVsExpenseHistory(1, 12);
  await flow.getMonthlyProjections(1, 6);
  const {
    ImportService,
  } = require('../src/main/application/services/import-service.ts');
  const importedAccount = await accounts.create(1, {
    name: 'Importação teste',
    type: 'checking',
    balance: 0,
  });
  const genericImport = await new ImportService().importTransactions(
    1,
    {
      defaultAccountId: importedAccount.id,
      hasHeader: true,
      delimiter: ';',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: 'brazilian',
      columnMappings: [],
      incomeKeywords: [],
      expenseKeywords: [],
    },
    [
      {
        description: 'Receita CSV teste',
        amount: 12.34,
        type: 'income',
        date: new Date(2026, 3, 5),
        rawRow: [],
      },
    ],
  );
  assert.equal(genericImport.transactionsCreated, 1);
  assert.equal(await accounts.getBalance(1, importedAccount.id), 12.34);
  const importedRows = await source.query(
    'SELECT id,status,settlement_date FROM transactions WHERE account_id=?',
    [importedAccount.id],
  );
  assert.equal(importedRows[0].status, 'settled');
  assert.equal(importedRows[0].settlement_date, '2026-04-05');
  const {
    BankImportEntity,
  } = require('../src/main/application/entities/bank-import.entity.ts');
  const {
    BankImportTransactionEntity,
  } = require('../src/main/application/entities/bank-import-transaction.entity.ts');
  const {
    BankImportService,
  } = require('../src/main/application/services/bank-import-service.ts');
  const importGroup = await source.getRepository(BankImportEntity).save({
    userId: 1,
    accountId: importedAccount.id,
    bankCode: 'other',
    filename: 'ficticio.csv',
    fileType: 'csv',
  });
  const importedRow = await source
    .getRepository(BankImportTransactionEntity)
    .save({
      importId: importGroup.id,
      description: 'Receita extrato teste',
      amount: 56.78,
      type: 'income',
      transactionDate: new Date(2026, 3, 6),
    });
  const bankImporter = new BankImportService();
  const request = {
    importId: importGroup.id,
    actions: [
      {
        importTransactionId: importedRow.id,
        action: 'import',
        categoryId: 101,
      },
    ],
  };
  assert.equal((await bankImporter.processImport(1, request)).imported, 1);
  assert.equal((await bankImporter.processImport(1, request)).imported, 0);
  assert.equal(await accounts.getBalance(1, importedAccount.id), 69.12);
  assert.equal(
    await new BalanceCalculatorService().recalculateAccountBalance(
      1,
      importedAccount.id,
    ),
    69.12,
  );
  const importEntries = await source.query(
    'SELECT id FROM transactions WHERE account_id=?',
    [importedAccount.id],
  );
  await entries.deleteMany(
    1,
    importEntries.map((row) => row.id),
  );
  const otherUser = await flow.getProjection(999, {
    startDate: new Date(2027, 0, 1),
    endDate: new Date(2027, 2, 31),
  });
  assert.equal(otherUser.currentBalance, 0);
  assert.equal(otherUser.netCashFlow, 0);

  const pagedInvestments = await investments.query(1, { page: 0, size: 1 });
  assert.ok(pagedInvestments.investments.length <= 1);
  const allInvestments = await investments.list(1);
  const allYields = await investments.yields(1);
  assert.equal(
    pagedInvestments.summary.principalCents,
    allInvestments.reduce((sum, item) => sum + item.principalCents, 0),
  );
  assert.equal(
    pagedInvestments.summary.yieldCents,
    allYields.reduce((sum, item) => sum + item.amountCents, 0),
  );
  assert.equal((await investments.query(999, {})).totalElements, 0);
  await assert.rejects(() => investments.query(1, { size: 101 }), /Paginação/);
  const {
    AlertService,
  } = require('../src/main/application/services/alert-service.ts');
  await assert.rejects(
    () =>
      new BudgetService().create(999, {
        categoryId: 100,
        year: 2026,
        month: 1,
        plannedAmount: 10,
      }),
    /Categoria não encontrada/,
  );
  await assert.rejects(
    () => new AlertService().create(999, { categoryId: 100, limitAmount: 10 }),
    /Categoria não encontrada/,
  );
  await assert.rejects(
    () =>
      new RecurringTransactionService().create(999, {
        description: 'Regra alheia',
        amount: 10,
        type: 'expense',
        frequency: 'monthly',
        accountId: account.id,
        categoryId: 100,
        startDate: new Date(),
      }),
    /Conta não encontrada/,
  );
  // Regressões de integridade/autorização e listagens da evolução de produto.
  const {
    ListingService,
  } = require('../src/main/application/services/listing-service.ts');
  const listing = new ListingService();
  const {
    CategoryService,
  } = require('../src/main/application/services/category-service.ts');
  const categoriesService = new CategoryService();
  await categoriesService.initializeDefaults();
  const defaultsBefore = await source.query(
    'SELECT id,icon FROM categories WHERE is_default=1',
  );
  await categoriesService.initializeDefaults();
  assert.equal(
    (await source.query('SELECT id FROM categories WHERE is_default=1')).length,
    defaultsBefore.length,
  );
  assert.ok(
    defaultsBefore.every((item) => /^[A-Z]/.test(item.icon)),
    JSON.stringify(defaultsBefore),
  );
  const testAccount = await accounts.create(1, {
    name: 'Prova % literal',
    type: 'checking',
    balance: 10,
    cardColor: '#00bcd4',
  });
  assert.equal(testAccount.cardColor, '#00bcd4');
  await accounts.updateBalance(1, testAccount.id, 25.67);
  assert.equal(
    await new BalanceCalculatorService().recalculateAccountBalance(
      1,
      testAccount.id,
    ),
    25.67,
  );
  await assert.rejects(
    () =>
      accounts.update(1, testAccount.id, {
        imageData: 'data:image/png;base64,YWJj',
      }),
    /Imagem/,
  );
  assert.equal(
    (
      await listing.query(1, {
        kind: 'accounts',
        search: '% literal',
        page: 0,
        size: 1,
      })
    ).totalElements,
    1,
  );
  assert.equal(
    (await listing.query(999, { kind: 'accounts', search: '% literal' }))
      .totalElements,
    0,
  );
  await assert.rejects(
    () => listing.query(1, { kind: 'accounts', page: -1 }),
    /Paginação/,
  );
  await assert.rejects(
    () => listing.query(1, { kind: 'accounts', size: 1000 }),
    /Paginação/,
  );
  for (let index = 0; index < 26; index++)
    await accounts.create(1, {
      name: 'Paginação ' + index,
      type: index % 2 ? 'wallet' : 'checking',
    });
  const firstPage = await listing.query(1, {
    kind: 'accounts',
    search: 'Paginação',
    types: ['wallet', 'checking'],
    page: 0,
    size: 24,
  });
  const secondPage = await listing.query(1, {
    kind: 'accounts',
    search: 'Paginação',
    types: ['wallet', 'checking'],
    page: 1,
    size: 24,
  });
  assert.equal(firstPage.content.length, 24);
  assert.equal(secondPage.content.length, 2);
  assert.equal(
    new Set([...firstPage.content, ...secondPage.content].map((row) => row.id))
      .size,
    26,
  );
  const ownedEntry = await entries.create(1, {
    description: 'Proteção % de proprietário',
    amount: 1.23,
    type: 'income',
    accountId: testAccount.id,
    categoryId: 101,
    transactionDate: new Date(2026, 0, 1),
    status: 'pending',
  });
  const matching = await entries.findAll(1, {
    search: '% de proprietário',
    accountIds: [testAccount.id],
    categoryIds: [101],
    types: ['income', 'expense'],
    statuses: ['pending', 'settled'],
  });
  assert.equal(matching.totalElements, 1);
  assert.equal(matching.content[0].id, ownedEntry.id);
  assert.equal(
    (await entries.findAll(999, { accountIds: [testAccount.id] }))
      .totalElements,
    0,
  );
  const {
    TagService,
  } = require('../src/main/application/services/tag-service.ts');
  const tags = new TagService();
  const ownedTag = await tags.create(1, { name: 'Teste autorização' });
  await tags.setTransactionTags(1, ownedEntry.id, [ownedTag.id]);
  await assert.rejects(
    () => tags.getTransactionTags(999, ownedEntry.id),
    /não encontrado/,
  );
  await assert.rejects(
    () => tags.setTransactionTags(999, ownedEntry.id, []),
    /não encontrado/,
  );
  assert.equal((await tags.getTransactionTags(1, ownedEntry.id)).length, 1);
  const {
    AttachmentService,
  } = require('../src/main/application/services/attachment-service.ts');
  const attachments = new AttachmentService(directory);
  await assert.rejects(
    () => attachments.findByTransaction(999, ownedEntry.id),
    /não encontrado/,
  );
  const goalsService = new GoalService();
  const concurrentGoal = await goalsService.create(1, {
    name: 'Concorrência',
    targetAmount: 1,
  });
  await Promise.all(
    Array.from({ length: 10 }, () =>
      goalsService.addContribution(1, concurrentGoal.id, { amount: 0.01 }),
    ),
  );
  assert.equal(
    (await goalsService.findById(1, concurrentGoal.id)).currentAmount,
    0.1,
  );
  await assert.rejects(
    () => goalsService.addContribution(999, concurrentGoal.id, { amount: 1 }),
    /não encontrada/,
  );
  await assert.rejects(
    () =>
      goalsService.create(999, {
        name: 'Conta alheia',
        targetAmount: 1,
        accountId: testAccount.id,
      }),
    /Conta não encontrada/,
  );
  await assert.rejects(
    () => bankImporter.getImportTransactions(999, importGroup.id),
    /não encontrada/,
  );
  const anotherCard = await accounts.create(1, {
    name: 'Outro cartão',
    type: 'credit_card',
    creditLimit: 1000,
    closingDay: 5,
  });
  const wrongInvoice = await cards.getOrCreateInvoice(
    1,
    anotherCard.id,
    2026,
    1,
  );
  await assert.rejects(
    () => cards.linkTransactionToInvoice(1, ownedEntry.id, wrongInvoice.id),
    /mesmo cartão/,
  );
  await accounts.update(1, anotherCard.id, { dueDay: 31 });
  const sourcePurchase = await entries.create(1, {
    description: 'Compra com troca de fatura',
    amount: 12.34,
    type: 'expense',
    accountId: anotherCard.id,
    categoryId: 100,
    transactionDate: new Date(2026, 0, 2),
    status: 'pending',
  });
  const destinationInvoice = await cards.getOrCreateInvoice(
    1,
    anotherCard.id,
    2026,
    2,
  );
  assert.equal(new Date(destinationInvoice.dueDate).getDate(), 28);
  await cards.linkTransactionToInvoice(
    1,
    sourcePurchase.id,
    destinationInvoice.id,
  );
  assert.equal(
    (
      await source.query(
        'SELECT total_amount AS n FROM credit_card_invoices WHERE id=?',
        [wrongInvoice.id],
      )
    )[0].n,
    0,
  );
  assert.equal(
    (
      await source.query(
        'SELECT total_amount AS n FROM credit_card_invoices WHERE id=?',
        [destinationInvoice.id],
      )
    )[0].n,
    1234,
  );
  const reportSerializer = new ReportService();
  for (const text of ['=1+1', '+1', '-1', '@SUM(A1)', '  =1', '\t=1'])
    assert.ok(reportSerializer.escapeCSVValue(text).startsWith("'"));
  assert.equal(reportSerializer.escapeCSVValue(123.45), '123.45');
  const {
    OnboardingService,
  } = require('../src/main/application/services/onboarding-service.ts');
  const guide = new OnboardingService();
  assert.equal((await guide.state(1)).step, 0);
  assert.equal((await guide.advance(1, 0)).step, 1);
  await assert.rejects(() => guide.advance(1, 0), /Etapa inválida/);
  assert.equal((await guide.advance(1, 1)).step, 2);
  assert.equal((await guide.advance(1, 2)).step, 3);
  assert.equal((await guide.advance(1, 3)).step, 4);
  assert.equal((await guide.advance(1, 4, true)).step, 5);
  assert.equal((await guide.advance(1, 5)).completed, true);
  assert.equal((await new OnboardingService().state(1)).completed, true);
  assert.equal((await guide.state(999)).step, 0);
  await assert.rejects(() => guide.advance(999, 0, true), /Conclua/);
  const imageData =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
  assert.equal(
    (await accounts.update(1, testAccount.id, { imageData })).imageData,
    imageData,
  );
  const {
    BackupService,
  } = require('../src/main/application/services/backup/backup-service.ts');
  const {
    financialTransaction,
  } = require('../src/main/infrastructure/database/financial-transaction.ts');
  const backupPath = path.join(directory, 'foundation.ctbackup');
  await Promise.all([
    financialTransaction(async (manager) => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      await manager.query('UPDATE accounts SET name=? WHERE id=?', [
        'Snapshot íntegro',
        testAccount.id,
      ]);
    }),
    new BackupService().export(backupPath, 'senha-teste-12345'),
  ]);
  const { decryptBackup } = require('../src/main/domain/backup-codec.ts');
  const SnapshotDatabase = require('better-sqlite3');
  const snapshot = new SnapshotDatabase(
    decryptBackup(fs.readFileSync(backupPath, 'utf8'), 'senha-teste-12345'),
  );
  assert.equal(
    snapshot.prepare('SELECT name FROM accounts WHERE id=?').get(testAccount.id)
      .name,
    'Snapshot íntegro',
  );
  assert.equal(
    snapshot
      .prepare('SELECT image_data FROM accounts WHERE id=?')
      .get(testAccount.id).image_data,
    imageData,
  );
  assert.ok(
    snapshot
      .prepare('SELECT completed_at FROM onboarding_progress WHERE user_id=1')
      .get().completed_at,
  );
  assert.equal(
    snapshot
      .prepare(
        'SELECT SUM(delta_cents) AS n FROM balance_adjustments WHERE account_id=?',
      )
      .get(testAccount.id).n,
    1567,
  );
  snapshot.close();
  console.log(
    'Regressões: autorização, ajuste persistente, metas concorrentes, categorias idempotentes, multisseleção e paginação: OK',
  );
  await verifyRoadmap(source,require);
  await database.closeDatabase();
  const NativeDatabase = require('better-sqlite3');
  const previous = new NativeDatabase(file);
  previous.pragma('user_version=2');
  previous.close();
  await assert.rejects(
    () => database.initializeDatabase(),
    /Banco do formato anterior/,
  );
  const preserved = new NativeDatabase(file);
  assert.equal(
    preserved.prepare('SELECT balance FROM accounts WHERE id=?').get(account.id)
      .balance,
    4250000,
  );
  preserved.close();
  console.log(
    'ORM real: centavos físicos, pendência/liquidação/cancelamento, competência, transferência, investimento, saldo inicial e pagamento único de fatura: OK',
  );
} finally {
  await database.closeDatabase();
  for (const child of fs.readdirSync(directory))
    fs.unlinkSync(path.join(directory, child));
  fs.rmdirSync(directory);
}
