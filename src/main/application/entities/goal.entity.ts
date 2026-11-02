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
import type { AccountEntity } from './account.entity';
import type { GoalContributionEntity } from './goal-contribution.entity';
@Entity('goals')
export class GoalEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne('FinanceUserEntity', 'goals')
  @JoinColumn({ name: 'user_id' })
  user!: RelationRef<FinanceUserEntity>;
  @Column({ name: 'user_id' })
  userId!: number;
  @Column({ type: 'text' })
  name!: string;
  @Column({ name: 'target_amount', type: 'integer', transformer: moneyColumn })
  targetAmount!: number;
  @Column({
    name: 'current_amount',
    type: 'integer',
    transformer: moneyColumn,
  })
  currentAmount: number = 0;
  @Column({ type: 'date', nullable: true })
  deadline?: Date;
  @ManyToOne('AccountEntity', { nullable: true })
  @JoinColumn({ name: 'account_id' })
  account?: RelationRef<AccountEntity>;
  @Column({ name: 'account_id', nullable: true })
  accountId?: number;
  @OneToMany('GoalContributionEntity', 'goal')
  contributions?: RelationRef<GoalContributionEntity>[];
}
