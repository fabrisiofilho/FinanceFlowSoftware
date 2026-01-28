import {
  TransactionRepository,
  TransactionFilters as RepoFilters,
} from '../repositories/transaction-repository';
import { AccountRepository } from '../repositories/account-repository';
import { CategoryRepository } from '../repositories/category-repository';
import { BalanceCalculatorService } from './balance-calculator-service';
import {
  TransactionEntity,
  TransactionType,
} from '../entities/transaction.entity';
import { logger } from '@main/infrastructure/log/logger';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  MonthSummary,
  CategoryExpense,
} from '@shared/interfaces/types/transaction.types';
import { repositoryCache } from '../repositories/repository-cache';
export class TransactionService {
  private _balanceCalculatorService: BalanceCalculatorService | null = null;
  private _injectedTransactionRepository: TransactionRepository | null = null;
  private _injectedAccountRepository: AccountRepository | null = null;
  private _injectedCategoryRepository: CategoryRepository | null = null;
  private _injectedBalanceCalculatorService: BalanceCalculatorService | null =
    null;
  private static readonly RECURRING_MONTHS = 12;
  private get transactionRepository(): TransactionRepository {
    if (this._injectedTransactionRepository) {
      return this._injectedTransactionRepository;
    }
    return repositoryCache.transactionRepository;
  }
  private get accountRepository(): AccountRepository {
    if (this._injectedAccountRepository) {
      return this._injectedAccountRepository;
    }
    return repositoryCache.accountRepository;
  }
  private get categoryRepository(): CategoryRepository {
    if (this._injectedCategoryRepository) {
      return this._injectedCategoryRepository;
    }
    return repositoryCache.categoryRepository;
  }
  private get balanceCalculatorService(): BalanceCalculatorService {
    if (this._injectedBalanceCalculatorService) {
      return this._injectedBalanceCalculatorService;
    }
    if (!this._balanceCalculatorService) {
      this._balanceCalculatorService = new BalanceCalculatorService();
    }
    return this._balanceCalculatorService;
  }
  constructor(
    transactionRepository?: TransactionRepository,
    accountRepository?: AccountRepository,
    categoryRepository?: CategoryRepository,
    balanceCalculatorService?: BalanceCalculatorService,
  ) {
    if (transactionRepository) {
      this._injectedTransactionRepository = transactionRepository;
    }
    if (accountRepository) {
      this._injectedAccountRepository = accountRepository;
    }
    if (categoryRepository) {
      this._injectedCategoryRepository = categoryRepository;
    }
    if (balanceCalculatorService) {
      this._injectedBalanceCalculatorService = balanceCalculatorService;
    }
  }
  private mapEntityToTransaction(entity: TransactionEntity): Transaction {
    return {
      id: entity.id,
      description: entity.description,
      amount: Number(entity.amount),
      type: entity.type as Transaction['type'],
      paymentMethod: entity.paymentMethod as Transaction['paymentMethod'],
      expenseType: entity.expenseType as Transaction['expenseType'],
      transactionDate: new Date(entity.transactionDate),
      dueDate: entity.dueDate ? new Date(entity.dueDate) : undefined,
      installmentNumber: entity.installmentNumber ?? undefined,
      totalInstallments: entity.totalInstallments ?? undefined,
      installmentGroupId: entity.installmentGroupId ?? undefined,
      recurrence: entity.recurrence as Transaction['recurrence'],
      accountId: entity.accountId,
      categoryId: entity.categoryId,
      creditCardInvoiceId: entity.creditCardInvoiceId ?? undefined,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }
  private validateCreateInput(data: CreateTransactionInput): void {
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Descrição é obrigatória');
    }
    if (data.amount === undefined || data.amount === null) {
      throw new Error('Valor é obrigatório');
    }
    if (data.amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }
    if (!data.type) {
      throw new Error('Tipo da transação é obrigatório');
    }
    const validTypes: Transaction['type'][] = ['income', 'expense'];
    if (!validTypes.includes(data.type)) {
      throw new Error('Tipo de transação inválido');
    }
    if (!data.transactionDate) {
      throw new Error('Data da transação é obrigatória');
    }
    if (!data.accountId) {
      throw new Error('Conta é obrigatória');
    }
    if (!data.categoryId) {
      throw new Error('Categoria é obrigatória');
    }
    if (
      data.totalInstallments !== undefined &&
      data.totalInstallments !== null
    ) {
      if (data.totalInstallments < 1) {
        throw new Error('Número de parcelas deve ser maior que zero');
      }
    }
    if (data.recurrence) {
      const validRecurrences: Transaction['recurrence'][] = [
        'once',
        'monthly',
        'weekly',
      ];
      if (!validRecurrences.includes(data.recurrence)) {
        throw new Error('Tipo de recorrência inválido');
      }
    }
  }
  private validateUpdateInput(data: UpdateTransactionInput): void {
    if (
      data.description !== undefined &&
      data.description.trim().length === 0
    ) {
      throw new Error('Descrição não pode ser vazia');
    }
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }
  }
  private async validateAccount(
    userId: number,
    accountId: number,
  ): Promise<void> {
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
  }
  private async validateCategory(
    userId: number,
    categoryId: number,
  ): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId, userId);
    if (!category) {
      throw new Error('Categoria não encontrada');
    }
  }
  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
  async create(
    userId: number,
    data: CreateTransactionInput,
  ): Promise<Transaction> {
    logger.info('Criando nova transação para usuário:', userId);
    this.validateCreateInput(data);
    await this.validateAccount(userId, data.accountId);
    await this.validateCategory(userId, data.categoryId);
    const isInstallment = data.totalInstallments && data.totalInstallments > 1;
    const isRecurring =
      data.recurrence === 'monthly' || data.recurrence === 'weekly';
    let createdTransaction: Transaction;
    if (isInstallment) {
      createdTransaction = await this.createInstallmentTransactions(
        userId,
        data,
      );
    } else if (isRecurring) {
      createdTransaction = await this.createRecurringTransactions(userId, data);
    } else {
      createdTransaction = await this.createSingleTransaction(userId, data);
    }
    logger.success('Transação criada com sucesso:', createdTransaction.id);
    return createdTransaction;
  }
  private async createSingleTransaction(
    userId: number,
    data: CreateTransactionInput,
  ): Promise<Transaction> {
    const transactionData: Partial<TransactionEntity> = {
      description: data.description.trim(),
      amount: data.amount,
      type: data.type as TransactionType,
      paymentMethod: data.paymentMethod,
      expenseType: data.expenseType,
      transactionDate: new Date(data.transactionDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      recurrence: data.recurrence ?? 'once',
      accountId: data.accountId,
      categoryId: data.categoryId,
    };
    const entity =
      await this.transactionRepository.createTransaction(transactionData);
    await this.balanceCalculatorService.updateBalanceAfterCreate(
      userId,
      data.accountId,
      data.type as TransactionType,
      data.amount,
    );
    return this.mapEntityToTransaction(entity);
  }
  private async createInstallmentTransactions(
    userId: number,
    data: CreateTransactionInput,
  ): Promise<Transaction> {
    const totalInstallments = data.totalInstallments!;
    const installmentGroupId = crypto.randomUUID();
    const installmentAmount = Number(
      (data.amount / totalInstallments).toFixed(2),
    );
    logger.info(
      `Criando ${totalInstallments} parcelas com valor ${installmentAmount} cada`,
    );
    let firstTransaction: TransactionEntity | null = null;
    for (let i = 1; i <= totalInstallments; i++) {
      const installmentDate = this.addMonths(
        new Date(data.transactionDate),
        i - 1,
      );
      const dueDate = data.dueDate
        ? this.addMonths(new Date(data.dueDate), i - 1)
        : undefined;
      const transactionData: Partial<TransactionEntity> = {
        description: `${data.description.trim()} (${i}/${totalInstallments})`,
        amount: installmentAmount,
        type: data.type as TransactionType,
        paymentMethod: data.paymentMethod,
        expenseType: data.expenseType,
        transactionDate: installmentDate,
        dueDate: dueDate,
        installmentNumber: i,
        totalInstallments: totalInstallments,
        installmentGroupId: installmentGroupId,
        recurrence: 'once',
        accountId: data.accountId,
        categoryId: data.categoryId,
      };
      const entity =
        await this.transactionRepository.createTransaction(transactionData);
      if (i === 1) {
        firstTransaction = entity;
      }
      await this.balanceCalculatorService.updateBalanceAfterCreate(
        userId,
        data.accountId,
        data.type as TransactionType,
        installmentAmount,
      );
    }
    return this.mapEntityToTransaction(firstTransaction!);
  }
  private async createRecurringTransactions(
    userId: number,
    data: CreateTransactionInput,
  ): Promise<Transaction> {
    const installmentGroupId = crypto.randomUUID();
    const totalMonths = TransactionService.RECURRING_MONTHS;
    logger.info(`Criando ${totalMonths} transações recorrentes mensais`);
    let firstTransaction: TransactionEntity | null = null;
    for (let i = 0; i < totalMonths; i++) {
      const transactionDate = this.addMonths(new Date(data.transactionDate), i);
      const dueDate = data.dueDate
        ? this.addMonths(new Date(data.dueDate), i)
        : undefined;
      const transactionData: Partial<TransactionEntity> = {
        description: data.description.trim(),
        amount: data.amount,
        type: data.type as TransactionType,
        paymentMethod: data.paymentMethod,
        expenseType: data.expenseType,
        transactionDate: transactionDate,
        dueDate: dueDate,
        installmentNumber: i + 1,
        totalInstallments: totalMonths,
        installmentGroupId: installmentGroupId,
        recurrence: data.recurrence,
        accountId: data.accountId,
        categoryId: data.categoryId,
      };
      const entity =
        await this.transactionRepository.createTransaction(transactionData);
      if (i === 0) {
        firstTransaction = entity;
      }
      await this.balanceCalculatorService.updateBalanceAfterCreate(
        userId,
        data.accountId,
        data.type as TransactionType,
        data.amount,
      );
    }
    return this.mapEntityToTransaction(firstTransaction!);
  }
  async update(
    userId: number,
    id: number,
    data: UpdateTransactionInput,
  ): Promise<Transaction> {
    logger.info('Atualizando transação:', id);
    const existingEntity = await this.transactionRepository.findById(
      id,
      userId,
    );
    if (!existingEntity) {
      throw new Error('Transação não encontrada');
    }
    this.validateUpdateInput(data);
    if (data.categoryId) {
      await this.validateCategory(userId, data.categoryId);
    }
    const oldAmount = Number(existingEntity.amount);
    const oldType = existingEntity.type as TransactionType;
    const updateData: Partial<TransactionEntity> = {};
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }
    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod;
    }
    if (data.expenseType !== undefined) {
      updateData.expenseType = data.expenseType;
    }
    if (data.transactionDate !== undefined) {
      updateData.transactionDate = new Date(data.transactionDate);
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = new Date(data.dueDate);
    }
    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId;
    }
    const updatedEntity = await this.transactionRepository.updateTransaction(
      id,
      userId,
      updateData,
    );
    if (!updatedEntity) {
      throw new Error('Erro ao atualizar transação');
    }
    if (data.amount !== undefined && data.amount !== oldAmount) {
      await this.balanceCalculatorService.updateBalanceAfterUpdate(
        userId,
        existingEntity.accountId,
        oldType,
        oldAmount,
        oldType,
        data.amount,
      );
    }
    logger.success('Transação atualizada com sucesso:', id);
    return this.mapEntityToTransaction(updatedEntity);
  }
  async delete(
    userId: number,
    id: number,
    deleteAllInstallments: boolean = false,
  ): Promise<void> {
    logger.info(
      'Excluindo transação:',
      id,
      'deleteAllInstallments:',
      deleteAllInstallments,
    );
    const existingEntity = await this.transactionRepository.findById(
      id,
      userId,
    );
    if (!existingEntity) {
      throw new Error('Transação não encontrada');
    }
    const hasInstallmentGroup =
      existingEntity.installmentGroupId &&
      existingEntity.totalInstallments &&
      existingEntity.totalInstallments > 1;
    if (hasInstallmentGroup && deleteAllInstallments) {
      await this.deleteInstallmentGroup(
        userId,
        existingEntity.installmentGroupId!,
      );
    } else {
      await this.deleteSingleTransaction(userId, existingEntity);
    }
    logger.success('Transação excluída com sucesso');
  }
  private async deleteSingleTransaction(
    userId: number,
    entity: TransactionEntity,
  ): Promise<void> {
    await this.balanceCalculatorService.updateBalanceAfterDelete(
      userId,
      entity.accountId,
      entity.type as TransactionType,
      Number(entity.amount),
    );
    await this.transactionRepository.deleteTransaction(entity.id, userId);
  }
  private async deleteInstallmentGroup(
    userId: number,
    installmentGroupId: string,
  ): Promise<void> {
    const transactions =
      await this.transactionRepository.findByInstallmentGroup(
        installmentGroupId,
      );
    for (const transaction of transactions) {
      await this.balanceCalculatorService.updateBalanceAfterDelete(
        userId,
        transaction.accountId,
        transaction.type as TransactionType,
        Number(transaction.amount),
      );
    }
    await this.transactionRepository.deleteInstallmentGroup(
      installmentGroupId,
      userId,
    );
  }
  async deleteMany(userId: number, ids: number[]): Promise<number> {
    logger.info(`Excluindo ${ids.length} transações em lote`);
    if (ids.length === 0) {
      return 0;
    }
    const transactions = await this.transactionRepository.findByIds(
      ids,
      userId,
    );
    for (const transaction of transactions) {
      await this.balanceCalculatorService.updateBalanceAfterDelete(
        userId,
        transaction.accountId,
        transaction.type as TransactionType,
        Number(transaction.amount),
      );
    }
    const deletedCount = await this.transactionRepository.deleteMany(
      ids,
      userId,
    );
    logger.success(`${deletedCount} transações excluídas com sucesso`);
    return deletedCount;
  }
  async findById(userId: number, id: number): Promise<Transaction | null> {
    const entity = await this.transactionRepository.findById(id, userId);
    if (!entity) {
      return null;
    }
    return this.mapEntityToTransaction(entity);
  }
  async findAll(
    userId: number,
    filters?: TransactionFilters,
  ): Promise<{
    content: Transaction[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }> {
    const repoFilters: RepoFilters = {};
    if (filters) {
      if (filters.startDate) {
        repoFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        repoFilters.endDate = new Date(filters.endDate);
      }
      if (filters.categoryId) {
        repoFilters.categoryId = filters.categoryId;
      }
      if (filters.type) {
        repoFilters.type = filters.type as TransactionType;
      }
      if (filters.accountId) {
        repoFilters.accountId = filters.accountId;
      }
      repoFilters.page = filters.page ?? 0;
      repoFilters.size = filters.size ?? 10;
      if (filters.sort) {
        repoFilters.sort = filters.sort;
      }
    }
    const result = await this.transactionRepository.findWithFilters(
      userId,
      repoFilters,
    );
    return {
      content: result.content.map((entity) =>
        this.mapEntityToTransaction(entity),
      ),
      page: result.page,
      size: result.size,
      totalElements: result.totalElements,
      totalPages: result.totalPages,
    };
  }
  async findByPeriod(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.findByPeriod(
      userId,
      startDate,
      endDate,
    );
    return entities.map((entity) => this.mapEntityToTransaction(entity));
  }
  async findByCategory(
    userId: number,
    categoryId: number,
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.findByCategory(
      userId,
      categoryId,
    );
    return entities.map((entity) => this.mapEntityToTransaction(entity));
  }
  async findByType(
    userId: number,
    type: Transaction['type'],
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.findByType(
      userId,
      type as TransactionType,
    );
    return entities.map((entity) => this.mapEntityToTransaction(entity));
  }
  async findByAccount(
    userId: number,
    accountId: number,
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.findByAccount(
      userId,
      accountId,
    );
    return entities.map((entity) => this.mapEntityToTransaction(entity));
  }
  async findRecent(userId: number, limit: number = 10): Promise<Transaction[]> {
    const entities = await this.transactionRepository.findRecent(userId, limit);
    return entities.map((entity) => this.mapEntityToTransaction(entity));
  }
  async findUpcomingBills(
    userId: number,
    daysAhead: number = 7,
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.findUpcomingBills(
      userId,
      daysAhead,
    );
    return entities.map((entity) => this.mapEntityToTransaction(entity));
  }
  async findByInstallmentGroup(
    installmentGroupId: string,
  ): Promise<Transaction[]> {
    const entities =
      await this.transactionRepository.findByInstallmentGroup(
        installmentGroupId,
      );
    return entities.map((entity) => this.mapEntityToTransaction(entity));
  }
  async getMonthSummary(
    userId: number,
    year: number,
    month: number,
  ): Promise<MonthSummary> {
    const { totalIncome, totalExpenses } =
      await this.transactionRepository.getMonthSummary(userId, year, month);
    const expensesByCategoryRaw =
      await this.transactionRepository.getExpensesByCategory(
        userId,
        year,
        month,
      );
    const expensesByCategory: CategoryExpense[] = expensesByCategoryRaw.map(
      (item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: Number(item.total),
        percentage:
          totalExpenses > 0 ? (Number(item.total) / totalExpenses) * 100 : 0,
      }),
    );
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      expensesByCategory,
    };
  }
  async countByCategory(categoryId: number): Promise<number> {
    return await this.transactionRepository.countByCategory(categoryId);
  }
  async countByAccount(accountId: number): Promise<number> {
    return await this.transactionRepository.countByAccount(accountId);
  }
  async updateCategoryForTransactions(
    oldCategoryId: number,
    newCategoryId: number,
  ): Promise<void> {
    await this.transactionRepository.updateCategoryForTransactions(
      oldCategoryId,
      newCategoryId,
    );
    logger.info(
      `Transações migradas da categoria ${oldCategoryId} para ${newCategoryId}`,
    );
  }
}
