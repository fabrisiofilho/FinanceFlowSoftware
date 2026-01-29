import { BudgetService } from '../services/budget-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetFilters,
  BudgetSummary,
  BudgetAlert,
} from '@shared/interfaces/types/budget.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class BudgetController extends BaseHandler {
  private _budgetService: BudgetService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get budgetService(): BudgetService {
    if (!this._budgetService) {
      this._budgetService = new BudgetService();
    }
    return this._budgetService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('budget:create')
  async create(data: CreateBudgetInput): Promise<ApiResponse<Budget>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.budgetService.create(userId, data);
    })();
  }

  @IpcMethod('budget:update')
  async update(
    id: number,
    data: UpdateBudgetInput,
  ): Promise<ApiResponse<Budget>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.budgetService.update(userId, id, data);
    })();
  }

  @IpcMethod('budget:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.budgetService.delete(userId, id);
    })();
  }

  @IpcMethod('budget:findById')
  async findById(id: number): Promise<ApiResponse<Budget>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const budget = await this.budgetService.findById(userId, id);
      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }
      return budget;
    })();
  }

  @IpcMethod('budget:findAll')
  async findAll(filters?: BudgetFilters): Promise<ApiResponse<Budget[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.budgetService.findAll(userId, filters);
    })();
  }

  @IpcMethod('budget:getSummary')
  async getSummary(
    year: number,
    month: number,
  ): Promise<ApiResponse<BudgetSummary>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.budgetService.getSummary(userId, year, month);
    })();
  }

  @IpcMethod('budget:getAlerts')
  async getAlerts(
    year: number,
    month: number,
  ): Promise<ApiResponse<BudgetAlert[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.budgetService.getAlerts(userId, year, month);
    })();
  }

  @IpcMethod('budget:copyFromPreviousMonth')
  async copyFromPreviousMonth(
    year: number,
    month: number,
  ): Promise<ApiResponse<Budget[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.budgetService.copyFromPreviousMonth(
        userId,
        year,
        month,
      );
    })();
  }
}
