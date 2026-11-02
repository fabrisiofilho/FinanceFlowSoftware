import { moneyColumn } from '@main/infrastructure/database/money-column';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { RelationRef } from './config/relation-ref.entity';
import type { BankImportEntity } from './bank-import.entity';
import type { TransactionEntity } from './transaction.entity';
import type { CategoryEntity } from './category.entity';

export type ImportTransactionStatus =
  | 'pending'
  | 'matched'
  | 'imported'
  | 'ignored'
  | 'duplicate';
export type TransactionType = 'income' | 'expense';

@Entity('bank_import_transactions')
export class BankImportTransactionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'import_id' })
  importId!: number;

  @ManyToOne('BankImportEntity')
  @JoinColumn({ name: 'import_id' })
  import!: RelationRef<BankImportEntity>;

  @Column({ name: 'external_id', type: 'text', nullable: true })
  externalId?: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'integer', transformer: moneyColumn })
  amount!: number;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate!: Date;

  @Column({ type: 'text' })
  type!: TransactionType;

  @Column({ name: 'raw_data', type: 'text', nullable: true })
  rawData?: string;

  @Column({ type: 'text', default: 'pending' })
  status!: ImportTransactionStatus;

  @Column({ name: 'matched_transaction_id', nullable: true })
  matchedTransactionId?: number;

  @ManyToOne('TransactionEntity', { nullable: true })
  @JoinColumn({ name: 'matched_transaction_id' })
  matchedTransaction?: RelationRef<TransactionEntity>;

  @Column({ name: 'suggested_category_id', nullable: true })
  suggestedCategoryId?: number;

  @ManyToOne('CategoryEntity', { nullable: true })
  @JoinColumn({ name: 'suggested_category_id' })
  suggestedCategory?: RelationRef<CategoryEntity>;

  @Column({
    name: 'confidence_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  confidenceScore?: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
