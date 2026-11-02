import type { EntityManager } from 'typeorm';
import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import { CreditCardService } from './credit-card-service';
import { entryState, settledAmount } from '@shared/finance/entry-state';
import {
  installmentAmounts,
  occurrenceDate,
} from '@shared/finance/entry-schedule';
import {
  validateEntryCreate,
  validateEntryUpdate,
} from '@shared/finance/commands';
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
import { parseDateSafe } from '@main/infrastructure/utils/date-utils';
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
    private readonly manager?: EntityManager,
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
  private async atomic<T>(
    action: (service: TransactionService) => Promise<T>,
  ): Promise<T> {
    return financialTransaction((manager) => {
      const accounts = new AccountRepository(manager);
      const transactions = new TransactionRepository(manager);
      return action(
        new TransactionService(
          transactions,
          accounts,
          new CategoryRepository(manager),
          new BalanceCalculatorService(accounts, transactions),
          manager,
        ),
      );
    });
  }
  private mapEntityToTransaction(entity: TransactionEntity): Transaction {
    return {
      id: entity.id,
      description: entity.description,
      amount: Number(entity.amount),
      type: entity.type as Transaction['type'],
      paymentMethod: entity.paymentMethod as Transaction['paymentMethod'],
      expenseType: entity.expenseType as Transaction['expenseType'],
      transactionDate: parseDateSafe(entity.transactionDate) ?? new Date(),
      status: entity.status,
      settlementDate: entity.settlementDate
        ? parseDateSafe(entity.settlementDate)
        : null,
      dueDate: entity.dueDate
        ? (parseDateSafe(entity.dueDate) ?? undefined)
        : undefined,
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
    validateEntryCreate(data);
  }
  private validateUpdateInput(data: UpdateTransactionInput): void {
    validateEntryUpdate(data);
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
    transactionType?: Transaction['type'],
  ): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId, userId);
    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    // Validar que o tipo da categoria é compatível com o tipo da transação
    if (transactionType && category.type !== transactionType) {
      throw new Error(
        `Categoria de ${category.type === 'income' ? 'receita' : 'despesa'} não pode ser usada em transação de ${transactionType === 'income' ? 'receita' : 'despesa'}`,
      );
    }
  }
  private addMonths(date: Date, months: number): Date {
    return occurrenceDate(date, months);
  }
  async create(
    userId: number,
    data: CreateTransactionInput,
  ): Promise<Transaction> {
    if (!this._injectedTransactionRepository)
      return this.atomic((service) => service.create(userId, data));
    logger.info('Criando nova transação para usuário:', userId);
    this.validateCreateInput(data);
    await this.validateAccount(userId, data.accountId);
    await this.validateCategory(userId, data.categoryId, data.type);
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
  private async linkCard(
    userId: number,
    entity: TransactionEntity,
  ): Promise<void> {
    const account = await this.accountRepository.findById(
      entity.accountId,
      userId,
    );
    if (
      account?.type === 'credit_card' &&
      entity.type === 'expense' &&
      entity.status !== 'cancelled'
    )
      await new CreditCardService(this.manager).autoLinkTransactionToInvoice(
        userId,
        entity.id,
        entity.accountId,
        parseDateSafe(entity.transactionDate)!,
      );
  }
  private async createSingleTransaction(
    userId: number,
    data: CreateTransactionInput,
  ): Promise<Transaction> {
    const transactionData: Partial<TransactionEntity> = {
      ...entryState(
        data.status,
        data.settlementDate,
        parseDateSafe(data.transactionDate)!,
      ),
      description: data.description.trim(),
      amount: data.amount,
      type: data.type as TransactionType,
      paymentMethod: data.paymentMethod,
      expenseType: data.expenseType,
      transactionDate: parseDateSafe(data.transactionDate) ?? new Date(),
      dueDate: data.dueDate
        ? (parseDateSafe(data.dueDate) ?? undefined)
        : undefined,
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
      settledAmount(entity),
    );
    await this.linkCard(userId, entity);
    return this.mapEntityToTransaction(entity);
  }
  private async createInstallmentTransactions(
    userId: number,
    data: CreateTransactionInput,
  ): Promise<Transaction> {
    const totalInstallments = data.totalInstallments!;
    const installmentGroupId = crypto.randomUUID();

    const amounts = installmentAmounts(data.amount, totalInstallments);
    let firstTransaction: TransactionEntity | null = null;
    for (let i = 1; i <= totalInstallments; i++) {
      const installmentDate = this.addMonths(
        parseDateSafe(data.transactionDate) ?? new Date(),
        i - 1,
      );
      const dueDate = data.dueDate
        ? this.addMonths(parseDateSafe(data.dueDate) ?? new Date(), i - 1)
        : undefined;

      const installmentAmount = amounts[i - 1];

      const transactionData: Partial<TransactionEntity> = {
        description: `${data.description.trim()} (${i}/${totalInstallments})`,
        ...entryState(
          i === 1 ? data.status : 'pending',
          data.settlementDate,
          installmentDate,
        ),
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
      await this.linkCard(userId, entity);
      if (i === 1) {
        firstTransaction = entity;
      }
      await this.balanceCalculatorService.updateBalanceAfterCreate(
        userId,
        data.accountId,
        data.type as TransactionType,
        settledAmount(entity),
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
      const transactionDate = occurrenceDate(
        parseDateSafe(data.transactionDate)!,
        i,
        data.recurrence === 'weekly' ? 'weekly' : 'monthly',
      );
      const dueDate = data.dueDate
        ? occurrenceDate(
            parseDateSafe(data.dueDate)!,
            i,
            data.recurrence === 'weekly' ? 'weekly' : 'monthly',
          )
        : undefined;
      const transactionData: Partial<TransactionEntity> = {
        description: data.description.trim(),
        ...entryState(
          i === 0 ? data.status : 'pending',
          data.settlementDate,
          transactionDate,
        ),
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
      await this.linkCard(userId, entity);
      if (i === 0) {
        firstTransaction = entity;
      }
      await this.balanceCalculatorService.updateBalanceAfterCreate(
        userId,
        data.accountId,
        data.type as TransactionType,
        settledAmount(entity),
      );
    }
    return this.mapEntityToTransaction(firstTransaction!);
  }
  async update(
    userId: number,
    id: number,
    data: UpdateTransactionInput,
  ): Promise<Transaction> {
    if (!this._injectedTransactionRepository)
      return this.atomic((service) => service.update(userId, id, data));
    logger.info('Atualizando transação:', id);
    const existingEntity = await this.transactionRepository.findById(
      id,
      userId,
    );
    if (!existingEntity) {
      throw new Error('Transação não encontrada');
    }
    this.validateUpdateInput(data);
    const newType = data.type ?? existingEntity.type;
    const newAccount = data.accountId ?? existingEntity.accountId;
    if (!['income', 'expense'].includes(newType))
      throw new Error('Tipo inválido.');
    await this.validateAccount(userId, newAccount);
    await this.validateCategory(
      userId,
      data.categoryId ?? existingEntity.categoryId,
      newType,
    );
    if (existingEntity.creditCardInvoiceId) {
      const invoice =
        await repositoryCache.creditCardInvoiceRepository.findById(
          existingEntity.creditCardInvoiceId,
          userId,
        );
      if (!invoice || invoice.status !== 'open')
        throw new Error('A fatura vinculada já está fechada ou paga.');
      if (
        newAccount !== existingEntity.accountId ||
        newType !== existingEntity.type ||
        (data.transactionDate &&
          parseDateSafe(data.transactionDate)?.getTime() !==
            parseDateSafe(existingEntity.transactionDate)?.getTime())
      )
        throw new Error(
          'Para mudar conta, tipo ou competência de compra vinculada, exclua e cadastre novamente enquanto a fatura estiver aberta.',
        );
    }
    const oldType = existingEntity.type as TransactionType;
    if (existingEntity.origin === 'transfer')
      throw new Error('Edite a transferência na área Transferências.');
    const updateData: Partial<TransactionEntity> = entryState(
      data.status ?? existingEntity.status,
      data.settlementDate === undefined
        ? existingEntity.settlementDate
        : data.settlementDate,
      parseDateSafe(existingEntity.transactionDate)!,
    );
    updateData.type = newType;
    updateData.accountId = newAccount;
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
      updateData.transactionDate =
        parseDateSafe(data.transactionDate) ?? new Date();
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = parseDateSafe(data.dueDate) ?? undefined;
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
    if (existingEntity.accountId !== newAccount) {
      await this.balanceCalculatorService.updateBalanceAfterDelete(
        userId,
        existingEntity.accountId,
        oldType,
        settledAmount(existingEntity),
      );
      await this.balanceCalculatorService.updateBalanceAfterCreate(
        userId,
        newAccount,
        newType,
        settledAmount(updatedEntity),
      );
    } else if (
      settledAmount(updatedEntity) !== settledAmount(existingEntity) ||
      oldType !== newType
    ) {
      await this.balanceCalculatorService.updateBalanceAfterUpdate(
        userId,
        newAccount,
        oldType,
        settledAmount(existingEntity),
        newType,
        settledAmount(updatedEntity),
      );
    }
    if (existingEntity.creditCardInvoiceId)
      await repositoryCache.creditCardInvoiceRepository.recalculateTotalFromTransactions(
        existingEntity.creditCardInvoiceId,
      );
    else await this.linkCard(userId, updatedEntity);
    logger.success('Transação atualizada com sucesso:', id);
    return this.mapEntityToTransaction(updatedEntity);
  }
  async delete(
    userId: number,
    id: number,
    deleteAllInstallments: boolean = false,
  ): Promise<void> {
    if (!this._injectedTransactionRepository)
      return this.atomic((service) =>
        service.delete(userId, id, deleteAllInstallments),
      );
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
    if (existingEntity.origin === 'transfer')
      throw new Error('Exclua a transferência na área Transferências.');
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
      settledAmount(entity),
    );
    if (entity.creditCardInvoiceId) {
      const invoice =
        await repositoryCache.creditCardInvoiceRepository.findById(
          entity.creditCardInvoiceId,
          userId,
        );
      if (!invoice || invoice.status !== 'open')
        throw new Error(
          'Não é possível excluir compra de fatura fechada ou paga.',
        );
    }
    await this.transactionRepository.deleteTransaction(entity.id, userId);
    if (entity.creditCardInvoiceId)
      await repositoryCache.creditCardInvoiceRepository.recalculateTotalFromTransactions(
        entity.creditCardInvoiceId,
      );
  }
  private async deleteInstallmentGroup(
    userId: number,
    installmentGroupId: string,
  ): Promise<void> {
    const transactions =
      await this.transactionRepository.findByInstallmentGroup(
        installmentGroupId,
        userId,
      );
    if (transactions.some((transaction) => transaction.origin === 'transfer'))
      throw new Error(
        'Use a área Transferências para excluir esses movimentos.',
      );
    for (const transaction of transactions)
      await this.deleteSingleTransaction(userId, transaction);
  }
  async deleteMany(userId: number, ids: number[]): Promise<number> {
    if (!this._injectedTransactionRepository)
      return this.atomic((service) => service.deleteMany(userId, ids));
    logger.info(`Excluindo ${ids.length} transações em lote`);
    if (ids.length === 0) {
      return 0;
    }
    const transactions = await this.transactionRepository.findByIds(
      ids,
      userId,
    );
    if (transactions.some((transaction) => transaction.origin === 'transfer'))
      throw new Error(
        'Use a área Transferências para excluir esses movimentos.',
      );
    for (const transaction of transactions)
      await this.deleteSingleTransaction(userId, transaction);
    return transactions.length;
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
    const repoFilters: RepoFilters = {
      search: filters?.search,
      accountIds: filters?.accountIds,
      categoryIds: filters?.categoryIds,
      types: filters?.types,
      statuses: filters?.statuses,
    };
    if (filters) {
      if (filters.status) repoFilters.status = filters.status;
      if (filters.startDate) {
        repoFilters.startDate = parseDateSafe(filters.startDate) ?? undefined;
      }
      if (filters.endDate) {
        repoFilters.endDate = parseDateSafe(filters.endDate) ?? undefined;
      }
      // Pass month/year filters
      if (filters.startMonth) {
        repoFilters.startMonth = filters.startMonth;
      }
      if (filters.startYear) {
        repoFilters.startYear = filters.startYear;
      }
      if (filters.endMonth) {
        repoFilters.endMonth = filters.endMonth;
      }
      if (filters.endYear) {
        repoFilters.endYear = filters.endYear;
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
    if (!Number.isInteger(daysAhead) || daysAhead < 0 || daysAhead > 90)
      throw new Error('Intervalo de vencimentos inválido.');
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
    const cash = await this.transactionRepository.getCashSummary(
      userId,
      year,
      month,
    );
    return {
      ...cash,
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
