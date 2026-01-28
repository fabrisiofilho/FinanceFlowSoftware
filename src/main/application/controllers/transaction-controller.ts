import { ITransactionController } from '@shared/interfaces/controllers/transaction.controller.interface';
import { TransactionService } from '../services/transaction-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  MonthSummary,
} from '@shared/interfaces/types/transaction.types';
import type {
  ApiResponse,
  PageResult,
} from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class TransactionController
  extends BaseHandler
  implements ITransactionController
{
  private _transactionService: TransactionService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();
  private get transactionService(): TransactionService {
    if (!this._transactionService) {
      this._transactionService = new TransactionService();
    }
    return this._transactionService;
  }
  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }
  @IpcMethod('transaction:create')
  async create(
    data: CreateTransactionInput,
  ): Promise<ApiResponse<Transaction>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transactionService.create(userId, data);
    })();
  }
  @IpcMethod('transaction:update')
  async update(
    id: number,
    data: UpdateTransactionInput,
  ): Promise<ApiResponse<Transaction>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transactionService.update(userId, id, data);
    })();
  }
  @IpcMethod('transaction:delete')
  async delete(
    id: number,
    deleteAllInstallments?: boolean,
  ): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.transactionService.delete(userId, id, deleteAllInstallments);
    })();
  }
  @IpcMethod('transaction:deleteMany')
  async deleteMany(ids: number[]): Promise<ApiResponse<number>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transactionService.deleteMany(userId, ids);
    })();
  }
  @IpcMethod('transaction:findById')
  async findById(id: number): Promise<ApiResponse<Transaction>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const transaction = await this.transactionService.findById(userId, id);
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }
      return transaction;
    })();
  }
  @IpcMethod('transaction:findAll')
  async findAll(
    filters?: TransactionFilters,
  ): Promise<ApiResponse<PageResult<Transaction>>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const result = await this.transactionService.findAll(userId, filters);
      return {
        content: result.content,
        page: result.page,
        size: result.size,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
      };
    })();
  }
  @IpcMethod('transaction:findByPeriod')
  async findByPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<ApiResponse<Transaction[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transactionService.findByPeriod(
        userId,
        new Date(startDate),
        new Date(endDate),
      );
    })();
  }
  @IpcMethod('transaction:findByCategory')
  async findByCategory(
    categoryId: number,
  ): Promise<ApiResponse<Transaction[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transactionService.findByCategory(userId, categoryId);
    })();
  }
  @IpcMethod('transaction:getMonthSummary')
  async getMonthSummary(
    year: number,
    month: number,
  ): Promise<ApiResponse<MonthSummary>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transactionService.getMonthSummary(userId, year, month);
    })();
  }
}
