import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import type { RelationRef } from './config/relation-ref.entity';
import type { GoalEntity } from './goal.entity';
@Entity('goal_contributions')
export class GoalContributionEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne('GoalEntity', 'contributions')
  @JoinColumn({ name: 'goal_id' })
  goal!: RelationRef<GoalEntity>;
  @Column({ name: 'goal_id' })
  goalId!: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;
  @Column({ name: 'contribution_date', type: 'date' })
  contributionDate!: Date;
  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;
}
