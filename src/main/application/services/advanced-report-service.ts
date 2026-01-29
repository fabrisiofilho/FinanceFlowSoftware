import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { TransactionEntity } from '../entities/transaction.entity';
import { AccountEntity } from '../entities/account.entity';
import { BudgetEntity } from '../entities/budget.entity';

export interface YearComparison {
  category: string;
  categoryId: number;
  currentYear: number;
  previousYear: number;
  variation: number;
  variationPercent: number;
}

export interface TrendAnalysis {
  categoryId: number;
  categoryName: string;
  months: { year: number; month: number; amount: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  averageMonthly: number;
  projectedNextMonth: number;
}

export interface SpendingPattern {
  dayOfWeek: number;
  dayName: string;
  averageSpending: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string;
  total: number;
  percentage: number;
  transactionCount: number;
  averageTransaction: number;
  subcategories?: CategoryBreakdown[];
}

export interface FinancialHealth {
  score: number; // 0-100
  savingsRate: number;
  expenseToIncomeRatio: number;
  budgetAdherence: number;
  emergencyFundMonths: number;
  recommendations: string[];
}

export interface AdvancedReportFilters {
  startDate: Date;
  endDate: Date;
  accountId?: number;
  categoryIds?: number[];
  compareWithPreviousPeriod?: boolean;
}

export class AdvancedReportService {
  private get transactionRepository() {
    return getDataSource().getRepository(TransactionEntity);
  }

  private get accountRepository() {
    return getDataSource().getRepository(AccountEntity);
  }

  private get budgetRepository() {
    return getDataSource().getRepository(BudgetEntity);
  }

  async getYearComparison(
    userId: number,
    year: number,
  ): Promise<YearComparison[]> {
    logger.info('Gerando comparativo anual para usuário:', userId);

    const currentYearData = await this.getYearlyExpensesByCategory(
      userId,
      year,
    );
    const previousYearData = await this.getYearlyExpensesByCategory(
      userId,
      year - 1,
    );

    const comparison: YearComparison[] = [];
    const allCategoryIds = new Set([
      ...currentYearData.map((d) => d.categoryId),
      ...previousYearData.map((d) => d.categoryId),
    ]);

    for (const categoryId of allCategoryIds) {
      const current = currentYearData.find((d) => d.categoryId === categoryId);
      const previous = previousYearData.find(
        (d) => d.categoryId === categoryId,
      );

      const currentAmount = current?.total ?? 0;
      const previousAmount = previous?.total ?? 0;
      const variation = currentAmount - previousAmount;
      const variationPercent =
        previousAmount > 0 ? (variation / previousAmount) * 100 : 0;

      comparison.push({
        category: current?.categoryName ?? previous?.categoryName ?? '',
        categoryId,
        currentYear: currentAmount,
        previousYear: previousAmount,
        variation,
        variationPercent,
      });
    }

    return comparison.sort(
      (a, b) => Math.abs(b.variation) - Math.abs(a.variation),
    );
  }

  async getTrendAnalysis(
    userId: number,
    months: number = 12,
  ): Promise<TrendAnalysis[]> {
    logger.info('Analisando tendências para usuário:', userId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const data = await this.transactionRepository
      .createQueryBuilder('t')
      .select('t.category_id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect("strftime('%Y', t.transaction_date)", 'year')
      .addSelect("strftime('%m', t.transaction_date)", 'month')
      .addSelect('SUM(t.amount)', 'total')
      .innerJoin('t.category', 'c')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .andWhere('t.transaction_date <= :endDate', { endDate })
      .groupBy('t.category_id')
      .addGroupBy('c.name')
      .addGroupBy("strftime('%Y', t.transaction_date)")
      .addGroupBy("strftime('%m', t.transaction_date)")
      .orderBy('categoryId')
      .addOrderBy('year')
      .addOrderBy('month')
      .getRawMany();

    // Group by category
    const categoryMap = new Map<number, TrendAnalysis>();

    for (const row of data) {
      if (!categoryMap.has(row.categoryId)) {
        categoryMap.set(row.categoryId, {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          months: [],
          trend: 'stable',
          averageMonthly: 0,
          projectedNextMonth: 0,
        });
      }

      const analysis = categoryMap.get(row.categoryId)!;
      analysis.months.push({
        year: parseInt(row.year),
        month: parseInt(row.month),
        amount: Number(row.total),
      });
    }

    // Calculate trends
    for (const analysis of categoryMap.values()) {
      const amounts = analysis.months.map((m) => m.amount);
      analysis.averageMonthly =
        amounts.reduce((a, b) => a + b, 0) / amounts.length;

      // Simple linear regression for trend
      if (amounts.length >= 3) {
        const n = amounts.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = amounts.reduce((a, b) => a + b, 0);
        const sumXY = amounts.reduce((sum, y, x) => sum + x * y, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        if (slope > analysis.averageMonthly * 0.05) {
          analysis.trend = 'increasing';
        } else if (slope < -analysis.averageMonthly * 0.05) {
          analysis.trend = 'decreasing';
        }

        analysis.projectedNextMonth = amounts[amounts.length - 1] + slope;
      } else {
        analysis.projectedNextMonth = analysis.averageMonthly;
      }
    }

    return Array.from(categoryMap.values());
  }

  async getSpendingPatterns(
    userId: number,
    filters?: AdvancedReportFilters,
  ): Promise<SpendingPattern[]> {
    const dayNames = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];

    let query = this.transactionRepository
      .createQueryBuilder('t')
      .select("strftime('%w', t.transaction_date)", 'dayOfWeek')
      .addSelect('AVG(t.amount)', 'avgAmount')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' });

    if (filters?.startDate) {
      query = query.andWhere('t.transaction_date >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      query = query.andWhere('t.transaction_date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const data = await query
      .groupBy("strftime('%w', t.transaction_date)")
      .getRawMany();

    return data.map((row) => ({
      dayOfWeek: parseInt(row.dayOfWeek),
      dayName: dayNames[parseInt(row.dayOfWeek)],
      averageSpending: Number(row.avgAmount),
      transactionCount: parseInt(row.count),
    }));
  }

  async getCategoryBreakdown(
    userId: number,
    filters: AdvancedReportFilters,
  ): Promise<CategoryBreakdown[]> {
    const data = await this.transactionRepository
      .createQueryBuilder('t')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('c.icon', 'categoryIcon')
      .addSelect('SUM(t.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('t.category', 'c')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.transaction_date >= :startDate', {
        startDate: filters.startDate,
      })
      .andWhere('t.transaction_date <= :endDate', { endDate: filters.endDate })
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.icon')
      .orderBy('total', 'DESC')
      .getRawMany();

    const totalExpenses = data.reduce((sum, row) => sum + Number(row.total), 0);

    return data.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryIcon: row.categoryIcon,
      total: Number(row.total),
      percentage:
        totalExpenses > 0 ? (Number(row.total) / totalExpenses) * 100 : 0,
      transactionCount: parseInt(row.count),
      averageTransaction: Number(row.total) / parseInt(row.count),
    }));
  }

  async getFinancialHealth(userId: number): Promise<FinancialHealth> {
    logger.info('Calculando saúde financeira para usuário:', userId);

    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get income and expenses for last 3 months
    const summary = await this.transactionRepository
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.transaction_date >= :startDate', {
        startDate: threeMonthsAgo,
      })
      .andWhere('t.transaction_date <= :endDate', { endDate: now })
      .groupBy('t.type')
      .getRawMany();

    const income = Number(summary.find((s) => s.type === 'income')?.total ?? 0);
    const expenses = Number(
      summary.find((s) => s.type === 'expense')?.total ?? 0,
    );

    // Calculate metrics
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const expenseToIncomeRatio = income > 0 ? (expenses / income) * 100 : 100;

    // Get budget adherence
    const budgetAdherence = await this.calculateBudgetAdherence(userId);

    // Get total balance for emergency fund calculation
    const balanceResult = await this.accountRepository
      .createQueryBuilder('a')
      .select('SUM(a.balance)', 'total')
      .where('a.user_id = :userId', { userId })
      .getRawOne();

    const totalBalance = Number(balanceResult?.total ?? 0);
    const monthlyExpenses = expenses / 3;
    const emergencyFundMonths =
      monthlyExpenses > 0 ? totalBalance / monthlyExpenses : 0;

    // Calculate score
    let score = 50; // Base score

    // Savings rate contribution (max 25 points)
    if (savingsRate >= 20) score += 25;
    else if (savingsRate >= 10) score += 15;
    else if (savingsRate >= 0) score += 5;
    else score -= 10;

    // Budget adherence contribution (max 15 points)
    score += budgetAdherence * 0.15;

    // Emergency fund contribution (max 10 points)
    if (emergencyFundMonths >= 6) score += 10;
    else if (emergencyFundMonths >= 3) score += 5;

    score = Math.max(0, Math.min(100, score));

    // Generate recommendations
    const recommendations: string[] = [];

    if (savingsRate < 10) {
      recommendations.push(
        'Tente economizar pelo menos 10% da sua renda mensal',
      );
    }
    if (emergencyFundMonths < 3) {
      recommendations.push(
        'Construa uma reserva de emergência de pelo menos 3 meses de despesas',
      );
    }
    if (budgetAdherence < 70) {
      recommendations.push(
        'Revise seus orçamentos - você está gastando mais do que planejou',
      );
    }
    if (expenseToIncomeRatio > 90) {
      recommendations.push(
        'Suas despesas estão muito próximas da sua renda - busque reduzir gastos',
      );
    }

    return {
      score: Math.round(score),
      savingsRate,
      expenseToIncomeRatio,
      budgetAdherence,
      emergencyFundMonths,
      recommendations,
    };
  }

  async getIncomeVsExpenseHistory(
    userId: number,
    months: number = 12,
  ): Promise<
    {
      year: number;
      month: number;
      income: number;
      expense: number;
      balance: number;
    }[]
  > {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const data = await this.transactionRepository
      .createQueryBuilder('t')
      .select("strftime('%Y', t.transaction_date)", 'year')
      .addSelect("strftime('%m', t.transaction_date)", 'month')
      .addSelect('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .andWhere('t.transaction_date <= :endDate', { endDate })
      .groupBy("strftime('%Y', t.transaction_date)")
      .addGroupBy("strftime('%m', t.transaction_date)")
      .addGroupBy('t.type')
      .orderBy('year')
      .addOrderBy('month')
      .getRawMany();

    // Group by month
    const monthMap = new Map<string, { income: number; expense: number }>();

    for (const row of data) {
      const key = `${row.year}-${row.month}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { income: 0, expense: 0 });
      }
      const entry = monthMap.get(key)!;
      if (row.type === 'income') {
        entry.income = Number(row.total);
      } else {
        entry.expense = Number(row.total);
      }
    }

    return Array.from(monthMap.entries()).map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        year,
        month,
        income: value.income,
        expense: value.expense,
        balance: value.income - value.expense,
      };
    });
  }

  private async getYearlyExpensesByCategory(
    userId: number,
    year: number,
  ): Promise<{ categoryId: number; categoryName: string; total: number }[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const data = await this.transactionRepository
      .createQueryBuilder('t')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('SUM(t.amount)', 'total')
      .innerJoin('t.category', 'c')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .andWhere('t.transaction_date <= :endDate', { endDate })
      .groupBy('c.id')
      .addGroupBy('c.name')
      .getRawMany();

    return data.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      total: Number(row.total),
    }));
  }

  private async calculateBudgetAdherence(userId: number): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const budgets = await this.budgetRepository.find({
      where: { userId, year, month },
    });

    if (budgets.length === 0) return 100;

    let totalPlanned = 0;
    let totalWithinBudget = 0;

    for (const budget of budgets) {
      const spent = await this.getSpentForBudget(
        userId,
        budget.categoryId,
        year,
        month,
      );
      totalPlanned += Number(budget.plannedAmount);
      if (spent <= Number(budget.plannedAmount)) {
        totalWithinBudget += Number(budget.plannedAmount);
      }
    }

    return totalPlanned > 0 ? (totalWithinBudget / totalPlanned) * 100 : 100;
  }

  private async getSpentForBudget(
    userId: number,
    categoryId: number,
    year: number,
    month: number,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.category_id = :categoryId', { categoryId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .andWhere('t.transaction_date <= :endDate', { endDate })
      .getRawOne();

    return Number(result?.total ?? 0);
  }
}
