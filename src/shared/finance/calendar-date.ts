/** Datas financeiras são dias de calendário locais, nunca instantes UTC. */
export function parseCalendarDate(
  value: Date | string | null | undefined,
): Date | null {
  if (value instanceof Date)
    return Number.isFinite(value.getTime()) ? new Date(value.getTime()) : null;
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]),
    month = Number(match[2]),
    day = Number(match[3]);
  if (year < 1000 || year > 9999) return null;
  const result = new Date(year, month - 1, day);
  return result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === day
    ? result
    : null;
}
