import { BaseRepository } from './base-repository';
import { GoalContributionEntity } from '../entities/goal-contribution.entity';
import { EntityManager } from 'typeorm';
export class GoalContributionRepository extends BaseRepository<GoalContributionEntity> {
  constructor(manager?: EntityManager) {
    super(GoalContributionEntity, manager);
  }
  async findById(id: number): Promise<GoalContributionEntity | null> {
    return await this.findOne({
      where: { id },
      relations: ['goal'],
    });
  }
  async findByGoalId(goalId: number): Promise<GoalContributionEntity[]> {
    return await this.find({
      where: { goalId },
      order: { contributionDate: 'DESC', createdAt: 'DESC' },
    });
  }
  async createContribution(
    contributionData: Partial<GoalContributionEntity>,
  ): Promise<GoalContributionEntity> {
    return await this.save(contributionData);
  }
  async deleteContribution(id: number): Promise<void> {
    await this.delete({ id });
  }
  async deleteByGoalId(goalId: number): Promise<void> {
    await this.delete({ goalId });
  }
  async getTotalContributions(goalId: number): Promise<number> {
    const contributions = await this.findByGoalId(goalId);
    return contributions.reduce(
      (total, contribution) => total + Number(contribution.amount),
      0,
    );
  }
  async findByDateRange(
    goalId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<GoalContributionEntity[]> {
    return await this.repository
      .createQueryBuilder('contribution')
      .where('contribution.goal_id = :goalId', { goalId })
      .andWhere('contribution.contribution_date >= :startDate', { startDate })
      .andWhere('contribution.contribution_date <= :endDate', { endDate })
      .orderBy('contribution.contribution_date', 'DESC')
      .getMany();
  }
}
