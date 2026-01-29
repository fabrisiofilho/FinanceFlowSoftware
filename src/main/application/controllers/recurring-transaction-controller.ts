import { RecurringTransactionService } from '../services/recurring-transaction-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  RecurringTransaction,
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
  RecurringTransactionFilters,
  RecurringGenerationResult,
} from '@shared/interfaces/types/recurring.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class RecurringTransactionController extends BaseHandler {
  private _recurringService: RecurringTransactionService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get recurringService(): RecurringTransactionService {
    if (!this._recurringService) {
      this._recurringService = new RecurringTransactionService();
    }
    return this._recurringService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('recurring:create')
  async create(
    data: CreateRecurringTransactionInput,
  ): Promise<ApiResponse<RecurringTransaction>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.recurringService.create(userId, data);
    })();
  }

  @IpcMethod('recurring:update')
  async update(
    id: number,
    data: UpdateRecurringTransactionInput,
  ): Promise<ApiResponse<RecurringTransaction>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.recurringService.update(userId, id, data);
    })();
  }

  @IpcMethod('recurring:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.recurringService.delete(userId, id);
    })();
  }

  @IpcMethod('recurring:findById')
  async findById(id: number): Promise<ApiResponse<RecurringTransaction>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const recurring = await this.recurringService.findById(userId, id);
      if (!recurring) {
        throw new Error('Transação recorrente não encontrada');
      }
      return recurring;
    })();
  }

  @IpcMethod('recurring:findAll')
  async findAll(
    filters?: RecurringTransactionFilters,
  ): Promise<ApiResponse<RecurringTransaction[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.recurringService.findAll(userId, filters);
    })();
  }

  @IpcMethod('recurring:generate')
  async generatePendingTransactions(): Promise<
    ApiResponse<RecurringGenerationResult>
  > {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.recurringService.generatePendingTransactions(userId);
    })();
  }
}
