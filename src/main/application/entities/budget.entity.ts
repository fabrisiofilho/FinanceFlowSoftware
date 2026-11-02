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

@Entity('budgets')
export class BudgetEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne('FinanceUserEntity')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;

  @Column({ name: 'category_id' })
  categoryId!: number;

  @ManyToOne('CategoryEntity')
  @JoinColumn({ name: 'category_id' })
  category!: RelationRef<CategoryEntity>;

  @Column({ type: 'integer' })
  year!: number;

  @Column({ type: 'integer' })
  month!: number;

  @Column({ name: 'planned_amount', type: 'integer', transformer: moneyColumn })
  plannedAmount!: number;
}
