import { TransferService } from '../services/transfer-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Transfer,
  CreateTransferInput,
  TransferFilters,
  TransferSummary,
} from '@shared/interfaces/types/transfer.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class TransferController extends BaseHandler {
  private _transferService: TransferService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get transferService(): TransferService {
    if (!this._transferService) {
      this._transferService = new TransferService();
    }
    return this._transferService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('transfer:create')
  async create(data: CreateTransferInput): Promise<ApiResponse<Transfer>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transferService.create(userId, data);
    })();
  }

  @IpcMethod('transfer:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.transferService.delete(userId, id);
    })();
  }

  @IpcMethod('transfer:findById')
  async findById(id: number): Promise<ApiResponse<Transfer>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const transfer = await this.transferService.findById(userId, id);
      if (!transfer) {
        throw new Error('Transferência não encontrada');
      }
      return transfer;
    })();
  }

  @IpcMethod('transfer:findAll')
  async findAll(filters?: TransferFilters): Promise<ApiResponse<Transfer[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transferService.findAll(userId, filters);
    })();
  }

  @IpcMethod('transfer:getSummary')
  async getSummary(
    startDate?: Date,
    endDate?: Date,
  ): Promise<ApiResponse<TransferSummary>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.transferService.getSummary(
        userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
    })();
  }
}
