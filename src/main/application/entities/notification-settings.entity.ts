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

@Entity('notification_settings')
export class NotificationSettingsEntity extends AuditableEntity {
  @Column({ name: 'investment_yield_enabled', type: 'integer', default: 1 })
  investmentYieldEnabled!: boolean;
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', unique: true })
  userId!: number;

  @ManyToOne('FinanceUserEntity')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;

  @Column({ name: 'bill_due_enabled', type: 'integer', default: 1 })
  billDueEnabled!: boolean;

  @Column({ name: 'bill_due_days_before', type: 'integer', default: 3 })
  billDueDaysBefore!: number;

  @Column({ name: 'budget_exceeded_enabled', type: 'integer', default: 1 })
  budgetExceededEnabled!: boolean;

  @Column({ name: 'budget_threshold_percent', type: 'integer', default: 80 })
  budgetThresholdPercent!: number;

  @Column({ name: 'goal_reached_enabled', type: 'integer', default: 1 })
  goalReachedEnabled!: boolean;

  @Column({ name: 'recurring_generated_enabled', type: 'integer', default: 1 })
  recurringGeneratedEnabled!: boolean;

  @Column({ name: 'low_balance_enabled', type: 'integer', default: 1 })
  lowBalanceEnabled!: boolean;

  @Column({
    name: 'low_balance_threshold',
    type: 'integer',
    transformer: moneyColumn,
  })
  lowBalanceThreshold: number = 100;

  @Column({ name: 'invoice_closing_enabled', type: 'integer', default: 1 })
  invoiceClosingEnabled!: boolean;

  @Column({ name: 'invoice_closing_days_before', type: 'integer', default: 5 })
  invoiceClosingDaysBefore!: number;

  @Column({ name: 'sound_enabled', type: 'integer', default: 1 })
  soundEnabled!: boolean;
}
