import { ApiResponse } from '../types/common.types';
import { CategoryExpense } from '../types/transaction.types';
import {
  ReportFilters,
  IncomeVsExpense,
  ExportResult,
  ReportData,
} from '../types/report.types';
export interface IReportController {
  generateReport(filters: ReportFilters): Promise<ApiResponse<ReportData>>;
  generatePDF(filters: ReportFilters): Promise<ApiResponse<ExportResult>>;
  generateCSV(filters: ReportFilters): Promise<ApiResponse<ExportResult>>;
  getExpensesByCategory(
    year: number,
    month: number,
  ): Promise<ApiResponse<CategoryExpense[]>>;
  getIncomeVsExpenses(months: number): Promise<ApiResponse<IncomeVsExpense[]>>;
}
