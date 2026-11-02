import { BaseRepository } from './base-repository';
import {
  TransactionEntity,
  TransactionType,
} from '../entities/transaction.entity';
import { EntityManager } from 'typeorm';
export type SortDirection = 'ASC' | 'DESC';
export type TransactionSortField =
  | 'transactionDate'
  | 'amount'
  | 'description'
  | 'type'
  | 'createdAt';
export interface SortConfig {
  field: TransactionSortField;
  direction: SortDirection;
}
export interface TransactionFilters {
  status?: 'pending' | 'settled' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  categoryId?: number;
  accountId?: number;
  type?: TransactionType;
  creditCardInvoiceId?: number;
  page?: number;
  size?: number;
  sort?: SortConfig;
}
export interface PaginatedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export class TransactionRepository extends BaseRepository<TransactionEntity> {
  constructor(manager?: EntityManager) {
    super(TransactionEntity, manager);
  }
  async findById(
    id: number,
    userId: number,
  ): Promise<TransactionEntity | null> {
    return await this.findOne({
      where: { id, account: { userId } },
      relations: ['account', 'category'],
    });
  }
  async findAllByUserId(userId: number): Promise<TransactionEntity[]> {
    return await this.find({
      where: { account: { userId } },
      relations: ['account', 'category'],
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
    });
  }
  async findWithFilters(
    userId: number,
    filters: TransactionFilters,
  ): Promise<PaginatedResult<TransactionEntity>> {
    try {
      let effectiveStartDate = filters.startDate;
      let effectiveEndDate = filters.endDate;
      if (filters.startMonth && filters.startYear) {
        effectiveStartDate = new Date(
          filters.startYear,
          filters.startMonth - 1,
          1,
        );
      }
      if (filters.endMonth && filters.endYear) {
        // Last day of the month
        effectiveEndDate = new Date(filters.endYear, filters.endMonth, 0);
      }

      const where: Record<string, unknown> = {
        account: { userId },
      };
      if (filters.status) where.status = filters.status;
      if (filters.type) {
        where.type = filters.type;
      }
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }
      if (filters.accountId) {
        where.accountId = filters.accountId;
      }
      if (filters.creditCardInvoiceId) {
        where.creditCardInvoiceId = filters.creditCardInvoiceId;
      }
      const order: Record<string, string> = {};
      if (filters.sort) {
        const fieldMap: Record<TransactionSortField, string> = {
          transactionDate: 'transactionDate',
          amount: 'amount',
          description: 'description',
          type: 'type',
          createdAt: 'createdAt',
        };
        const sortField = fieldMap[filters.sort.field] || 'transactionDate';
        order[sortField] = filters.sort.direction;
        if (filters.sort.field !== 'createdAt') {
          order.createdAt = 'DESC';
        }
      } else {
        order.transactionDate = 'DESC';
        order.createdAt = 'DESC';
      }
      const page = filters.page ?? 0;
      const size = filters.size ?? 10;
      if (effectiveStartDate || effectiveEndDate) {
        return await this.findWithFiltersUsingQueryBuilder(userId, {
          ...filters,
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
        });
      }
      const totalElements = await this.count(where);
      const content = await this.repository.find({
        where,
        relations: ['account', 'category'],
        order,
        skip: page * size,
        take: size,
      });
      return {
        content,
        page,
        size,
        totalElements,
        totalPages: Math.ceil(totalElements / size),
      };
    } catch (error) {
      const err = error as Error;
      console.error('Erro em findWithFilters:', err.message);
      console.error('Stack:', err.stack);
      throw error;
    }
  }
  private async findWithFiltersUsingQueryBuilder(
    userId: number,
    filters: TransactionFilters,
  ): Promise<PaginatedResult<TransactionEntity>> {
    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('account.user_id = :userId', { userId });

    // Helper function to format date as YYYY-MM-DD using local timezone
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (filters.startDate) {
      const startDateStr = formatDateLocal(filters.startDate);
      queryBuilder.andWhere(
        'date(transaction.transaction_date) >= date(:startDate)',
        {
          startDate: startDateStr,
        },
      );
    }
    if (filters.endDate) {
      const endDateStr = formatDateLocal(filters.endDate);
      queryBuilder.andWhere(
        'date(transaction.transaction_date) <= date(:endDate)',
        {
          endDate: endDateStr,
        },
      );
    }
    if (filters.categoryId) {
      queryBuilder.andWhere('transaction.category_id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }
    if (filters.accountId) {
      queryBuilder.andWhere('transaction.account_id = :accountId', {
        accountId: filters.accountId,
      });
    }
    if (filters.status)
      queryBuilder.andWhere('transaction.status = :status', {
        status: filters.status,
      });
    if (filters.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
    }
    if (filters.creditCardInvoiceId) {
      queryBuilder.andWhere(
        'transaction.credit_card_invoice_id = :creditCardInvoiceId',
        {
          creditCardInvoiceId: filters.creditCardInvoiceId,
        },
      );
    }

    // Apply sorting in the query (before pagination)
    if (filters.sort) {
      const fieldMap: Record<TransactionSortField, string> = {
        transactionDate: 'transactionDate',
        amount: 'amount',
        description: 'description',
        type: 'type',
        createdAt: 'createdAt',
      };
      const sortField = fieldMap[filters.sort.field] || 'transactionDate';
      queryBuilder.orderBy(`transaction.${sortField}`, filters.sort.direction);
      if (filters.sort.field !== 'createdAt') {
        queryBuilder.addOrderBy('transaction.createdAt', 'DESC');
      }
    } else {
      queryBuilder.orderBy('transaction.transactionDate', 'DESC');
      queryBuilder.addOrderBy('transaction.createdAt', 'DESC');
    }

    const totalElements = await queryBuilder.getCount();
    const page = filters.page ?? 0;
    const size = filters.size ?? 10;
    queryBuilder.skip(page * size).take(size);
    const content = await queryBuilder.getMany();

    return {
      content,
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
    };
  }
  async findWithFiltersNoPagination(
    userId: number,
    filters: Omit<TransactionFilters, 'page' | 'size'>,
  ): Promise<TransactionEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('account.user_id = :userId', { userId });

    // Helper function to format date as YYYY-MM-DD using local timezone
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (filters.startDate) {
      const startDateStr = formatDateLocal(filters.startDate);
      queryBuilder.andWhere(
        'date(transaction.transaction_date) >= date(:startDate)',
        {
          startDate: startDateStr,
        },
      );
    }
    if (filters.endDate) {
      const endDateStr = formatDateLocal(filters.endDate);
      queryBuilder.andWhere(
        'date(transaction.transaction_date) <= date(:endDate)',
        {
          endDate: endDateStr,
        },
      );
    }
    if (filters.categoryId) {
      queryBuilder.andWhere('transaction.category_id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }
    if (filters.accountId) {
      queryBuilder.andWhere('transaction.account_id = :accountId', {
        accountId: filters.accountId,
      });
    }
    if (filters.status)
      queryBuilder.andWhere('transaction.status = :status', {
        status: filters.status,
      });
    if (filters.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
    }
    if (filters.creditCardInvoiceId) {
      queryBuilder.andWhere(
        'transaction.credit_card_invoice_id = :creditCardInvoiceId',
        {
          creditCardInvoiceId: filters.creditCardInvoiceId,
        },
      );
    }
    queryBuilder.orderBy('transaction.transactionDate', 'DESC');
    queryBuilder.addOrderBy('transaction.createdAt', 'DESC');
    return await queryBuilder.getMany();
  }
  async findByPeriod(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]> {
    return await this.findWithFiltersNoPagination(userId, {
      startDate,
      endDate,
    });
  }
  async findByCategory(
    userId: number,
    categoryId: number,
  ): Promise<TransactionEntity[]> {
    return await this.findWithFiltersNoPagination(userId, { categoryId });
  }
  async findByAccount(
    userId: number,
    accountId: number,
  ): Promise<TransactionEntity[]> {
    return await this.findWithFiltersNoPagination(userId, { accountId });
  }
  async findByType(
    userId: number,
    type: TransactionType,
  ): Promise<TransactionEntity[]> {
    return await this.findWithFiltersNoPagination(userId, { type });
  }
  async findByInvoice(
    creditCardInvoiceId: number,
  ): Promise<TransactionEntity[]> {
    return await this.find({
      where: { creditCardInvoiceId },
      relations: ['account', 'category'],
      order: { transactionDate: 'DESC' },
    });
  }
  async findByInstallmentGroup(
    installmentGroupId: string,
    userId?: number,
  ): Promise<TransactionEntity[]> {
    return await this.find({
      where: { installmentGroupId, ...(userId ? { account: { userId } } : {}) },
      relations: ['account', 'category'],
      order: { installmentNumber: 'ASC' },
    });
  }
  async findUpcomingBills(
    userId: number,
    daysAhead: number = 7,
  ): Promise<TransactionEntity[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    // Helper function to format date as YYYY-MM-DD using local timezone
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatDateLocal(today);
    const futureDateStr = formatDateLocal(futureDate);
    return await this.repository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('account.user_id = :userId', { userId })
      .andWhere("transaction.status='pending' AND transaction.origin='entry'")
      .andWhere('transaction.type = :type', { type: 'expense' })
      .andWhere('date(transaction.due_date) >= date(:today)', {
        today: todayStr,
      })
      .andWhere('date(transaction.due_date) <= date(:futureDate)', {
        futureDate: futureDateStr,
      })
      .orderBy('transaction.due_date', 'ASC')
      .getMany();
  }
  async findRecent(
    userId: number,
    limit: number = 10,
  ): Promise<TransactionEntity[]> {
    return await this.repository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('account.user_id = :userId', { userId })
      .orderBy({
        'transaction.transactionDate': 'DESC',
        'transaction.createdAt': 'DESC',
      })
      .take(limit)
      .getMany();
  }
  async createTransaction(
    transactionData: Partial<TransactionEntity>,
  ): Promise<TransactionEntity> {
    return await this.save(transactionData);
  }
  async updateTransaction(
    id: number,
    userId: number,
    transactionData: Partial<TransactionEntity>,
  ): Promise<TransactionEntity | null> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      return null;
    }
    await this.update({ id }, transactionData);
    return await this.findById(id, userId);
  }
  async deleteTransaction(id: number, userId: number): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      return false;
    }
    await this.delete({ id });
    return true;
  }
  async deleteInstallmentGroup(
    installmentGroupId: string,
    userId: number,
  ): Promise<void> {
    const transactions = await this.findByInstallmentGroup(installmentGroupId);
    for (const transaction of transactions) {
      const belongs = await this.findById(transaction.id, userId);
      if (!belongs) {
        throw new Error('Unauthorized: Transaction does not belong to user');
      }
    }
    await this.delete({ installmentGroupId });
  }
  async getCashSummary(
    userId: number,
    year: number,
    month: number,
  ): Promise<{
    received: number;
    paid: number;
    pendingIncome: number;
    pendingExpenses: number;
  }> {
    const period = year + '-' + String(month).padStart(2, '0');
    const rows = await this.repository.manager.query(
      "SELECT COALESCE(SUM(CASE WHEN t.status='settled' AND a.type<>'credit_card' AND t.type='income' AND substr(t.settlement_date,1,7)=? THEN t.amount ELSE 0 END),0) AS received, COALESCE(SUM(CASE WHEN t.status='settled' AND a.type<>'credit_card' AND t.type='expense' AND substr(t.settlement_date,1,7)=? THEN t.amount ELSE 0 END),0) AS paid, COALESCE(SUM(CASE WHEN t.status='pending' AND t.type='income' AND substr(t.transaction_date,1,7)=? THEN t.amount ELSE 0 END),0) AS pendingIncome, COALESCE(SUM(CASE WHEN t.status='pending' AND t.type='expense' AND substr(t.transaction_date,1,7)=? THEN t.amount ELSE 0 END),0) AS pendingExpenses FROM transactions t JOIN accounts a ON a.id=t.account_id WHERE a.user_id=? AND t.origin='entry'",
      [period, period, period, period, userId],
    );
    const row = rows[0];
    const [invoices] = await this.repository.manager.query(
      "SELECT COALESCE(SUM(i.total_amount),0) AS cents FROM credit_card_invoices i JOIN accounts a ON a.id=i.payment_account_id WHERE a.user_id=? AND i.status='paid' AND substr(i.payment_date,1,7)=?",
      [userId, period],
    );
    return {
      received: Number(row.received) / 100,
      paid: (Number(row.paid) + Number(invoices.cents)) / 100,
      pendingIncome: Number(row.pendingIncome) / 100,
      pendingExpenses: Number(row.pendingExpenses) / 100,
    };
  }
  async getMonthSummary(
    userId: number,
    year: number,
    month: number,
  ): Promise<{ totalIncome: number; totalExpenses: number }> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const result = await this.repository
        .createQueryBuilder('transaction')
        .innerJoin('transaction.account', 'account')
        .select('transaction.type', 'type')
        .addSelect('(SUM(transaction.amount)/100.0)', 'total')
        .where('account.user_id = :userId', { userId })
        .andWhere(
          "transaction.origin = 'entry' AND transaction.status <> 'cancelled'",
        )
        .andWhere('date(transaction.transaction_date) >= date(:startDate)', {
          startDate,
        })
        .andWhere('date(transaction.transaction_date) <= date(:endDate)', {
          endDate,
        })
        .groupBy('transaction.type')
        .getRawMany();
      let totalIncome = 0;
      let totalExpenses = 0;
      for (const row of result) {
        if (row.type === 'income') {
          totalIncome = Number(row.total) || 0;
        } else if (row.type === 'expense') {
          totalExpenses = Number(row.total) || 0;
        }
      }
      return { totalIncome, totalExpenses };
    } catch (error) {
      const err = error as Error;
      console.error('Erro em getMonthSummary:', err.message);
      console.error('Stack:', err.stack);
      throw error;
    }
  }
  async getExpensesByCategory(
    userId: number,
    year: number,
    month: number,
  ): Promise<
    Array<{ categoryId: number; categoryName: string; total: number }>
  > {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return await this.repository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.account', 'account')
      .innerJoin('transaction.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('(SUM(transaction.amount)/100.0)', 'total')
      .where('account.user_id = :userId', { userId })
      .andWhere(
        "transaction.origin = 'entry' AND transaction.status <> 'cancelled'",
      )
      .andWhere('transaction.type = :type', { type: 'expense' })
      .andWhere('date(transaction.transaction_date) >= date(:startDate)', {
        startDate,
      })
      .andWhere('date(transaction.transaction_date) <= date(:endDate)', {
        endDate,
      })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('total', 'DESC')
      .getRawMany();
  }
  async countByCategory(categoryId: number): Promise<number> {
    return await this.count({ categoryId });
  }
  async countByAccount(accountId: number): Promise<number> {
    return await this.count({ accountId });
  }
  async updateCategoryForTransactions(
    oldCategoryId: number,
    newCategoryId: number,
  ): Promise<void> {
    await this.update(
      { categoryId: oldCategoryId },
      { categoryId: newCategoryId },
    );
  }
  async deleteMany(ids: number[], userId: number): Promise<number> {
    let deletedCount = 0;
    for (const id of ids) {
      const existing = await this.findById(id, userId);
      if (existing) {
        await this.delete({ id });
        deletedCount++;
      }
    }
    return deletedCount;
  }
  async findByIds(ids: number[], userId: number): Promise<TransactionEntity[]> {
    if (ids.length === 0) return [];
    return await this.repository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('account.user_id = :userId', { userId })
      .andWhere('transaction.id IN (:...ids)', { ids })
      .getMany();
  }
}
