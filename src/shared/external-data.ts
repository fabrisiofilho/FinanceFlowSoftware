import { parseCalendarDate } from './finance/calendar-date';
import type { IndicatorPoint } from './interfaces/types/external-data.types';

export function parseBcbSeries(
  input: unknown,
  today = new Date(),
): IndicatorPoint[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 1000)
    throw new Error('A fonte não retornou uma série válida.');
  const seen = new Map<string, number>();
  for (const row of input) {
    if (
      !row ||
      typeof row.data !== 'string' ||
      typeof row.valor !== 'string' ||
      !/^\d{2}\/\d{2}\/\d{4}$/.test(row.data) ||
      !/^[-+]?\d+(?:[.,]\d+)?$/.test(row.valor)
    )
      throw new Error('Formato de indicador inválido.');
    const [day, month, year] = row.data.split('/');
    const date = `${year}-${month}-${day}`,
      parsed = parseCalendarDate(date);
    const value = Number(row.valor.replace(',', '.'));
    if (!parsed || !Number.isFinite(value) || Math.abs(value) > 1e9)
      throw new Error('Valor ou data do indicador inválido.');
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    if (parsed > end) throw new Error('A fonte retornou uma data futura.');
    if (seen.has(date) && seen.get(date) !== value)
      throw new Error('Publicações conflitantes na fonte.');
    seen.set(date, value);
  }
  return [...seen]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function ipcaTwelveMonths(points: IndicatorPoint[]): number | null {
  const last = points.slice(-12);
  if (last.length !== 12) return null;
  if (
    last.some(
      (point) =>
        !parseCalendarDate(point.date) ||
        !Number.isFinite(point.value) ||
        point.value <= -100,
    )
  )
    return null;
  for (let i = 1; i < last.length; i++) {
    const previous = parseCalendarDate(last[i - 1].date)!,
      current = parseCalendarDate(last[i].date)!;
    if (
      (current.getFullYear() - previous.getFullYear()) * 12 +
        current.getMonth() -
        previous.getMonth() !==
      1
    )
      return null;
  }
  return (
    (last.reduce((factor, point) => factor * (1 + point.value / 100), 1) - 1) *
    100
  );
}
