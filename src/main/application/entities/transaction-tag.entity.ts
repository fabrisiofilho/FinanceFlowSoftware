import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { RelationRef } from './config/relation-ref.entity';
import type { TransactionEntity } from './transaction.entity';
import type { TagEntity } from './tag.entity';

@Entity('transaction_tags')
export class TransactionTagEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'transaction_id' })
  transactionId!: number;

  @ManyToOne('TransactionEntity')
  @JoinColumn({ name: 'transaction_id' })
  transaction!: RelationRef<TransactionEntity>;

  @Column({ name: 'tag_id' })
  tagId!: number;

  @ManyToOne('TagEntity')
  @JoinColumn({ name: 'tag_id' })
  tag!: RelationRef<TagEntity>;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
