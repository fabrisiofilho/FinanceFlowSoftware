import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { RelationRef } from './config/relation-ref.entity';
import type { FinanceUserEntity } from './finance-user.entity';
import type { AccountEntity } from './account.entity';

export type BankCode =
  | 'santander'
  | 'bradesco'
  | 'itau'
  | 'bb'
  | 'caixa'
  | 'nubank'
  | 'inter'
  | 'other';
export type ImportFileType = 'ofx' | 'csv' | 'xlsx';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('bank_imports')
export class BankImportEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne('FinanceUserEntity')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;

  @Column({ name: 'account_id' })
  accountId!: number;

  @ManyToOne('AccountEntity')
  @JoinColumn({ name: 'account_id' })
  account!: RelationRef<AccountEntity>;

  @Column({ name: 'bank_code', type: 'text' })
  bankCode!: BankCode;

  @Column({ type: 'text' })
  filename!: string;

  @Column({ name: 'file_type', type: 'text' })
  fileType!: ImportFileType;

  @Column({
    name: 'import_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  importDate!: Date;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'total_transactions', type: 'integer', default: 0 })
  totalTransactions!: number;

  @Column({ name: 'imported_count', type: 'integer', default: 0 })
  importedCount!: number;

  @Column({ name: 'duplicate_count', type: 'integer', default: 0 })
  duplicateCount!: number;

  @Column({ name: 'error_count', type: 'integer', default: 0 })
  errorCount!: number;

  @Column({ type: 'text', default: 'pending' })
  status!: ImportStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
