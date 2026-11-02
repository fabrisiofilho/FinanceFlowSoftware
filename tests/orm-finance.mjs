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
