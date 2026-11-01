import { parseCalendarDate } from '@shared/finance/calendar-date';
/**
 * Utilitários para tratamento seguro de datas, evitando problemas de timezone.
 *
 * O problema: Quando o SQLite armazena uma data como '2025-11-01' e o TypeORM lê,
 * ele cria um `new Date('2025-11-01')` que é interpretado como UTC meia-noite.
 * Ao converter para o fuso local (ex: Brasil, UTC-3), a data "volta" para o dia anterior.
 *
 * A solução: Sempre criar datas no formato YYYY-MM-DD como datas locais usando
 * new Date(year, month - 1, day) em vez de new Date('YYYY-MM-DD').
 */

/**
 * Converte uma string de data (YYYY-MM-DD) ou Date para um objeto Date
 * sem problemas de timezone. Datas no formato YYYY-MM-DD são tratadas
 * como datas locais, não UTC.
 */
export const parseDateSafe = parseCalendarDate;

/**
 * Converte uma Date para string no formato YYYY-MM-DD de forma segura,
 * usando os valores locais (não UTC).
 */
export function formatDateToISO(
  date: Date | string | null | undefined,
): string | null {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? parseDateSafe(date) : date;
  if (!dateObj) return null;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Cria uma nova Date a partir de uma data existente, garantindo que seja tratada
 * como data local. Útil para quando você recebe uma Date do TypeORM que pode
 * estar com problema de timezone.
 */
export function ensureLocalDate(
  date: Date | string | null | undefined,
): Date | null {
  if (!date) return null;

  if (date instanceof Date) {
    // Criar nova data usando os componentes locais
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  return parseDateSafe(date);
}

/**
 * Compara duas datas ignorando a hora (apenas ano, mês e dia).
 * Retorna: -1 se date1 < date2, 0 se iguais, 1 se date1 > date2
 */
export function compareDatesOnly(
  date1: Date | string | null | undefined,
  date2: Date | string | null | undefined,
): number {
  const d1 = parseDateSafe(date1);
  const d2 = parseDateSafe(date2);

  if (!d1 && !d2) return 0;
  if (!d1) return -1;
  if (!d2) return 1;

  const d1Str = formatDateToISO(d1);
  const d2Str = formatDateToISO(d2);

  if (d1Str === d2Str) return 0;
  return d1Str! < d2Str! ? -1 : 1;
}
