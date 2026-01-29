import { CashFlowService } from '../services/cash-flow-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  CashFlowSummary,
  CashFlowFilters,
  MonthlyProjection,
} from '@shared/interfaces/types/cash-flow.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class CashFlowController extends BaseHandler {
  private _cashFlowService: CashFlowService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get cashFlowService(): CashFlowService {
    if (!this._cashFlowService) {
      this._cashFlowService = new CashFlowService();
    }
    return this._cashFlowService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('cashFlow:getProjection')
  async getProjection(
    filters: CashFlowFilters,
  ): Promise<ApiResponse<CashFlowSummary>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.cashFlowService.getProjection(userId, {
        ...filters,
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    })();
  }

  @IpcMethod('cashFlow:getMonthlyProjections')
  async getMonthlyProjections(
    months?: number,
  ): Promise<ApiResponse<MonthlyProjection[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.cashFlowService.getMonthlyProjections(userId, months);
    })();
  }
}
