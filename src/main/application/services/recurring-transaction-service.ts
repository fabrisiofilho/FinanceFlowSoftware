import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { RecurringTransactionEntity } from '../entities/recurring-transaction.entity';
import { TransactionEntity } from '../entities/transaction.entity';
import { AccountEntity } from '../entities/account.entity';
import { CategoryEntity } from '../entities/category.entity';
import {
  RecurringTransaction,
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
  RecurringTransactionFilters,
  RecurringGenerationResult,
  RecurringFrequency,
} from '@shared/interfaces/types/recurring.types';
import { BalanceCalculatorService } from './balance-calculator-service';
import { parseDateSafe } from '@main/infrastructure/utils/date-utils';

export class RecurringTransactionService {
  private balanceCalculatorService = new BalanceCalculatorService();

  private get recurringRepository() {
    return getDataSource().getRepository(RecurringTransactionEntity);
  }

  private get transactionRepository() {
    return getDataSource().getRepository(TransactionEntity);
  }

  private mapEntityToRecurring(
    entity: RecurringTransactionEntity,
  ): RecurringTransaction {
    const account = entity.account as AccountEntity | undefined;
    const category = entity.category as CategoryEntity | undefined;
    
    return {
      id: entity.id,
      userId: entity.userId,
      description: entity.description,
      amount: Number(entity.amount),
      type: entity.type,
      paymentMethod: entity.paymentMethod,
      expenseType: entity.expenseType,
      frequency: entity.frequency,
      dayOfMonth: entity.dayOfMonth,
      dayOfWeek: entity.dayOfWeek,
      accountId: entity.accountId,
      accountName: account?.name,
      categoryId: entity.categoryId,
      categoryName: category?.name,
      categoryIcon: category?.icon ?? undefined,
      startDate: parseDateSafe(entity.startDate) ?? new Date(),
      endDate: entity.endDate ? parseDateSafe(entity.endDate) ?? undefined : undefined,
      nextOccurrence: parseDateSafe(entity.nextOccurrence) ?? new Date(),
      lastGenerated: entity.lastGenerated
        ? parseDateSafe(entity.lastGenerated) ?? undefined
        : undefined,
      isActive: Boolean(entity.isActive),
      autoConfirm: Boolean(entity.autoConfirm),
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }

  async create(
    userId: number,
    data: CreateRecurringTransactionInput,
  ): Promise<RecurringTransaction> {
    logger.info('Criando transação recorrente para usuário:', userId);

    const nextOccurrence = this.calculateNextOccurrence(
      parseDateSafe(data.startDate) ?? new Date(),
      data.frequency,
      data.dayOfMonth,
      data.dayOfWeek,
    );

    const recurring = this.recurringRepository.create({
      userId,
      description: data.description,
      amount: data.amount,
      type: data.type,
      paymentMethod: data.paymentMethod,
      expenseType: data.expenseType,
      frequency: data.frequency,
      dayOfMonth: data.dayOfMonth,
      dayOfWeek: data.dayOfWeek,
      accountId: data.accountId,
      categoryId: data.categoryId,
      startDate: parseDateSafe(data.startDate) ?? new Date(),
      endDate: data.endDate ? parseDateSafe(data.endDate) ?? undefined : undefined,
      nextOccurrence,
      isActive: true,
      autoConfirm: data.autoConfirm ?? false,
    });

    const saved = await this.recurringRepository.save(recurring);
    logger.success('Transação recorrente criada:', saved.id);

    return this.findById(userId, saved.id) as Promise<RecurringTransaction>;
  }

  async update(
    userId: number,
    id: number,
    data: UpdateRecurringTransactionInput,
  ): Promise<RecurringTransaction> {
    logger.info('Atualizando transação recorrente:', id);

    const recurring = await this.recurringRepository.findOne({
      where: { id, userId },
    });

    if (!recurring) {
      throw new Error('Transação recorrente não encontrada');
    }

    Object.assign(recurring, {
      ...data,
      endDate: data.endDate ? parseDateSafe(data.endDate) : recurring.endDate,
    });

    if (
      data.frequency ||
      data.dayOfMonth !== undefined ||
      data.dayOfWeek !== undefined
    ) {
      recurring.nextOccurrence = this.calculateNextOccurrence(
        new Date(),
        data.frequency ?? recurring.frequency,
        data.dayOfMonth ?? recurring.dayOfMonth,
        data.dayOfWeek ?? recurring.dayOfWeek,
      );
    }

    await this.recurringRepository.save(recurring);
    return this.findById(userId, id) as Promise<RecurringTransaction>;
  }

  async delete(userId: number, id: number): Promise<void> {
    const recurring = await this.recurringRepository.findOne({
      where: { id, userId },
    });

    if (!recurring) {
      throw new Error('Transação recorrente não encontrada');
    }

    await this.recurringRepository.remove(recurring);
    logger.success('Transação recorrente excluída:', id);
  }

  async findById(
    userId: number,
    id: number,
  ): Promise<RecurringTransaction | null> {
    const recurring = await this.recurringRepository.findOne({
      where: { id, userId },
      relations: ['account', 'category'],
    });

    return recurring ? this.mapEntityToRecurring(recurring) : null;
  }

  async findAll(
    userId: number,
    filters?: RecurringTransactionFilters,
  ): Promise<RecurringTransaction[]> {
    const query = this.recurringRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.account', 'account')
      .leftJoinAndSelect('r.category', 'category')
      .where('r.user_id = :userId', { userId });

    if (filters?.type) {
      query.andWhere('r.type = :type', { type: filters.type });
    }
    if (filters?.frequency) {
      query.andWhere('r.frequency = :frequency', {
        frequency: filters.frequency,
      });
    }
    if (filters?.accountId) {
      query.andWhere('r.account_id = :accountId', {
        accountId: filters.accountId,
      });
    }
    if (filters?.categoryId) {
      query.andWhere('r.category_id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }
    if (filters?.isActive !== undefined) {
      query.andWhere('r.is_active = :isActive', {
        isActive: filters.isActive ? 1 : 0,
      });
    }

    query.orderBy('r.next_occurrence', 'ASC');

    const results = await query.getMany();
    return results.map((r) => this.mapEntityToRecurring(r));
  }

  async generatePendingTransactions(
    userId: number,
  ): Promise<RecurringGenerationResult> {
    logger.info(
      'Gerando transações recorrentes pendentes para usuário:',
      userId,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingRecurrings = await this.recurringRepository
      .createQueryBuilder('r')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.is_active = 1')
      .andWhere('r.next_occurrence <= :today', { today })
      .andWhere('(r.end_date IS NULL OR r.end_date >= :today)', { today })
      .getMany();

    const generated: RecurringGenerationResult['generated'] = [];
    const errors: RecurringGenerationResult['errors'] = [];

    for (const recurring of pendingRecurrings) {
      try {
        const transaction = await this.generateTransaction(userId, recurring);
        generated.push({
          recurringId: recurring.id,
          transactionId: transaction.id,
          description: transaction.description,
          amount: Number(transaction.amount),
          date: parseDateSafe(transaction.transactionDate) ?? new Date(),
          isConfirmed: recurring.autoConfirm,
        });

        // Update next occurrence
        recurring.lastGenerated = new Date();
        recurring.nextOccurrence = this.calculateNextOccurrence(
          parseDateSafe(recurring.nextOccurrence) ?? new Date(),
          recurring.frequency,
          recurring.dayOfMonth,
          recurring.dayOfWeek,
          true,
        );
        await this.recurringRepository.save(recurring);
      } catch (error) {
        errors.push({
          recurringId: recurring.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    logger.success(
      `Geradas ${generated.length} transações, ${errors.length} erros`,
    );

    return {
      generated,
      errors,
      nextRun: this.getNextRunDate(),
    };
  }

  private async generateTransaction(
    userId: number,
    recurring: RecurringTransactionEntity,
  ): Promise<TransactionEntity> {
    const transaction = this.transactionRepository.create({
      description: recurring.description,
      amount: recurring.amount,
      type: recurring.type,
      paymentMethod: recurring.paymentMethod,
      expenseType: recurring.expenseType,
      transactionDate: parseDateSafe(recurring.nextOccurrence) ?? new Date(),
      recurrence: recurring.frequency === 'monthly' ? 'monthly' : 'weekly',
      accountId: recurring.accountId,
      categoryId: recurring.categoryId,
    });

    const saved = await this.transactionRepository.save(transaction);

    if (recurring.autoConfirm) {
      await this.balanceCalculatorService.updateBalanceAfterCreate(
        userId,
        recurring.accountId,
        recurring.type,
        Number(recurring.amount),
      );
    }

    return saved;
  }

  private calculateNextOccurrence(
    fromDate: Date,
    frequency: RecurringFrequency,
    dayOfMonth?: number,
    dayOfWeek?: number,
    skipCurrent: boolean = false,
  ): Date {
    const result = new Date(fromDate);

    if (skipCurrent) {
      switch (frequency) {
        case 'daily':
          result.setDate(result.getDate() + 1);
          break;
        case 'weekly':
          result.setDate(result.getDate() + 7);
          break;
        case 'biweekly':
          result.setDate(result.getDate() + 14);
          break;
        case 'monthly':
          result.setMonth(result.getMonth() + 1);
          break;
        case 'yearly':
          result.setFullYear(result.getFullYear() + 1);
          break;
      }
    }

    if (dayOfMonth && (frequency === 'monthly' || frequency === 'yearly')) {
      result.setDate(Math.min(dayOfMonth, this.getDaysInMonth(result)));
    }

    if (
      dayOfWeek !== undefined &&
      (frequency === 'weekly' || frequency === 'biweekly')
    ) {
      const currentDay = result.getDay();
      const daysUntil = (dayOfWeek - currentDay + 7) % 7;
      if (daysUntil > 0 || skipCurrent) {
        result.setDate(result.getDate() + (daysUntil || 7));
      }
    }

    return result;
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private getNextRunDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}
