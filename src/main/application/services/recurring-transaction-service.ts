import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import { requireAccountOwner, requireCategoryOwner } from './ownership';
import { validateEntryCreate } from '@shared/finance/commands';
import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { CreditCardService } from './credit-card-service';
import { NotificationService } from './notification-service';
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
  private async validate(
    userId: number,
    data: CreateRecurringTransactionInput,
  ): Promise<void> {
    validateEntryCreate({
      ...data,
      transactionDate: data.startDate,
      recurrence: 'once',
    });
    if (
      !['daily', 'weekly', 'biweekly', 'monthly', 'yearly'].includes(
        data.frequency,
      )
    )
      throw new Error('Frequência inválida.');
    if (
      data.dayOfMonth != null &&
      (!Number.isInteger(data.dayOfMonth) ||
        data.dayOfMonth < 1 ||
        data.dayOfMonth > 31)
    )
      throw new Error('Dia do mês inválido.');
    if (
      data.dayOfWeek != null &&
      (!Number.isInteger(data.dayOfWeek) ||
        data.dayOfWeek < 0 ||
        data.dayOfWeek > 6)
    )
      throw new Error('Dia da semana inválido.');
    if (
      data.endDate &&
      (!parseDateSafe(data.endDate) ||
        parseDateSafe(data.endDate)! < parseDateSafe(data.startDate)!)
    )
      throw new Error('Data final deve ser igual ou posterior à inicial.');
    await requireAccountOwner(userId, data.accountId);
    await requireCategoryOwner(userId, data.categoryId, data.type);
  }
  private static readonly generating = new Map<
    number,
    Promise<RecurringGenerationResult>
  >();

  private get recurringRepository() {
    return getDataSource().getRepository(RecurringTransactionEntity);
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
      endDate: entity.endDate
        ? (parseDateSafe(entity.endDate) ?? undefined)
        : undefined,
      nextOccurrence: parseDateSafe(entity.nextOccurrence) ?? new Date(),
      lastGenerated: entity.lastGenerated
        ? (parseDateSafe(entity.lastGenerated) ?? undefined)
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
    await this.validate(userId, data);

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
      endDate: data.endDate
        ? (parseDateSafe(data.endDate) ?? undefined)
        : undefined,
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

    await this.validate(userId, { ...recurring, ...data });
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

  generatePendingTransactions(
    userId: number,
  ): Promise<RecurringGenerationResult> {
    const current = RecurringTransactionService.generating.get(userId);
    if (current) return current;
    const pending = this.generatePending(userId).finally(() =>
      RecurringTransactionService.generating.delete(userId),
    );
    RecurringTransactionService.generating.set(userId, pending);
    return pending;
  }
  private async generatePending(
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

    if (generated.length > 0) {
      try {
        const notifications = new NotificationService();
        const settings = await notifications.getSettings(userId);
        if (settings.recurringGeneratedEnabled)
          await notifications.create(userId, {
            type: 'recurring_generated',
            title: 'Recorrências geradas',
            message:
              generated.length + ' lançamentos recorrentes foram registrados.',
            referenceType: 'recurring',
            priority: 'normal',
          });
      } catch (error) {
        logger.warning(
          'Não foi possível registrar aviso de recorrências',
          error,
        );
      }
    }
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
    return financialTransaction(async (manager) => {
      const rules = manager.getRepository(RecurringTransactionEntity);
      const current = await rules.findOne({
        where: { id: recurring.id, userId },
      });
      if (!current || !current.isActive)
        throw new Error('Regra recorrente indisponível.');
      await this.validate(userId, current);
      const date = parseDateSafe(current.nextOccurrence)!;
      const entries = manager.getRepository(TransactionEntity);
      const existing = await entries.findOne({
        where: { recurringRuleId: current.id, transactionDate: date },
      });
      if (existing) return existing;
      const entity = await entries.save(
        entries.create({
          description: current.description,
          amount: current.amount,
          type: current.type,
          paymentMethod: current.paymentMethod,
          expenseType: current.expenseType,
          transactionDate: date,
          recurringRuleId: current.id,
          recurrence: current.frequency === 'monthly' ? 'monthly' : 'weekly',
          accountId: current.accountId,
          categoryId: current.categoryId,
          status: current.autoConfirm ? 'settled' : 'pending',
          settlementDate: current.autoConfirm ? new Date() : null,
        }),
      );
      if (current.autoConfirm)
        await new BalanceCalculatorService(
          new AccountRepository(manager),
          new TransactionRepository(manager),
        ).updateBalanceAfterCreate(
          userId,
          current.accountId,
          current.type,
          Number(current.amount),
        );
      const account = await manager
        .getRepository(AccountEntity)
        .findOne({ where: { id: current.accountId, userId } });
      if (account?.type === 'credit_card' && current.type === 'expense')
        await new CreditCardService(manager).autoLinkTransactionToInvoice(
          userId,
          entity.id,
          entity.accountId,
          date,
        );
      current.lastGenerated = new Date();
      current.nextOccurrence = this.calculateNextOccurrence(
        date,
        current.frequency,
        current.dayOfMonth,
        current.dayOfWeek,
        true,
      );
      await rules.save(current);
      return entity;
    });
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
          result.setDate(1);
          result.setMonth(result.getMonth() + 1);
          result.setDate(
            Math.min(
              dayOfMonth ?? fromDate.getDate(),
              this.getDaysInMonth(result),
            ),
          );
          break;
        case 'yearly':
          result.setDate(1);
          result.setFullYear(result.getFullYear() + 1);
          result.setDate(
            Math.min(
              dayOfMonth ?? fromDate.getDate(),
              this.getDaysInMonth(result),
            ),
          );
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
      if (daysUntil > 0) {
        result.setDate(result.getDate() + daysUntil);
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
