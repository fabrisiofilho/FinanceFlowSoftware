import { AdvancedReportV2Service } from '../services/advanced-report-v2-service';
import type { AdvancedReportQuery, ReportPanel } from '@shared/finance/advanced-reports';
import { AdvancedReportService } from '../services/advanced-report-service';
import type {
  YearComparison,
  TrendAnalysis,
  SpendingPattern,
  CategoryBreakdown,
  FinancialHealth,
  AdvancedReportFilters,
} from '../services/advanced-report-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class AdvancedReportController extends BaseHandler {
  @IpcMethod('advancedReport:queryV2')
  async queryV2(panel: ReportPanel, query: AdvancedReportQuery) {
    return wrap(() => new AdvancedReportV2Service().query(this.getUserId(), panel, query))();
  }
  @IpcMethod('advancedReport:reserveSources') reserveSources() {
    return wrap(() => new AdvancedReportV2Service().reserveSources(this.getUserId()))();
  }
  @IpcMethod('advancedReport:configureReserve') configureReserve(ids: number[]) {
    return wrap(() => new AdvancedReportV2Service().configureReserve(this.getUserId(),ids))();
  }
  private _reportService: AdvancedReportService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get reportService(): AdvancedReportService {
    if (!this._reportService) {
      this._reportService = new AdvancedReportService();
    }
    return this._reportService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('advancedReport:yearComparison')
  async getYearComparison(
    year: number,
  ): Promise<ApiResponse<YearComparison[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.getYearComparison(userId, year);
    })();
  }

  @IpcMethod('advancedReport:trendAnalysis')
  async getTrendAnalysis(
    months?: number,
  ): Promise<ApiResponse<TrendAnalysis[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.getTrendAnalysis(userId, months);
    })();
  }

  @IpcMethod('advancedReport:spendingPatterns')
  async getSpendingPatterns(
    filters?: AdvancedReportFilters,
  ): Promise<ApiResponse<SpendingPattern[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.getSpendingPatterns(userId, filters);
    })();
  }

  @IpcMethod('advancedReport:categoryBreakdown')
  async getCategoryBreakdown(
    filters: AdvancedReportFilters,
  ): Promise<ApiResponse<CategoryBreakdown[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.getCategoryBreakdown(userId, {
        ...filters,
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    })();
  }

  @IpcMethod('advancedReport:financialHealth')
  async getFinancialHealth(): Promise<ApiResponse<FinancialHealth>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.getFinancialHealth(userId);
    })();
  }

  @IpcMethod('advancedReport:incomeVsExpenseHistory')
  async getIncomeVsExpenseHistory(months?: number): Promise<
    ApiResponse<
      {
        year: number;
        month: number;
        income: number;
        expense: number;
        balance: number;
      }[]
    >
  > {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.getIncomeVsExpenseHistory(userId, months);
    })();
  }
}

