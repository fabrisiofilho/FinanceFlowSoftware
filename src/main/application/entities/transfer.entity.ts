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
import type { CurrencyEntity } from './currency.entity';
import type { TransactionEntity } from './transaction.entity';

@Entity('transfers')
export class TransferEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne('FinanceUserEntity')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;

  @Column({ name: 'from_account_id' })
  fromAccountId!: number;

  @ManyToOne('AccountEntity')
  @JoinColumn({ name: 'from_account_id' })
  fromAccount!: RelationRef<AccountEntity>;

  @Column({ name: 'to_account_id' })
  toAccountId!: number;

  @ManyToOne('AccountEntity')
  @JoinColumn({ name: 'to_account_id' })
  toAccount!: RelationRef<AccountEntity>;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ name: 'from_currency_id', nullable: true })
  fromCurrencyId?: number;

  @ManyToOne('CurrencyEntity', { nullable: true })
  @JoinColumn({ name: 'from_currency_id' })
  fromCurrency?: RelationRef<CurrencyEntity>;

  @Column({ name: 'to_currency_id', nullable: true })
  toCurrencyId?: number;

  @ManyToOne('CurrencyEntity', { nullable: true })
  @JoinColumn({ name: 'to_currency_id' })
  toCurrency?: RelationRef<CurrencyEntity>;

  @Column({
    name: 'exchange_rate',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 1,
  })
  exchangeRate!: number;

  @Column({
    name: 'converted_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  convertedAmount?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'transfer_date', type: 'date' })
  transferDate!: Date;

  @Column({ name: 'from_transaction_id', nullable: true })
  fromTransactionId?: number;

  @ManyToOne('TransactionEntity', { nullable: true })
  @JoinColumn({ name: 'from_transaction_id' })
  fromTransaction?: RelationRef<TransactionEntity>;

  @Column({ name: 'to_transaction_id', nullable: true })
  toTransactionId?: number;

  @ManyToOne('TransactionEntity', { nullable: true })
  @JoinColumn({ name: 'to_transaction_id' })
  toTransaction?: RelationRef<TransactionEntity>;
}
