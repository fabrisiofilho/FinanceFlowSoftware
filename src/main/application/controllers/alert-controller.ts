import { IAlertController } from '@shared/interfaces/controllers/alert.controller.interface';
import { AlertService } from '../services/alert-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Alert,
  AlertWithStatus,
  CreateAlertInput,
  UpdateAlertInput,
} from '@shared/interfaces/types/alert.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class AlertController extends BaseHandler implements IAlertController {
  private _alertService: AlertService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();
  private get alertService(): AlertService {
    if (!this._alertService) {
      this._alertService = new AlertService();
    }
    return this._alertService;
  }
  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }
  @IpcMethod('alert:create')
  async create(data: CreateAlertInput): Promise<ApiResponse<Alert>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.alertService.create(userId, data);
    })();
  }
  @IpcMethod('alert:update')
  async update(
    id: number,
    data: UpdateAlertInput,
  ): Promise<ApiResponse<Alert>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.alertService.update(userId, id, data);
    })();
  }
  @IpcMethod('alert:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.alertService.delete(userId, id);
    })();
  }
  @IpcMethod('alert:findAll')
  async findAll(): Promise<ApiResponse<Alert[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.alertService.findAll(userId);
    })();
  }
  @IpcMethod('alert:checkAlerts')
  async checkAlerts(): Promise<ApiResponse<AlertWithStatus[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.alertService.checkAlerts(userId);
    })();
  }
}
