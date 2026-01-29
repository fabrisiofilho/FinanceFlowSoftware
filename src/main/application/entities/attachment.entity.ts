import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { RelationRef } from './config/relation-ref.entity';
import type { TransactionEntity } from './transaction.entity';

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'transaction_id' })
  transactionId!: number;

  @ManyToOne('TransactionEntity')
  @JoinColumn({ name: 'transaction_id' })
  transaction!: RelationRef<TransactionEntity>;

  @Column({ type: 'text' })
  filename!: string;

  @Column({ name: 'original_name', type: 'text' })
  originalName!: string;

  @Column({ name: 'mime_type', type: 'text' })
  mimeType!: string;

  @Column({ name: 'file_size', type: 'integer' })
  fileSize!: number;

  @Column({ name: 'file_path', type: 'text' })
  filePath!: string;

  @Column({ name: 'thumbnail_path', type: 'text', nullable: true })
  thumbnailPath?: string;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
