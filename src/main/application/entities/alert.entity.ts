import { moneyColumn } from '@main/infrastructure/database/money-column';
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
import type { CategoryEntity } from './category.entity';
@Entity('alerts')
export class AlertEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne('FinanceUserEntity', 'alerts')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;
  @Column({ name: 'user_id' })
  userId!: number;
  @ManyToOne('CategoryEntity')
  @JoinColumn({ name: 'category_id' })
  category!: RelationRef<CategoryEntity>;
  @Column({ name: 'category_id' })
  categoryId!: number;
  @Column({ name: 'limit_amount', type: 'integer', transformer: moneyColumn })
  limitAmount!: number;
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
