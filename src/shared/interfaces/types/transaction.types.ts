export type EntryStatus = 'pending' | 'settled' | 'cancelled';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash';
export type ExpenseType = 'fixed' | 'variable';
export type Recurrence = 'once' | 'monthly' | 'weekly';
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  paymentMethod?: PaymentMethod;
  expenseType?: ExpenseType;
  transactionDate: Date;
  dueDate?: Date;
  status?: EntryStatus;
  settlementDate?: Date | null;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  recurrence?: Recurrence;
  accountId: number;
  categoryId: number;
  creditCardInvoiceId?: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface CreateTransactionInput {
  description: string;
  amount: number;
  type: TransactionType;
  paymentMethod?: PaymentMethod;
  expenseType?: ExpenseType;
  transactionDate: Date;
  dueDate?: Date;
  status?: EntryStatus;
  settlementDate?: Date | null;
  totalInstallments?: number;
  recurrence?: Recurrence;
  accountId: number;
  categoryId: number;
}
export interface UpdateTransactionInput {
  type?: TransactionType;
  accountId?: number;
  description?: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
  expenseType?: ExpenseType;
  transactionDate?: Date;
  dueDate?: Date;
  status?: EntryStatus;
  settlementDate?: Date | null;
  categoryId?: number;
}
export type SortDirection = 'ASC' | 'DESC';
export type TransactionSortField =
  | 'transactionDate'
  | 'amount'
  | 'description'
  | 'type'
  | 'createdAt';
export interface SortConfig {
  field: TransactionSortField;
  direction: SortDirection;
}
export interface TransactionFilters {
  search?: string;
  accountIds?: number[];
  categoryIds?: number[];
  types?: TransactionType[];
  statuses?: ('pending' | 'settled' | 'cancelled')[];
  status?: EntryStatus;
  startDate?: Date;
  endDate?: Date;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  categoryId?: number;
  accountId?: number;
  type?: TransactionType;
  page?: number;
  size?: number;
  sort?: SortConfig;
}
export interface CategoryExpense {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string;
  totalAmount: number;
  percentage: number;
}
export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: CategoryExpense[];
  received?: number;
  paid?: number;
  pendingIncome?: number;
  pendingExpenses?: number;
}
