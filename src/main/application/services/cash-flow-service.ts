import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { TransactionEntity } from '../entities/transaction.entity';
import { RecurringTransactionEntity } from '../entities/recurring-transaction.entity';
import { AccountEntity } from '../entities/account.entity';
import {
  CashFlowSummary,
  CashFlowProjection,
  CashFlowDetail,
  CashFlowFilters,
  CashFlowAlert,
  MonthlyProjection,
} from '@shared/interfaces/types/cash-flow.types';
import { parseDateSafe, formatDateToISO } from '@main/infrastructure/utils/date-utils';

export class CashFlowService {
  private get transactionRepository() {
    return getDataSource().getRepository(TransactionEntity);
  }

  private get recurringRepository() {
    return getDataSource().getRepository(RecurringTransactionEntity);
  }

  private get accountRepository() {
    return getDataSource().getRepository(AccountEntity);
  }

  async getProjection(
    userId: number,
    filters: CashFlowFilters,
  ): Promise<CashFlowSummary> {
    logger.info('Calculando projeção de fluxo de caixa para usuário:', userId);

    const {
      startDate,
      endDate,
      accountId,
      includeRecurring = true,
      includePendingBills = true,
    } = filters;

    // Get current balance
    const currentBalance = await this.getCurrentBalance(userId, accountId);

    // Get confirmed transactions in period
    const transactions = await this.getTransactionsInPeriod(
      userId,
      startDate,
      endDate,
      accountId,
    );

    // Get recurring transactions projections
    const recurringProjections = includeRecurring
      ? await this.getRecurringProjections(
          userId,
          startDate,
          endDate,
          accountId,
        )
      : [];

    // Get pending bills
    const pendingBills = includePendingBills
      ? await this.getPendingBills(userId, startDate, endDate, accountId)
      : [];

    // Combine all cash flow items
    const allItems = [
      ...transactions,
      ...recurringProjections,
      ...pendingBills,
    ];

    // Group by date
    const projections = this.groupByDate(
      allItems,
      startDate,
      endDate,
      currentBalance,
    );

    // Calculate totals
    const totalIncome = allItems
      .filter((i) => i.type === 'income')
      .reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = allItems
      .filter((i) => i.type === 'expense')
      .reduce((sum, i) => sum + i.amount, 0);

    // Get final projected balance
    const lastProjection = projections[projections.length - 1];
    const projectedBalance = lastProjection?.projectedBalance ?? currentBalance;

    // Generate alerts
    const alerts = this.generateAlerts(projections, currentBalance);

    return {
      currentBalance,
      projectedBalance,
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
      projections,
      alerts,
    };
  }

  async getMonthlyProjections(
    userId: number,
    months: number = 6,
  ): Promise<MonthlyProjection[]> {
    const projections: MonthlyProjection[] = [];
    const today = new Date();
    let runningBalance = await this.getCurrentBalance(userId);

    for (let i = 0; i < months; i++) {
      const year =
        today.getFullYear() + Math.floor((today.getMonth() + i) / 12);
      const month = ((today.getMonth() + i) % 12) + 1;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const summary = await this.getProjection(userId, {
        startDate,
        endDate,
        includeRecurring: true,
        includePendingBills: true,
      });

      projections.push({
        year,
        month,
        startingBalance: runningBalance,
        projectedIncome: summary.totalIncome,
        projectedExpenses: summary.totalExpenses,
        projectedBalance: runningBalance + summary.netCashFlow,
        confidence: this.calculateConfidence(i),
      });

      runningBalance += summary.netCashFlow;
    }

    return projections;
  }

  private async getCurrentBalance(
    userId: number,
    accountId?: number,
  ): Promise<number> {
    const query = this.accountRepository
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.balance), 0)', 'total')
      .where('a.user_id = :userId', { userId });

    if (accountId) {
      query.andWhere('a.id = :accountId', { accountId });
    }

    const result = await query.getRawOne();
    return Number(result?.total ?? 0);
  }

  private async getTransactionsInPeriod(
    userId: number,
    startDate: Date,
    endDate: Date,
    accountId?: number,
  ): Promise<CashFlowDetail[]> {
    const query = this.transactionRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.account', 'a')
      .leftJoinAndSelect('t.category', 'c')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .andWhere('t.transaction_date <= :endDate', { endDate });

    if (accountId) {
      query.andWhere('t.account_id = :accountId', { accountId });
    }

    const transactions = await query.getMany();

    return transactions.map((t) => ({
      id: t.id,
      type: t.type as 'income' | 'expense',
      source: 'transaction' as const,
      description: t.description,
      amount: Number(t.amount),
      date: parseDateSafe(t.transactionDate) ?? new Date(),
      accountId: t.accountId,
      accountName: (t.account as AccountEntity)?.name ?? '',
      categoryId: t.categoryId,
      categoryName: (t.category as any)?.name,
      isConfirmed: true,
      isPast: (parseDateSafe(t.transactionDate) ?? new Date()) < new Date(),
    }));
  }

  private async getRecurringProjections(
    userId: number,
    startDate: Date,
    endDate: Date,
    accountId?: number,
  ): Promise<CashFlowDetail[]> {
    const query = this.recurringRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.account', 'a')
      .leftJoinAndSelect('r.category', 'c')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.is_active = 1')
      .andWhere('r.next_occurrence <= :endDate', { endDate })
      .andWhere('(r.end_date IS NULL OR r.end_date >= :startDate)', {
        startDate,
      });

    if (accountId) {
      query.andWhere('r.account_id = :accountId', { accountId });
    }

    const recurrings = await query.getMany();
    const projections: CashFlowDetail[] = [];

    for (const recurring of recurrings) {
      let nextDate = parseDateSafe(recurring.nextOccurrence) ?? new Date();

      while (nextDate <= endDate) {
        if (nextDate >= startDate) {
          projections.push({
            id: recurring.id,
            type: recurring.type as 'income' | 'expense',
            source: 'recurring',
            description: `[Recorrente] ${recurring.description}`,
            amount: Number(recurring.amount),
            date: new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate()),
            accountId: recurring.accountId,
            accountName: (recurring.account as AccountEntity)?.name ?? '',
            categoryId: recurring.categoryId,
            categoryName: (recurring.category as any)?.name,
            isConfirmed: false,
            isPast: false,
          });
        }

        // Calculate next occurrence
        nextDate = this.addFrequency(nextDate, recurring.frequency);
      }
    }

    return projections;
  }

  private async getPendingBills(
    userId: number,
    startDate: Date,
    endDate: Date,
    accountId?: number,
  ): Promise<CashFlowDetail[]> {
    const query = this.transactionRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.account', 'a')
      .leftJoinAndSelect('t.category', 'c')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.due_date IS NOT NULL')
      .andWhere('t.due_date >= :startDate', { startDate })
      .andWhere('t.due_date <= :endDate', { endDate });

    if (accountId) {
      query.andWhere('t.account_id = :accountId', { accountId });
    }

    const bills = await query.getMany();

    return bills.map((t) => ({
      id: t.id,
      type: 'expense' as const,
      source: 'bill' as const,
      description: `[Conta] ${t.description}`,
      amount: Number(t.amount),
      date: parseDateSafe(t.dueDate) ?? new Date(),
      accountId: t.accountId,
      accountName: (t.account as AccountEntity)?.name ?? '',
      categoryId: t.categoryId,
      categoryName: (t.category as any)?.name,
      isConfirmed: false,
      isPast: (parseDateSafe(t.dueDate) ?? new Date()) < new Date(),
    }));
  }

  private groupByDate(
    items: CashFlowDetail[],
    startDate: Date,
    endDate: Date,
    initialBalance: number,
  ): CashFlowProjection[] {
    const projectionMap = new Map<string, CashFlowProjection>();

    // Initialize all dates
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    while (current <= end) {
      const key = formatDateToISO(current) ?? '';
      projectionMap.set(key, {
        date: new Date(current.getFullYear(), current.getMonth(), current.getDate()),
        projectedBalance: 0,
        income: 0,
        expenses: 0,
        transfers: 0,
        details: [],
      });
      current.setDate(current.getDate() + 1);
    }

    // Add items to their dates
    for (const item of items) {
      const key = formatDateToISO(item.date) ?? '';
      const projection = projectionMap.get(key);
      if (projection) {
        projection.details.push(item);
        if (item.type === 'income') {
          projection.income += item.amount;
        } else if (item.type === 'expense') {
          projection.expenses += item.amount;
        } else {
          projection.transfers += item.amount;
        }
      }
    }

    // Calculate running balance
    let runningBalance = initialBalance;
    const projections = Array.from(projectionMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    for (const projection of projections) {
      runningBalance += projection.income - projection.expenses;
      projection.projectedBalance = runningBalance;
    }

    return projections;
  }

  private generateAlerts(
    projections: CashFlowProjection[],
    currentBalance: number,
  ): CashFlowAlert[] {
    const alerts: CashFlowAlert[] = [];
    const lowBalanceThreshold = currentBalance * 0.1; // 10% of current balance

    for (const projection of projections) {
      if (projection.projectedBalance < 0) {
        alerts.push({
          date: projection.date,
          type: 'negative_balance',
          message: `Saldo negativo projetado: R$ ${projection.projectedBalance.toFixed(2)}`,
          projectedBalance: projection.projectedBalance,
        });
      } else if (projection.projectedBalance < lowBalanceThreshold) {
        alerts.push({
          date: projection.date,
          type: 'low_balance',
          message: `Saldo baixo projetado: R$ ${projection.projectedBalance.toFixed(2)}`,
          projectedBalance: projection.projectedBalance,
          threshold: lowBalanceThreshold,
        });
      }

      // Check for large expenses
      const largeExpenses = projection.details.filter(
        (d) => d.type === 'expense' && d.amount > currentBalance * 0.2,
      );
      for (const expense of largeExpenses) {
        alerts.push({
          date: projection.date,
          type: 'large_expense',
          message: `Despesa grande: ${expense.description} - R$ ${expense.amount.toFixed(2)}`,
          projectedBalance: projection.projectedBalance,
        });
      }
    }

    return alerts;
  }

  private addFrequency(date: Date, frequency: string): Date {
    const result = new Date(date);
    switch (frequency) {
      case 'daily':
        result.setDate(result.getDate() + 1);
        break;
      case 'weekly':
        result.setDate(result.getDate() + 7);
        break;
      case 'biweekly':
        result.setDate(result.getDate() + 14);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + 1);
        break;
      case 'yearly':
        result.setFullYear(result.getFullYear() + 1);
        break;
    }
    return result;
  }

  private calculateConfidence(monthsAhead: number): number {
    // Confidence decreases as we project further into the future
    return Math.max(0.5, 1 - monthsAhead * 0.1);
  }
}
