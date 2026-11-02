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
import type { FinanceUserEntity } from './finance-user.entity';
import type { TransactionEntity } from './transaction.entity';
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'wallet';
export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'elo'
  | 'amex'
  | 'hipercard'
  | 'diners'
  | 'other';
@Entity('accounts')
export class AccountEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne('FinanceUserEntity', 'accounts')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;
  @Column({ name: 'user_id' })
  userId!: number;
  @Column({ type: 'text' })
  name!: string;
  @Column({ type: 'text' })
  type!: AccountType;
  @Column({ type: 'integer', transformer: moneyColumn })
  balance: number = 0;
  @Column({
    name: 'initial_balance',
    type: 'integer',
    transformer: moneyColumn,
  })
  initialBalance: number = 0;
  @Column({
    name: 'credit_limit',
    type: 'integer',
    transformer: moneyColumn,
    nullable: true,
  })
  creditLimit?: number;
  @Column({ name: 'closing_day', type: 'integer', nullable: true })
  closingDay?: number;
  @Column({ name: 'card_color', type: 'text', nullable: true })
  cardColor?: string;
  @Column({ name: 'card_brand', type: 'text', nullable: true })
  cardBrand?: CardBrand;
  @Column({ name: 'bank_name', type: 'text', nullable: true })
  bankName?: string;
  @OneToMany('TransactionEntity', 'account')
  transactions?: RelationRef<TransactionEntity>[];
}
