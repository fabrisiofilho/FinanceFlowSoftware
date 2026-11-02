import { parseCalendarDate } from './calendar-date';
import type { EntryStatus } from '../interfaces/types/transaction.types';
export function entryState(
  status: EntryStatus | undefined,
  date: Date | string | null | undefined,
  fallback: Date,
): { status: EntryStatus; settlementDate: Date | null } {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const state =
    status ?? (!date && fallback > endOfToday ? 'pending' : 'settled');
  if (!['pending', 'settled', 'cancelled'].includes(state))
    throw new Error('Situação inválida.');
  if (state !== 'settled') return { status: state, settlementDate: null };
  if (date === null) throw new Error('Informe a data de liquidação.');
  const settlementDate = parseCalendarDate(date ?? fallback);
  if (!settlementDate)
    throw new Error('Informe uma data de liquidação válida.');
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (settlementDate > today)
    throw new Error('A liquidação não pode estar no futuro. Use Pendente.');
  return { status: state, settlementDate };
}
export function settledAmount(entry: {
  status?: string;
  amount: number;
}): number {
  return (entry.status ?? 'settled') === 'settled' ? Number(entry.amount) : 0;
}
