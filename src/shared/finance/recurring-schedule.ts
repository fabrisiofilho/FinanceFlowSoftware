import { parseCalendarDate } from './calendar-date';
import type { RecurringFrequency } from '../interfaces/types/recurring.types';

export const MONTHLY_RULES = [
  { value: 'calendar_day', label: 'Mesmo dia do mês' },
  { value: 'first_business_day', label: 'Primeiro dia útil do mês' },
  { value: 'last_business_day', label: 'Último dia útil do mês' },
] as const;
export type MonthlyRule = (typeof MONTHLY_RULES)[number]['value'];

// Calendário nacional: datas fixas e Sexta-feira da Paixão. Não inclui
// feriados estaduais/municipais, Carnaval ou pontos facultativos.
export function isBrazilBusinessDay(date: Date): boolean {
  if (date.getDay() === 0 || date.getDay() === 6) return false;
  const key = `${date.getMonth() + 1}-${date.getDate()}`;
  if (
    [
      '1-1',
      '4-21',
      '5-1',
      '9-7',
      '10-12',
      '11-2',
      '11-15',
      '11-20',
      '12-25',
    ].includes(key)
  )
    return false;
  const year = date.getFullYear();
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    n = h + l - 7 * m + 114;
  const friday = new Date(year, Math.floor(n / 31) - 1, (n % 31) + 1);
  friday.setDate(friday.getDate() - 2);
  return (
    date.getMonth() !== friday.getMonth() || date.getDate() !== friday.getDate()
  );
}

export function nextRecurringDate(
  from: Date | string,
  frequency: RecurringFrequency,
  dayOfMonth?: number,
  dayOfWeek?: number,
  skipCurrent = false,
  monthlyRule: MonthlyRule = 'calendar_day',
): Date {
  const date = parseCalendarDate(from);
  if (!date) throw new Error('Data da recorrência inválida.');
  date.setHours(0, 0, 0, 0);
  if (
    dayOfMonth != null &&
    (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)
  )
    throw new Error('Dia do mês inválido.');
  if (
    dayOfWeek != null &&
    (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)
  )
    throw new Error('Dia da semana inválido.');
  if (!['daily', 'weekly', 'biweekly', 'monthly', 'yearly'].includes(frequency))
    throw new Error('Frequência inválida.');
  if (!MONTHLY_RULES.some((rule) => rule.value === monthlyRule))
    throw new Error('Regra mensal inválida.');
  if (monthlyRule !== 'calendar_day' && frequency !== 'monthly')
    throw new Error('Regra de dia útil exige frequência mensal.');
  const result = new Date(date);
  if (frequency === 'monthly') {
    const anchor = dayOfMonth ?? date.getDate();
    const candidate = (offset: number): Date => {
      const start = new Date(date.getFullYear(), date.getMonth() + offset, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      if (monthlyRule === 'calendar_day')
        return new Date(
          start.getFullYear(),
          start.getMonth(),
          Math.min(anchor, end.getDate()),
        );
      const target = monthlyRule === 'first_business_day' ? start : end;
      while (!isBrazilBusinessDay(target))
        target.setDate(
          target.getDate() + (monthlyRule === 'first_business_day' ? 1 : -1),
        );
      return target;
    };
    let target = candidate(skipCurrent ? 1 : 0);
    if (target < date) target = candidate(1);
    return target;
  }
  if (skipCurrent) {
    if (frequency === 'yearly') {
      result.setDate(1);
      result.setFullYear(result.getFullYear() + 1);
      result.setDate(
        Math.min(
          dayOfMonth ?? date.getDate(),
          new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate(),
        ),
      );
    } else
      result.setDate(
        result.getDate() + { daily: 1, weekly: 7, biweekly: 14 }[frequency],
      );
  }
  if ((frequency === 'weekly' || frequency === 'biweekly') && dayOfWeek != null)
    result.setDate(result.getDate() + ((dayOfWeek - result.getDay() + 7) % 7));
  return result;
}
