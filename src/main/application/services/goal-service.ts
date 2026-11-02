import { amountToCents } from '@shared/finance/entry-schedule';
import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import { contributeToGoal } from '@shared/finance/ledger';
import { GoalEntity } from '../entities/goal.entity';
import { GoalContributionEntity } from '../entities/goal-contribution.entity';
import { logger } from '@main/infrastructure/log/logger';
import {
  Goal,
  GoalProgress,
  GoalContribution,
  CreateGoalInput,
  UpdateGoalInput,
  AddContributionInput,
} from '@shared/interfaces/types/goal.types';
import { repositoryCache } from '../repositories/repository-cache';
import { parseDateSafe } from '@main/infrastructure/utils/date-utils';
export class GoalService {
  private onGoalCompletedCallback?: (goal: Goal) => void;
  private get goalRepository() {
    return repositoryCache.goalRepository;
  }
  private get contributionRepository() {
    return repositoryCache.goalContributionRepository;
  }
  setOnGoalCompletedCallback(callback: (goal: Goal) => void): void {
    this.onGoalCompletedCallback = callback;
  }
  private calculateProgress(
    currentAmount: number,
    targetAmount: number,
  ): number {
    if (targetAmount <= 0) {
      return 0;
    }
    const progress = (currentAmount / targetAmount) * 100;
    return Math.min(progress, 100);
  }
  private mapEntityToGoal(entity: GoalEntity): Goal {
    const currentAmount = Number(entity.currentAmount);
    const targetAmount = Number(entity.targetAmount);
    return {
      id: entity.id,
      name: entity.name,
      targetAmount,
      currentAmount,
      deadline: entity.deadline
        ? (parseDateSafe(entity.deadline) ?? undefined)
        : undefined,
      accountId: entity.accountId ?? undefined,
      progress: this.calculateProgress(currentAmount, targetAmount),
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }
  private mapEntityToContribution(
    entity: GoalContributionEntity,
  ): GoalContribution {
    return {
      id: entity.id,
      goalId: entity.goalId,
      amount: Number(entity.amount),
      contributionDate: parseDateSafe(entity.contributionDate) ?? new Date(),
      createdAt: entity.createdAt ?? new Date(),
    };
  }
  private validateCreateInput(data: CreateGoalInput): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome da meta é obrigatório');
    }
    if (data.targetAmount === undefined || data.targetAmount === null) {
      throw new Error('Valor alvo é obrigatório');
    }
    amountToCents(data.targetAmount);
    if (data.targetAmount <= 0) {
      throw new Error('Valor alvo deve ser maior que zero');
    }
    if (data.deadline) {
      const deadlineDate = parseDateSafe(data.deadline);
      if (!deadlineDate) {
        throw new Error('Data limite inválida');
      }
    }
  }
  private validateUpdateInput(data: UpdateGoalInput): void {
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nome da meta não pode ser vazio');
    }
    if (data.targetAmount !== undefined) amountToCents(data.targetAmount);
    if (data.targetAmount !== undefined && data.targetAmount <= 0) {
      throw new Error('Valor alvo deve ser maior que zero');
    }
    if (data.deadline) {
      const deadlineDate = parseDateSafe(data.deadline);
      if (!deadlineDate) {
        throw new Error('Data limite inválida');
      }
    }
  }
  private validateContributionInput(data: AddContributionInput): void {
    if (data.amount === undefined || data.amount === null) {
      throw new Error('Valor da contribuição é obrigatório');
    }
    amountToCents(data.amount);
    if (data.amount <= 0) {
      throw new Error('Valor da contribuição deve ser maior que zero');
    }
    if (data.contributionDate) {
      const contributionDate = parseDateSafe(data.contributionDate);
      if (!contributionDate) {
        throw new Error('Data da contribuição inválida');
      }
    }
  }
  private notifyGoalCompleted(goal: Goal): void {
    logger.success(`Meta "${goal.name}" atingida! Parabéns!`);
    if (this.onGoalCompletedCallback) {
      this.onGoalCompletedCallback(goal);
    }
  }
  async create(userId: number, data: CreateGoalInput): Promise<Goal> {
    logger.info('Criando nova meta para usuário:', userId);
    this.validateCreateInput(data);
    if (
      data.accountId &&
      !(await repositoryCache.accountRepository.findById(
        data.accountId,
        userId,
      ))
    )
      throw new Error('Conta não encontrada.');
    const goalData: Partial<GoalEntity> = {
      name: data.name.trim(),
      targetAmount: data.targetAmount,
      currentAmount: 0,
      deadline: data.deadline
        ? (parseDateSafe(data.deadline) ?? undefined)
        : undefined,
      accountId: data.accountId ?? undefined,
    };
    const goalEntity = await this.goalRepository.createGoal(userId, goalData);
    logger.success('Meta criada com sucesso:', goalEntity.name);
    return this.mapEntityToGoal(goalEntity);
  }
  async update(
    userId: number,
    id: number,
    data: UpdateGoalInput,
  ): Promise<Goal> {
    logger.info('Atualizando meta:', id);
    const existingGoal = await this.goalRepository.findById(id, userId);
    if (!existingGoal) {
      throw new Error('Meta não encontrada');
    }
    this.validateUpdateInput(data);
    if (
      data.accountId &&
      !(await repositoryCache.accountRepository.findById(
        data.accountId,
        userId,
      ))
    )
      throw new Error('Conta não encontrada.');
    const updateData: Partial<GoalEntity> = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.targetAmount !== undefined) {
      updateData.targetAmount = data.targetAmount;
    }
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline
        ? (parseDateSafe(data.deadline) ?? undefined)
        : undefined;
    }
    if (data.accountId !== undefined) {
      updateData.accountId = data.accountId;
    }
    const updatedEntity = await this.goalRepository.updateGoal(
      id,
      userId,
      updateData,
    );
    if (!updatedEntity) {
      throw new Error('Erro ao atualizar meta');
    }
    logger.success('Meta atualizada com sucesso:', updatedEntity.name);
    return this.mapEntityToGoal(updatedEntity);
  }
  async delete(userId: number, id: number): Promise<void> {
    logger.info('Excluindo meta:', id);
    const existingGoal = await this.goalRepository.findById(id, userId);
    if (!existingGoal) {
      throw new Error('Meta não encontrada');
    }
    await this.contributionRepository.deleteByGoalId(id);
    await this.goalRepository.deleteGoal(id, userId);
    logger.success('Meta excluída com sucesso:', existingGoal.name);
  }
  async findById(userId: number, id: number): Promise<Goal | null> {
    const goalEntity = await this.goalRepository.findById(id, userId);
    if (!goalEntity) {
      return null;
    }
    return this.mapEntityToGoal(goalEntity);
  }
  async findAll(userId: number): Promise<Goal[]> {
    const goals = await this.goalRepository.findAllByUserId(userId);
    return goals.map((entity) => this.mapEntityToGoal(entity));
  }
  async addContribution(
    userId: number,
    goalId: number,
    data: AddContributionInput,
  ): Promise<Goal> {
    logger.info('Adicionando contribuição à meta:', goalId);
    this.validateContributionInput(data);
    const date = data.contributionDate
      ? parseDateSafe(data.contributionDate)
      : new Date();
    if (!date) throw new Error('Data da contribuição inválida.');
    const result = await financialTransaction(async (manager) =>
      contributeToGoal(
        {
          findOwnedGoal: async (actorId, id) => {
            const goal = await manager
              .getRepository(GoalEntity)
              .findOneBy({ id, userId: actorId });
            return goal
              ? {
                  currentCents: Math.round(goal.currentAmount * 100),
                  targetCents: Math.round(goal.targetAmount * 100),
                }
              : null;
          },
          append: async (id, cents, date) => {
            await manager.getRepository(GoalContributionEntity).save({
              goalId: id,
              amount: cents / 100,
              contributionDate: date,
            });
          },
          recompute: async (id) => {
            await manager.query(
              'UPDATE goals SET current_amount=(SELECT COALESCE(SUM(amount),0) FROM goal_contributions WHERE goal_id=?) WHERE id=? AND user_id=?',
              [id, id, userId],
            );
            return manager
              .getRepository(GoalEntity)
              .findOneByOrFail({ id, userId });
          },
        },
        { actorId: userId, goalId, amount: data.amount, date },
      ),
    );
    const wasCompleted = result.wasCompleted;
    const goal = this.mapEntityToGoal(result.entity);
    const isNowCompleted = goal.progress >= 100;
    if (!wasCompleted && isNowCompleted) {
      this.notifyGoalCompleted(goal);
    }
    logger.success(
      `Contribuição de R$ ${data.amount.toFixed(2)} adicionada à meta "${goal.name}". Progresso: ${goal.progress.toFixed(1)}%`,
    );
    return goal;
  }
  async getProgress(userId: number, goalId: number): Promise<GoalProgress> {
    const goalEntity = await this.goalRepository.findById(goalId, userId);
    if (!goalEntity) {
      throw new Error('Meta não encontrada');
    }
    const currentAmount = Number(goalEntity.currentAmount);
    const targetAmount = Number(goalEntity.targetAmount);
    const percentage = this.calculateProgress(currentAmount, targetAmount);
    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    const isCompleted = percentage >= 100;
    return {
      goalId,
      targetAmount,
      currentAmount,
      percentage,
      remainingAmount,
      isCompleted,
    };
  }
  async getContributions(
    userId: number,
    goalId: number,
  ): Promise<GoalContribution[]> {
    const goalEntity = await this.goalRepository.findById(goalId, userId);
    if (!goalEntity) {
      throw new Error('Meta não encontrada');
    }
    const contributions =
      await this.contributionRepository.findByGoalId(goalId);
    return contributions.map((entity) => this.mapEntityToContribution(entity));
  }
  async findActiveGoals(userId: number): Promise<Goal[]> {
    const goals = await this.goalRepository.findActiveGoals(userId);
    return goals.map((entity) => this.mapEntityToGoal(entity));
  }
  async findCompletedGoals(userId: number): Promise<Goal[]> {
    const goals = await this.goalRepository.findCompletedGoals(userId);
    return goals.map((entity) => this.mapEntityToGoal(entity));
  }
  async findGoalsWithUpcomingDeadline(
    userId: number,
    daysAhead: number = 30,
  ): Promise<Goal[]> {
    const goals = await this.goalRepository.findGoalsWithUpcomingDeadline(
      userId,
      daysAhead,
    );
    return goals.map((entity) => this.mapEntityToGoal(entity));
  }
}
