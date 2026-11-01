import { IReportController } from '@shared/interfaces/controllers/report.controller.interface';
import { ReportService } from '../services/report-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  ReportFilters,
  ExportResult,
  IncomeVsExpense,
  ReportData,
} from '@shared/interfaces/types/report.types';
import type { CategoryExpense } from '@shared/interfaces/types/transaction.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class ReportController extends BaseHandler implements IReportController {
  @IpcMethod('report:generateReport')
  async generateReport(
    filters: ReportFilters,
  ): Promise<ApiResponse<ReportData>> {
    return wrap(() =>
      this.reportService.generateReport(this.getUserId(), filters),
    )();
  }
  private _reportService: ReportService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();
  private get reportService(): ReportService {
    if (!this._reportService) {
      this._reportService = new ReportService();
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
  @IpcMethod('report:generatePDF')
  async generatePDF(
    filters: ReportFilters,
  ): Promise<ApiResponse<ExportResult>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.exportToPDF(userId, filters);
    })();
  }
  @IpcMethod('report:generateCSV')
  async generateCSV(
    filters: ReportFilters,
  ): Promise<ApiResponse<ExportResult>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.exportToCSV(userId, filters);
    })();
  }
  @IpcMethod('report:getExpensesByCategory')
  async getExpensesByCategory(
    year: number,
    month: number,
  ): Promise<ApiResponse<CategoryExpense[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.getExpensesByCategory(
        userId,
        year,
        month,
      );
    })();
  }
  @IpcMethod('report:getIncomeVsExpenses')
  async getIncomeVsExpenses(
    months: number = 6,
  ): Promise<ApiResponse<IncomeVsExpense[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.reportService.getIncomeVsExpenses(userId, months);
    })();
  }
}
