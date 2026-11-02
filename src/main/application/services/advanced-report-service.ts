import { AdvancedReportV2Service } from './advanced-report-v2-service';
import type { AdvancedReportQuery } from '@shared/finance/advanced-reports';
export type {
  YearComparison,
  TrendAnalysis,
  SpendingPattern,
  CategoryBreakdown,
  FinancialHealth,
  AdvancedReportFilters,
} from '@shared/interfaces/controllers/advanced-report.controller.interface';
import type { AdvancedReportFilters } from '@shared/interfaces/controllers/advanced-report.controller.interface';

/** Compatibility adapters. New consumers use queryV2 and civil dates. */
export class AdvancedReportService {
  private service = new AdvancedReportV2Service();
  private period(months = 12): AdvancedReportQuery {
    if (!Number.isInteger(months) || months < 1 || months > 360)
      throw new Error('Prazo inválido');
    const now = new Date(),
      start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const civil = (d: Date) =>
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
    return {
      startDate: civil(start),
      endDateExclusive: civil(end),
      basis: 'settlement',
    };
  }
  private filters(filters?: AdvancedReportFilters): AdvancedReportQuery {
    if (!filters) return this.period();
    const civil = (v: Date | string) =>
      typeof v === 'string' ? v.slice(0, 10) : v.toISOString().slice(0, 10);
    const end = new Date(civil(filters.endDate) + 'T12:00:00Z');
    end.setUTCDate(end.getUTCDate() + 1);
    return {
      startDate: civil(filters.startDate),
      endDateExclusive: end.toISOString().slice(0, 10),
      basis: 'settlement',
      accountIds: filters.accountId ? [filters.accountId] : [],
      categoryIds: filters.categoryIds,
    };
  }
  async getYearComparison(userId: number, year: number) {
    if (!Number.isInteger(year) || year < 1900 || year > 9998)
      throw new Error('Ano inválido');
    const result = await this.service.query(userId, 'comparison', {
      startDate: year + '-01-01',
      endDateExclusive: year + 1 + '-01-01',
      basis: 'settlement',
    });
    return result.rows.map((r) => ({
      category: r.label,
      categoryId: r.categoryId!,
      currentYear: r.totalCents! / 100,
      previousYear: r.previousCents! / 100,
      variation: r.differenceCents! / 100,
      variationPercent: r.variationPercent ?? null,
    }));
  }
  async getTrendAnalysis(userId: number, months = 12) {
    const result = await this.service.query(
      userId,
      'trends',
      this.period(months),
    );
    return result.rows.map((r) => ({
      categoryId: r.categoryId!,
      categoryName: r.label,
      months: r.points!.map((p) => ({
        year: +p.month.slice(0, 4),
        month: +p.month.slice(5),
        amount: p.amountCents / 100,
      })),
      trend: (r.predictedCents === null ||
      Math.abs(r.predictedCents! - r.averageCents!) < r.averageCents! * 0.05
        ? 'stable'
        : r.predictedCents! > r.averageCents!
          ? 'increasing'
          : 'decreasing') as 'stable' | 'increasing' | 'decreasing',
      averageMonthly: r.averageCents! / 100,
      projectedNextMonth:
        r.predictedCents === null ? null : r.predictedCents! / 100,
    }));
  }
  async getSpendingPatterns(userId: number, filters?: AdvancedReportFilters) {
    const result = await this.service.query(
      userId,
      'habits',
      this.filters(filters),
    );
    return result.rows.map((r, i) => ({
      dayOfWeek: i,
      dayName: r.label,
      averageSpending: r.averageCents! / 100,
      transactionCount: r.count!,
    }));
  }
  async getCategoryBreakdown(userId: number, filters: AdvancedReportFilters) {
    const result = await this.service.query(
      userId,
      'categories',
      this.filters(filters),
    );
    return result.rows.map((r) => ({
      categoryId: r.categoryId!,
      categoryName: r.label,
      total: r.totalCents! / 100,
      percentage: r.percentage!,
      transactionCount: r.count!,
      averageTransaction: r.averageCents! / 100,
    }));
  }
  async getFinancialHealth(userId: number) {
    const result = await this.service.query(userId, 'health', this.period(3));
    const h = result.health!;
    return {
      hasData: h.sampleSize > 0,
      score: h.score,
      savingsRate: h.savingsRate,
      expenseToIncomeRatio: h.expenseToIncomeRatio,
      budgetAdherence: h.budgetAdherence,
      emergencyFundMonths: h.emergencyFundMonths,
      recommendations: h.recommendations,
    };
  }
  async getIncomeVsExpenseHistory(userId: number, months = 12) {
    const result = await this.service.query(
      userId,
      'history',
      this.period(months),
    );
    return result.rows.map((r) => ({
      year: +r.label.slice(0, 4),
      month: +r.label.slice(5),
      income: r.incomeCents! / 100,
      expense: r.expenseCents! / 100,
      balance: (r.incomeCents! - r.expenseCents!) / 100,
    }));
  }
}
