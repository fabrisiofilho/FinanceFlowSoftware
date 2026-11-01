export interface MonthRange {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
}

/** Ajusta a outra extremidade do intervalo sem alterar o objeto original. */
export function changeMonthRange(
  value: MonthRange,
  side: 'start' | 'end',
  text: string,
): MonthRange {
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(text)) return value;
  const [year, month] = text.split('-').map(Number);
  const next = { ...value, [`${side}Year`]: year, [`${side}Month`]: month };
  if (
    next.startYear * 12 + next.startMonth >
    next.endYear * 12 + next.endMonth
  ) {
    if (side === 'start') {
      next.endYear = year;
      next.endMonth = month;
    } else {
      next.startYear = year;
      next.startMonth = month;
    }
  }
  return next;
}
