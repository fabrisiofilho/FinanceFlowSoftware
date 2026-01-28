import { BaseRepository } from './base-repository';
import { GoalEntity } from '../entities/goal.entity';
import { EntityManager, LessThanOrEqual } from 'typeorm';
export class GoalRepository extends BaseRepository<GoalEntity> {
  constructor(manager?: EntityManager) {
    super(GoalEntity, manager);
  }
  async findById(id: number, userId: number): Promise<GoalEntity | null> {
    return await this.findOne({
      where: { id, userId },
      relations: ['account', 'contributions'],
    });
  }
  async findAllByUserId(userId: number): Promise<GoalEntity[]> {
    return await this.find({
      where: { userId },
      relations: ['account', 'contributions'],
      order: { createdAt: 'DESC' },
    });
  }
  async findByAccount(
    userId: number,
    accountId: number,
  ): Promise<GoalEntity[]> {
    return await this.find({
      where: { userId, accountId },
      relations: ['account', 'contributions'],
      order: { createdAt: 'DESC' },
    });
  }
  async findCompletedGoals(userId: number): Promise<GoalEntity[]> {
    const goals = await this.findAllByUserId(userId);
    return goals.filter(
      (goal) => Number(goal.currentAmount) >= Number(goal.targetAmount),
    );
  }
  async findActiveGoals(userId: number): Promise<GoalEntity[]> {
    const goals = await this.findAllByUserId(userId);
    return goals.filter(
      (goal) => Number(goal.currentAmount) < Number(goal.targetAmount),
    );
  }
  async findGoalsWithUpcomingDeadline(
    userId: number,
    daysAhead: number = 30,
  ): Promise<GoalEntity[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return await this.find({
      where: {
        userId,
        deadline: LessThanOrEqual(futureDate),
      },
      relations: ['account', 'contributions'],
      order: { deadline: 'ASC' },
    });
  }
  async createGoal(
    userId: number,
    goalData: Partial<GoalEntity>,
  ): Promise<GoalEntity> {
    return await this.save({ ...goalData, userId, currentAmount: 0 });
  }
  async updateGoal(
    id: number,
    userId: number,
    goalData: Partial<GoalEntity>,
  ): Promise<GoalEntity | null> {
    await this.update({ id, userId }, goalData);
    return await this.findById(id, userId);
  }
  async deleteGoal(id: number, userId: number): Promise<void> {
    await this.delete({ id, userId });
  }
  async updateCurrentAmount(
    id: number,
    userId: number,
    newAmount: number,
  ): Promise<void> {
    await this.update({ id, userId }, { currentAmount: newAmount });
  }
  async addToCurrentAmount(
    id: number,
    userId: number,
    amount: number,
  ): Promise<GoalEntity | null> {
    const goal = await this.findById(id, userId);
    if (!goal) {
      return null;
    }
    const newAmount = Number(goal.currentAmount) + amount;
    await this.updateCurrentAmount(id, userId, newAmount);
    return await this.findById(id, userId);
  }
  async countByAccount(accountId: number): Promise<number> {
    return await this.count({ accountId });
  }
}
