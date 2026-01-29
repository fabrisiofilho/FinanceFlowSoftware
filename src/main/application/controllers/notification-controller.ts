import { NotificationService } from '../services/notification-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Notification,
  NotificationSettings,
  UpdateNotificationSettingsInput,
  NotificationFilters,
  NotificationSummary,
} from '@shared/interfaces/types/notification.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class NotificationController extends BaseHandler {
  private _notificationService: NotificationService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get notificationService(): NotificationService {
    if (!this._notificationService) {
      this._notificationService = new NotificationService();
    }
    return this._notificationService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('notification:findAll')
  async findAll(
    filters?: NotificationFilters,
  ): Promise<ApiResponse<Notification[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.notificationService.findAll(userId, filters);
    })();
  }

  @IpcMethod('notification:getSummary')
  async getSummary(): Promise<ApiResponse<NotificationSummary>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.notificationService.getSummary(userId);
    })();
  }

  @IpcMethod('notification:markAsRead')
  async markAsRead(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.notificationService.markAsRead(userId, id);
    })();
  }

  @IpcMethod('notification:markAllAsRead')
  async markAllAsRead(): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.notificationService.markAllAsRead(userId);
    })();
  }

  @IpcMethod('notification:dismiss')
  async dismiss(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.notificationService.dismiss(userId, id);
    })();
  }

  @IpcMethod('notification:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.notificationService.delete(userId, id);
    })();
  }

  @IpcMethod('notification:getSettings')
  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.notificationService.getSettings(userId);
    })();
  }

  @IpcMethod('notification:updateSettings')
  async updateSettings(
    data: UpdateNotificationSettingsInput,
  ): Promise<ApiResponse<NotificationSettings>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.notificationService.updateSettings(userId, data);
    })();
  }

  @IpcMethod('notification:processScheduled')
  async processScheduled(): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.notificationService.processScheduledNotifications(userId);
    })();
  }
}
