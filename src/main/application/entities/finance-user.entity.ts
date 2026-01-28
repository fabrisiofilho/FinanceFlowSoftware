import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AuditableEntity } from './config/auditable-entity';
import type { RelationRef } from './config/relation-ref.entity';
import type { AccountEntity } from './account.entity';
import type { CategoryEntity } from './category.entity';
import type { GoalEntity } from './goal.entity';
import type { AlertEntity } from './alert.entity';
@Entity('finance_users')
export class FinanceUserEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'text' })
  name!: string;
  @Column({ type: 'text', unique: true })
  email!: string;
  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;
  @OneToMany('AccountEntity', 'user')
  accounts?: RelationRef<AccountEntity>[];
  @OneToMany('CategoryEntity', 'user')
  categories?: RelationRef<CategoryEntity>[];
  @OneToMany('GoalEntity', 'user')
  goals?: RelationRef<GoalEntity>[];
  @OneToMany('AlertEntity', 'user')
  alerts?: RelationRef<AlertEntity>[];
}
