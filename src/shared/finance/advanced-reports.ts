export type ReportPanel = 'health' | 'history' | 'categories' | 'comparison' | 'trends' | 'habits';
export interface AdvancedReportQuery {
  startDate: string;
  endDateExclusive: string;
  basis: 'settlement' | 'competence';
  accountIds?: number[];
  categoryIds?: number[];
}
export interface ReportRow {
  label: string;
  incomeCents?: number;
  expenseCents?: number;
  totalCents?: number;
  previousCents?: number;
  differenceCents?: number;
  variationPercent?: number | null;
  count?: number;
  averageCents?: number;
  percentage?: number;
  predictedCents?: number | null;
  points?: { month: string; amountCents: number }[];
}
export interface ReportHealth {
  score: number | null;
  savingsRate: number | null;
  expenseToIncomeRatio: number | null;
  budgetAdherence: number | null;
  emergencyFundMonths: number | null;
  sampleSize: number;
  completeMonths: number;
  budgetExcessCents: number;
  recommendations: string[];
}
export interface AdvancedReportResult {
  query: AdvancedReportQuery;
  panel: ReportPanel;
  methodology: string;
  rows: ReportRow[];
  health?: ReportHealth;
}
export function calendarDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Data civil inválida');
  const date = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || +value.slice(0, 4) < 1900) throw new Error('Data civil inválida');
  return value;
}
export function validateReportQuery(input: AdvancedReportQuery): AdvancedReportQuery {
  if (!input || typeof input !== 'object') throw new Error('Informe os filtros');
  const startDate = calendarDate(input.startDate), endDateExclusive = calendarDate(input.endDateExclusive);
  if (startDate >= endDateExclusive || +endDateExclusive.slice(0, 4) - +startDate.slice(0, 4) > 30) throw new Error('Período inválido (máximo 30 anos)');
  if (!['settlement', 'competence'].includes(input.basis)) throw new Error('Base de relatório inválida');
  const ids = (values?: number[]): number[] | undefined => {
    if (values === undefined) return undefined;
    if (!Array.isArray(values) || values.length > 200 || values.some((id) => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Filtro inválido');
    return [...new Set(values)];
  };
  return { startDate, endDateExclusive, basis: input.basis, accountIds: ids(input.accountIds), categoryIds: ids(input.categoryIds) };
}
export function reportMonths(query: AdvancedReportQuery): string[] {
  const months: string[] = [];
  let year = +query.startDate.slice(0, 4), month = +query.startDate.slice(5, 7);
  while (`${year}-${String(month).padStart(2, '0')}-01` < query.endDateExclusive) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    if (++month > 12) { month = 1; year++; }
  }
  return months;
}
export function relativeVariation(current: number, previous: number): number | null {
  return previous === 0 ? current === 0 ? 0 : null : (current - previous) / Math.abs(previous) * 100;
}
export function predictNext(points: number[]): number | null {
  if (points.length < 3 || points.filter((value) => value !== 0).length < 3) return null;
  const n = points.length, meanX = (n - 1) / 2, mean = points.reduce((a, b) => a + b, 0) / n;
  const slope = points.reduce((sum, y, x) => sum + (x - meanX) * (y - mean), 0) / points.reduce((sum, _, x) => sum + (x - meanX) ** 2, 0);
  return Math.max(0, Math.round(mean + slope * (n - meanX)));
}
