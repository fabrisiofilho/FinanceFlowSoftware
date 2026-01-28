export type AccountType = 'checking' | 'savings' | 'credit_card' | 'wallet';
export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  closingDay?: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
  creditLimit?: number;
  closingDay?: number;
}
export interface UpdateAccountInput {
  name?: string;
  creditLimit?: number;
  closingDay?: number;
}
