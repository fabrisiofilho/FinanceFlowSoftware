import { moneyColumn } from '@main/infrastructure/database/money-column';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from './config/auditable-entity';
import type { RelationRef } from './config/relation-ref.entity';
import type { AccountEntity } from './account.entity';
import type { CategoryEntity } from './category.entity';
import type { CreditCardInvoiceEntity } from './credit-card-invoice.entity';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash';
export type ExpenseType = 'fixed' | 'variable';
export type Recurrence = 'once' | 'monthly' | 'weekly';
@Entity('transactions')
export class TransactionEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'text' })
  description!: string;
  @Column({ type: 'integer', transformer: moneyColumn })
  amount!: number;
  @Column({ type: 'text' })
  type!: TransactionType;
  @Column({ name: 'payment_method', type: 'text', nullable: true })
  paymentMethod?: PaymentMethod;
  @Column({ name: 'expense_type', type: 'text', nullable: true })
  expenseType?: ExpenseType;
  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate!: Date;
  @Column({ type: 'text', default: 'settled' })
  status!: 'pending' | 'settled' | 'cancelled';
  @Column({ name: 'settlement_date', type: 'date', nullable: true })
  settlementDate?: Date | null;
  @Column({ type: 'text', default: 'entry' })
  origin!: 'entry' | 'transfer';
  @Column({ name: 'recurring_rule_id', type: 'integer', nullable: true })
  recurringRuleId?: number;
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: Date;
  @Column({ name: 'installment_number', type: 'integer', nullable: true })
  installmentNumber?: number;
  @Column({ name: 'total_installments', type: 'integer', nullable: true })
  totalInstallments?: number;
  @Column({ name: 'installment_group_id', type: 'text', nullable: true })
  installmentGroupId?: string;
  @Column({ type: 'text', nullable: true })
  recurrence?: Recurrence;
  @ManyToOne('AccountEntity', 'transactions')
  @JoinColumn({ name: 'account_id' })
  account!: RelationRef<AccountEntity>;
  @Column({ name: 'account_id' })
  accountId!: number;
  @ManyToOne('CategoryEntity')
  @JoinColumn({ name: 'category_id' })
  category!: RelationRef<CategoryEntity>;
  @Column({ name: 'category_id' })
  categoryId!: number;
  @ManyToOne('CreditCardInvoiceEntity', 'transactions', { nullable: true })
  @JoinColumn({ name: 'credit_card_invoice_id' })
  creditCardInvoice?: RelationRef<CreditCardInvoiceEntity>;
  @Column({ name: 'credit_card_invoice_id', nullable: true })
  creditCardInvoiceId?: number;
}
