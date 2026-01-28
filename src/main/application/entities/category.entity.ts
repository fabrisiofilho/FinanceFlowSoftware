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
export type CategoryType = 'income' | 'expense';
@Entity('categories')
export class CategoryEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne('FinanceUserEntity', 'categories', { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: RelationRef<FinanceUserEntity>;
  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  @Column({ type: 'text' })
  name!: string;
  @Column({ type: 'text' })
  type!: CategoryType;
  @Column({ type: 'text', nullable: true })
  icon?: string;
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;
}
