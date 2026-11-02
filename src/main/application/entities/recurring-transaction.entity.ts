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
import type { FinanceUserEntity } from './finance-user.entity';
import type { AccountEntity } from './account.entity';
import type { CategoryEntity } from './category.entity';

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash';
export type ExpenseType = 'fixed' | 'variable';
export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly';

@Entity('recurring_transactions')
export class RecurringTransactionEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne('FinanceUserEntity')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;

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

  @Column({ type: 'text' })
  frequency!: RecurringFrequency;

  @Column({ name: 'day_of_month', type: 'integer', nullable: true })
  dayOfMonth?: number;

  @Column({ name: 'day_of_week', type: 'integer', nullable: true })
  dayOfWeek?: number;

  @Column({ name: 'account_id' })
  accountId!: number;

  @ManyToOne('AccountEntity')
  @JoinColumn({ name: 'account_id' })
  account!: RelationRef<AccountEntity>;

  @Column({ name: 'category_id' })
  categoryId!: number;

  @ManyToOne('CategoryEntity')
  @JoinColumn({ name: 'category_id' })
  category!: RelationRef<CategoryEntity>;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'next_occurrence', type: 'date' })
  nextOccurrence!: Date;

  @Column({ name: 'last_generated', type: 'date', nullable: true })
  lastGenerated?: Date;

  @Column({ name: 'is_active', type: 'integer', default: 1 })
  isActive!: boolean;

  @Column({ name: 'auto_confirm', type: 'integer', default: 0 })
  autoConfirm!: boolean;
}
