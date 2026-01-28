import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { repositoryCache } from '../repositories/repository-cache';
import { logger } from '@main/infrastructure/log/logger';
import {
  DashboardData,
  DashboardFilters,
  MonthSummary,
  CategoryExpense,
  IncomeVsExpense,
  UpcomingBill,
  AccountBalance,
} from '@shared/interfaces/types/dashboard.types';
import { Transaction } from '@shared/interfaces/types/transaction.types';
import { TransactionEntity } from '../entities/transaction.entity';
export class DashboardService {
  private _injectedAccountRepository: AccountRepository | null = null;
  private _injectedTransactionRepository: TransactionRepository | null = null;
  private static readonly DEFAULT_MONTHS_HISTORY = 6;
  private static readonly DEFAULT_UPCOMING_DAYS = 7;
  private static readonly DEFAULT_RECENT_TRANSACTIONS = 10;
  private get accountRepository(): AccountRepository {
    if (this._injectedAccountRepository) {
      return this._injectedAccountRepository;
    }
    return repositoryCache.accountRepository;
  }
  private get transactionRepository(): TransactionRepository {
    if (this._injectedTransactionRepository) {
      return this._injectedTransactionRepository;
    }
    return repositoryCache.transactionRepository;
  }
  constructor(
    accountRepository?: AccountRepository,
    transactionRepository?: TransactionRepository,
  ) {
    if (accountRepository) {
      this._injectedAccountRepository = accountRepository;
    }
    if (transactionRepository) {
      this._injectedTransactionRepository = transactionRepository;
    }
  }
  private mapEntityToTransaction(entity: TransactionEntity): Transaction {
    return {
      id: entity.id,
      description: entity.description,
      amount: Number(entity.amount),
      type: entity.type as Transaction['type'],
      paymentMethod: entity.paymentMethod as Transaction['paymentMethod'],
      expenseType: entity.expenseType as Transaction['expenseType'],
      transactionDate: new Date(entity.transactionDate),
      dueDate: entity.dueDate ? new Date(entity.dueDate) : undefined,
      installmentNumber: entity.installmentNumber ?? undefined,
      totalInstallments: entity.totalInstallments ?? undefined,
      installmentGroupId: entity.installmentGroupId ?? undefined,
      recurrence: entity.recurrence as Transaction['recurrence'],
      accountId: entity.accountId,
      categoryId: entity.categoryId,
      creditCardInvoiceId: entity.creditCardInvoiceId ?? undefined,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }
  async getTotalBalance(userId: number): Promise<number> {
    logger.info('Obtendo saldo total para usuário:', userId);
    const totalBalance = await this.accountRepository.getTotalBalance(userId);
    logger.info('Saldo total calculado:', totalBalance);
    return totalBalance;
  }
  async getProjectedBalance(userId: number): Promise<number> {
    logger.info('Calculando saldo previsto para usuário:', userId);
    const currentBalance = await this.accountRepository.getTotalBalance(userId);
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const futureTransactions =
      await this.transactionRepository.findWithFiltersNoPagination(userId, {
        startDate: today,
        endDate: endOfMonth,
      });
    let futureIncome = 0;
    let futureExpenses = 0;
    for (const transaction of futureTransactions) {
      const amount = Number(transaction.amount);
      if (transaction.type === 'income') {
        futureIncome += amount;
      } else if (transaction.type === 'expense') {
        futureExpenses += amount;
      }
    }
    const projectedBalance = currentBalance + futureIncome - futureExpenses;
    logger.info('Saldo previsto calculado:', projectedBalance);
    return projectedBalance;
  }
  async getMonthSummary(
    userId: number,
    year: number,
    month: number,
  ): Promise<MonthSummary> {
    logger.info(`Obtendo resumo do mês ${month}/${year} para usuário:`, userId);
    const { totalIncome, totalExpenses } =
      await this.transactionRepository.getMonthSummary(userId, year, month);
    const expensesByCategory = await this.getExpensesByCategory(
      userId,
      year,
      month,
    );
    const summary: MonthSummary = {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      expensesByCategory,
    };
    logger.info('Resumo do mês calculado:', summary);
    return summary;
  }
  async getExpensesByCategory(
    userId: number,
    year: number,
    month: number,
  ): Promise<CategoryExpense[]> {
    logger.info(
      `Obtendo gastos por categoria ${month}/${year} para usuário:`,
      userId,
    );
    const expensesByCategoryRaw =
      await this.transactionRepository.getExpensesByCategory(
        userId,
        year,
        month,
      );
    const totalExpenses = expensesByCategoryRaw.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );
    const expensesByCategory: CategoryExpense[] = expensesByCategoryRaw.map(
      (item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: Number(item.total),
        percentage:
          totalExpenses > 0 ? (Number(item.total) / totalExpenses) * 100 : 0,
      }),
    );
    logger.info(
      'Gastos por categoria calculados:',
      expensesByCategory.length,
      'categorias',
    );
    return expensesByCategory;
  }
  async getIncomeVsExpenses(
    userId: number,
    months: number = DashboardService.DEFAULT_MONTHS_HISTORY,
  ): Promise<IncomeVsExpense[]> {
    logger.info(
      `Obtendo evolução receitas x despesas dos últimos ${months} meses para usuário:`,
      userId,
    );
    const result: IncomeVsExpense[] = [];
    const today = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const { totalIncome, totalExpenses } =
        await this.transactionRepository.getMonthSummary(userId, year, month);
      result.push({
        year,
        month,
        income: totalIncome,
        expense: totalExpenses,
        balance: totalIncome - totalExpenses,
      });
    }
    logger.info(
      'Evolução receitas x despesas calculada:',
      result.length,
      'meses',
    );
    return result;
  }
  async getUpcomingBills(
    userId: number,
    days: number = DashboardService.DEFAULT_UPCOMING_DAYS,
  ): Promise<UpcomingBill[]> {
    logger.info(
      `Obtendo contas a pagar dos próximos ${days} dias para usuário:`,
      userId,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingTransactions =
      await this.transactionRepository.findUpcomingBills(userId, days);
    const upcomingBills: UpcomingBill[] = upcomingTransactions.map(
      (transaction) => {
        const dueDate = new Date(transaction.dueDate!);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: transaction.id,
          description: transaction.description,
          amount: Number(transaction.amount),
          dueDate: dueDate,
          categoryId: transaction.categoryId,
          categoryName: transaction.category?.name ?? 'Sem categoria',
          categoryIcon: transaction.category?.icon ?? undefined,
          accountId: transaction.accountId,
          accountName: transaction.account?.name ?? 'Conta desconhecida',
          isOverdue: daysUntilDue < 0,
          daysUntilDue,
        };
      },
    );
    logger.info('Contas a pagar encontradas:', upcomingBills.length);
    return upcomingBills;
  }
  async getAccountBalances(userId: number): Promise<AccountBalance[]> {
    logger.info('Obtendo saldos das contas para usuário:', userId);
    const accounts = await this.accountRepository.findAllByUserId(userId);
    const accountBalances: AccountBalance[] = accounts.map((account) => {
      const balance = Number(account.balance);
      const creditLimit = account.creditLimit
        ? Number(account.creditLimit)
        : undefined;
      let availableLimit: number | undefined;
      let usedLimitPercentage: number | undefined;
      if (account.type === 'credit_card' && creditLimit) {
        const usedLimit = Math.abs(balance);
        availableLimit = creditLimit - usedLimit;
        usedLimitPercentage = (usedLimit / creditLimit) * 100;
      }
      return {
        id: account.id,
        name: account.name,
        type: account.type as AccountBalance['type'],
        balance,
        creditLimit,
        availableLimit,
        usedLimitPercentage,
        isNegative: balance < 0,
      };
    });
    logger.info('Saldos das contas obtidos:', accountBalances.length, 'contas');
    return accountBalances;
  }
  async getRecentTransactions(
    userId: number,
    limit: number = DashboardService.DEFAULT_RECENT_TRANSACTIONS,
  ): Promise<Transaction[]> {
    logger.info(`Obtendo ${limit} transações recentes para usuário:`, userId);
    const transactions = await this.transactionRepository.findRecent(
      userId,
      limit,
    );
    const result = transactions.map((entity) =>
      this.mapEntityToTransaction(entity),
    );
    logger.info('Transações recentes obtidas:', result.length);
    return result;
  }
  async getDashboardData(
    userId: number,
    filters?: DashboardFilters,
  ): Promise<DashboardData> {
    logger.info('Obtendo dados completos do dashboard para usuário:', userId);
    const today = new Date();
    const year = filters?.year ?? today.getFullYear();
    const month = filters?.month ?? today.getMonth() + 1;
    const [
      totalBalance,
      projectedBalance,
      monthSummary,
      expensesByCategory,
      incomeVsExpenses,
      recentTransactions,
      upcomingBills,
      accountBalances,
    ] = await Promise.all([
      this.getTotalBalance(userId),
      this.getProjectedBalance(userId),
      this.getMonthSummary(userId, year, month),
      this.getExpensesByCategory(userId, year, month),
      this.getIncomeVsExpenses(userId, DashboardService.DEFAULT_MONTHS_HISTORY),
      this.getRecentTransactions(
        userId,
        DashboardService.DEFAULT_RECENT_TRANSACTIONS,
      ),
      this.getUpcomingBills(userId, DashboardService.DEFAULT_UPCOMING_DAYS),
      this.getAccountBalances(userId),
    ]);
    const dashboardData: DashboardData = {
      totalBalance,
      projectedBalance,
      monthSummary,
      expensesByCategory,
      incomeVsExpenses,
      recentTransactions,
      upcomingBills,
      accountBalances,
      lastUpdated: new Date(),
    };
    logger.success('Dados do dashboard obtidos com sucesso');
    return dashboardData;
  }
}
