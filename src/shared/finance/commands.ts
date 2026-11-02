import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  Transaction,
} from '../interfaces/types/transaction.types';
import { assertPositiveAmount } from './validation';
import { amountToCents, installmentAmounts } from './entry-schedule';
import { parseCalendarDate as parseDateSafe } from './calendar-date';
export function validateEntryCreate(data: CreateTransactionInput): void {
  if (!data.description || data.description.trim().length === 0) {
    throw new Error('Descrição é obrigatória');
  }
  if (data.amount === undefined || data.amount === null) {
    throw new Error('Valor é obrigatório');
  }
  assertPositiveAmount(data.amount);
  amountToCents(data.amount);
  if (!parseDateSafe(data.transactionDate))
    throw new Error('Data da transação inválida');
  if (data.dueDate && !parseDateSafe(data.dueDate))
    throw new Error('Vencimento inválido');
  if (data.totalInstallments !== undefined)
    installmentAmounts(data.amount, data.totalInstallments);
  if (!data.type) {
    throw new Error('Tipo da transação é obrigatório');
  }
  const validTypes: Transaction['type'][] = ['income', 'expense'];
  if (!validTypes.includes(data.type)) {
    throw new Error('Tipo de transação inválido');
  }
  if (!data.transactionDate) {
    throw new Error('Data da transação é obrigatória');
  }
  if (!data.accountId) {
    throw new Error('Conta é obrigatória');
  }
  if (!data.categoryId) {
    throw new Error('Categoria é obrigatória');
  }
  if (data.totalInstallments !== undefined && data.totalInstallments !== null) {
    if (data.totalInstallments < 1) {
      throw new Error('Número de parcelas deve ser maior que zero');
    }
  }
  if (data.recurrence) {
    const validRecurrences: Transaction['recurrence'][] = [
      'once',
      'monthly',
      'weekly',
    ];
    if (!validRecurrences.includes(data.recurrence)) {
      throw new Error('Tipo de recorrência inválido');
    }
  }
}
export function validateEntryUpdate(data: UpdateTransactionInput): void {
  if (data.description !== undefined && data.description.trim().length === 0) {
    throw new Error('Descrição não pode ser vazia');
  }
  if (data.amount !== undefined) amountToCents(data.amount);
  if (
    data.transactionDate !== undefined &&
    !parseDateSafe(data.transactionDate)
  )
    throw new Error('Data da transação inválida');
  if (data.dueDate !== undefined && !parseDateSafe(data.dueDate))
    throw new Error('Vencimento inválido');
}
