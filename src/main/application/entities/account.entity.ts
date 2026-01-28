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
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance!: number;
  @Column({
    name: 'credit_limit',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  creditLimit?: number;
  @Column({ name: 'closing_day', type: 'integer', nullable: true })
  closingDay?: number;
  @OneToMany('TransactionEntity', 'account')
  transactions?: RelationRef<TransactionEntity>[];
}
