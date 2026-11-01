import type {
  Notification,
  NotificationFilters,
  NotificationSummary,
  NotificationSettings,
  UpdateNotificationSettingsInput,
} from '../types/notification.types';
import type { ApiResponse } from '../types/common.types';

export interface INotificationController {
  refresh(): Promise<ApiResponse<void>>;
  findAll(filters?: NotificationFilters): Promise<ApiResponse<Notification[]>>;
  getSummary(): Promise<ApiResponse<NotificationSummary>>;
  markAsRead(id: number): Promise<ApiResponse<void>>;
  markAllAsRead(): Promise<ApiResponse<void>>;
  dismiss(id: number): Promise<ApiResponse<void>>;
  delete(id: number): Promise<ApiResponse<void>>;
  getSettings(): Promise<ApiResponse<NotificationSettings>>;
  updateSettings(
    input: UpdateNotificationSettingsInput,
  ): Promise<ApiResponse<NotificationSettings>>;
  processScheduled(): Promise<ApiResponse<void>>;
}
