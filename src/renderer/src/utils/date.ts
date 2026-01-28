import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

export function formatDateToShow(date: Date | string): string {
  if (!date) return '';

  let dateObj: Date;

  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else if (date.includes('T')) {
      dateObj = parseISO(date);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  return format(dateObj, 'dd/MM/yyyy');
}

export function formatTimeToShow(date: Date | string): string {
  if (!date) return '';

  const dateWithTimezone = toZonedTime(new Date(date), TIMEZONE);

  return format(dateWithTimezone, 'HH:mm:ss');
}

export function formatMonthYear(year: number, month: number): string {
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${monthNames[month - 1]}/${year}`;
}

export function formatMonthYearShort(year: number, month: number): string {
  const monthNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return `${monthNames[month - 1]}/${year}`;
}
