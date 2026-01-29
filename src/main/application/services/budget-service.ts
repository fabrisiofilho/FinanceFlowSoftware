import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { BudgetEntity } from '../entities/budget.entity';
import { CategoryEntity } from '../entities/category.entity';
import { TransactionEntity } from '../entities/transaction.entity';
import {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetFilters,
  BudgetSummary,
  BudgetAlert,
} from '@shared/interfaces/types/budget.types';

export class BudgetService {
  private get budgetRepository() {
    return getDataSource().getRepository(BudgetEntity);
  }

  private get categoryRepository() {
    return getDataSource().getRepository(CategoryEntity);
  }

  private get transactionRepository() {
    return getDataSource().getRepository(TransactionEntity);
  }

  private mapEntityToBudget(
    entity: BudgetEntity,
    spentAmount?: number,
  ): Budget {
    const spent = spentAmount ?? 0;
    const remaining = entity.plannedAmount - spent;
    const percentUsed =
      entity.plannedAmount > 0 ? (spent / entity.plannedAmount) * 100 : 0;

    return {
      id: entity.id,
      userId: entity.userId,
      categoryId: entity.categoryId,
      categoryName: (entity.category as CategoryEntity)?.name,
      categoryIcon: (entity.category as CategoryEntity)?.icon ?? undefined,
      year: entity.year,
      month: entity.month,
      plannedAmount: Number(entity.plannedAmount),
      spentAmount: spent,
      remainingAmount: remaining,
      percentUsed,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }

  async create(userId: number, data: CreateBudgetInput): Promise<Budget> {
    logger.info('Criando orçamento para usuário:', userId);

    const category = await this.categoryRepository.findOne({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    const existing = await this.budgetRepository.findOne({
      where: {
        userId,
        categoryId: data.categoryId,
        year: data.year,
        month: data.month,
      },
    });

    if (existing) {
      throw new Error('Já existe um orçamento para esta categoria neste mês');
    }

    const budget = this.budgetRepository.create({
      userId,
      categoryId: data.categoryId,
      year: data.year,
      month: data.month,
      plannedAmount: data.plannedAmount,
    });

    const saved = await this.budgetRepository.save(budget);
    logger.success('Orçamento criado:', saved.id);

    return this.mapEntityToBudget(saved);
  }

  async update(
    userId: number,
    id: number,
    data: UpdateBudgetInput,
  ): Promise<Budget> {
    logger.info('Atualizando orçamento:', id);

    const budget = await this.budgetRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    if (data.plannedAmount !== undefined) {
      budget.plannedAmount = data.plannedAmount;
    }

    const saved = await this.budgetRepository.save(budget);
    const spent = await this.getSpentAmount(
      userId,
      budget.categoryId,
      budget.year,
      budget.month,
    );

    return this.mapEntityToBudget(saved, spent);
  }

  async delete(userId: number, id: number): Promise<void> {
    const budget = await this.budgetRepository.findOne({
      where: { id, userId },
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    await this.budgetRepository.remove(budget);
    logger.success('Orçamento excluído:', id);
  }

  async findById(userId: number, id: number): Promise<Budget | null> {
    const budget = await this.budgetRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });

    if (!budget) return null;

    const spent = await this.getSpentAmount(
      userId,
      budget.categoryId,
      budget.year,
      budget.month,
    );
    return this.mapEntityToBudget(budget, spent);
  }

  async findAll(userId: number, filters?: BudgetFilters): Promise<Budget[]> {
    const query = this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.category', 'category')
      .where('budget.user_id = :userId', { userId });

    if (filters?.year) {
      query.andWhere('budget.year = :year', { year: filters.year });
    }
    if (filters?.month) {
      query.andWhere('budget.month = :month', { month: filters.month });
    }
    if (filters?.categoryId) {
      query.andWhere('budget.category_id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    const budgets = await query.getMany();

    const result: Budget[] = [];
    for (const budget of budgets) {
      const spent = await this.getSpentAmount(
        userId,
        budget.categoryId,
        budget.year,
        budget.month,
      );
      result.push(this.mapEntityToBudget(budget, spent));
    }

    return result;
  }

  async getSummary(
    userId: number,
    year: number,
    month: number,
  ): Promise<BudgetSummary> {
    const budgets = await this.findAll(userId, { year, month });

    const totalPlanned = budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
    const totalSpent = budgets.reduce(
      (sum, b) => sum + (b.spentAmount ?? 0),
      0,
    );

    // Find categories without budget
    const budgetedCategoryIds = budgets.map((b) => b.categoryId);
    const categoriesWithoutBudget = await this.getCategoriesWithoutBudget(
      userId,
      year,
      month,
      budgetedCategoryIds,
    );

    return {
      year,
      month,
      totalPlanned,
      totalSpent,
      totalRemaining: totalPlanned - totalSpent,
      overallPercentUsed:
        totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0,
      budgets,
      categoriesWithoutBudget,
    };
  }

  async getAlerts(
    userId: number,
    year: number,
    month: number,
  ): Promise<BudgetAlert[]> {
    const budgets = await this.findAll(userId, { year, month });

    return budgets
      .filter((b) => (b.percentUsed ?? 0) >= 80)
      .map((b) => ({
        budgetId: b.id,
        categoryId: b.categoryId,
        categoryName: b.categoryName ?? '',
        plannedAmount: b.plannedAmount,
        spentAmount: b.spentAmount ?? 0,
        percentUsed: b.percentUsed ?? 0,
        status:
          (b.percentUsed ?? 0) >= 100
            ? 'exceeded'
            : (b.percentUsed ?? 0) >= 80
              ? 'warning'
              : 'ok',
      })) as BudgetAlert[];
  }

  async copyFromPreviousMonth(
    userId: number,
    year: number,
    month: number,
  ): Promise<Budget[]> {
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }

    const previousBudgets = await this.findAll(userId, {
      year: prevYear,
      month: prevMonth,
    });

    const created: Budget[] = [];
    for (const prev of previousBudgets) {
      try {
        const budget = await this.create(userId, {
          categoryId: prev.categoryId,
          year,
          month,
          plannedAmount: prev.plannedAmount,
        });
        created.push(budget);
      } catch {
        // Skip if already exists
      }
    }

    logger.success(`Copiados ${created.length} orçamentos do mês anterior`);
    return created;
  }

  private async getSpentAmount(
    userId: number,
    categoryId: number,
    year: number,
    month: number,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.category_id = :categoryId', { categoryId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .andWhere('t.transaction_date <= :endDate', { endDate })
      .getRawOne();

    return Number(result?.total ?? 0);
  }

  private async getCategoriesWithoutBudget(
    userId: number,
    year: number,
    month: number,
    excludeIds: number[],
  ): Promise<{ categoryId: number; categoryName: string; spent: number }[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    let query = this.transactionRepository
      .createQueryBuilder('t')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'spent')
      .innerJoin('t.category', 'c')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: 'expense' })
      .andWhere('t.transaction_date >= :startDate', { startDate })
      .andWhere('t.transaction_date <= :endDate', { endDate })
      .groupBy('c.id')
      .addGroupBy('c.name');

    if (excludeIds.length > 0) {
      query = query.andWhere('c.id NOT IN (:...excludeIds)', { excludeIds });
    }

    const results = await query.getRawMany();

    return results.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      spent: Number(r.spent),
    }));
  }
}
