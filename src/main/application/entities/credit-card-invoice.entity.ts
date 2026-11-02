import { moneyColumn } from '@main/infrastructure/database/money-column';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from './config/auditable-entity';
import type { RelationRef } from './config/relation-ref.entity';
import type { AccountEntity } from './account.entity';
import type { TransactionEntity } from './transaction.entity';
export type InvoiceStatus = 'open' | 'closed' | 'paid';
@Entity('credit_card_invoices')
export class CreditCardInvoiceEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne('AccountEntity')
  @JoinColumn({ name: 'account_id' })
  account!: RelationRef<AccountEntity>;
  @Column({ name: 'account_id' })
  accountId!: number;
  @Column({ type: 'integer' })
  year!: number;
  @Column({ type: 'integer' })
  month!: number;
  @Column({
    name: 'total_amount',
    type: 'integer',
    transformer: moneyColumn,
  })
  totalAmount: number = 0;
  @Column({ name: 'due_date', type: 'date' })
  dueDate!: Date;
  @Column({ type: 'text', default: 'open' })
  status!: InvoiceStatus;
  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt?: Date;
  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate?: Date;
  @ManyToOne('AccountEntity', { nullable: true })
  @JoinColumn({ name: 'payment_account_id' })
  paymentAccount?: RelationRef<AccountEntity>;
  @Column({ name: 'payment_account_id', nullable: true })
  paymentAccountId?: number;
  @OneToMany('TransactionEntity', 'creditCardInvoice')
  transactions?: RelationRef<TransactionEntity>[];
}
