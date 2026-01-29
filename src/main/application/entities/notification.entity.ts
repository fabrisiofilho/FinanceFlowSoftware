import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { RelationRef } from './config/relation-ref.entity';
import type { FinanceUserEntity } from './finance-user.entity';

export type NotificationType =
  | 'bill_due'
  | 'budget_exceeded'
  | 'goal_reached'
  | 'recurring_generated'
  | 'low_balance'
  | 'invoice_closing'
  | 'custom';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne('FinanceUserEntity')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;

  @Column({ type: 'text' })
  type!: NotificationType;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text', default: 'normal' })
  priority!: NotificationPriority;

  @Column({ name: 'reference_type', type: 'text', nullable: true })
  referenceType?: string;

  @Column({ name: 'reference_id', type: 'integer', nullable: true })
  referenceId?: number;

  @Column({ name: 'is_read', type: 'integer', default: 0 })
  isRead!: boolean;

  @Column({ name: 'is_dismissed', type: 'integer', default: 0 })
  isDismissed!: boolean;

  @Column({ name: 'scheduled_at', type: 'datetime', nullable: true })
  scheduledAt?: Date;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sentAt?: Date;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
