import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { Notification as ElectronNotification } from 'electron';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationSettingsEntity } from '../entities/notification-settings.entity';
import {
  Notification,
  CreateNotificationInput,
  NotificationSettings,
  UpdateNotificationSettingsInput,
  NotificationFilters,
  NotificationSummary,
  DesktopNotificationPayload,
} from '@shared/interfaces/types/notification.types';

export class NotificationService {
  private get notificationRepository() {
    return getDataSource().getRepository(NotificationEntity);
  }

  private get settingsRepository() {
    return getDataSource().getRepository(NotificationSettingsEntity);
  }

  private mapEntityToNotification(entity: NotificationEntity): Notification {
    return {
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      priority: entity.priority,
      referenceType: entity.referenceType,
      referenceId: entity.referenceId,
      isRead: Boolean(entity.isRead),
      isDismissed: Boolean(entity.isDismissed),
      scheduledAt: entity.scheduledAt
        ? new Date(entity.scheduledAt)
        : undefined,
      sentAt: entity.sentAt ? new Date(entity.sentAt) : undefined,
      createdAt: entity.createdAt ?? new Date(),
    };
  }

  private mapEntityToSettings(
    entity: NotificationSettingsEntity,
  ): NotificationSettings {
    return {
      id: entity.id,
      userId: entity.userId,
      investmentYieldEnabled: Boolean(entity.investmentYieldEnabled),
      billDueEnabled: Boolean(entity.billDueEnabled),
      billDueDaysBefore: entity.billDueDaysBefore,
      budgetExceededEnabled: Boolean(entity.budgetExceededEnabled),
      budgetThresholdPercent: entity.budgetThresholdPercent,
      goalReachedEnabled: Boolean(entity.goalReachedEnabled),
      recurringGeneratedEnabled: Boolean(entity.recurringGeneratedEnabled),
      lowBalanceEnabled: Boolean(entity.lowBalanceEnabled),
      lowBalanceThreshold: Number(entity.lowBalanceThreshold),
      invoiceClosingEnabled: Boolean(entity.invoiceClosingEnabled),
      invoiceClosingDaysBefore: entity.invoiceClosingDaysBefore,
      soundEnabled: Boolean(entity.soundEnabled),
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }

  async create(
    userId: number,
    data: CreateNotificationInput,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority ?? 'normal',
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      scheduledAt: data.scheduledAt,
    });

    const saved = await this.notificationRepository.save(notification);
    return this.mapEntityToNotification(saved);
  }

  async markAsRead(userId: number, id: number): Promise<void> {
    await this.notificationRepository.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async dismiss(userId: number, id: number): Promise<void> {
    await this.notificationRepository.update(
      { id, userId },
      { isDismissed: true },
    );
  }

  async delete(userId: number, id: number): Promise<void> {
    await this.notificationRepository.delete({ id, userId });
  }

  async findAll(
    userId: number,
    filters?: NotificationFilters,
  ): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.is_dismissed = 0')
      .andWhere(
        '(n.scheduled_at IS NULL OR n.scheduled_at <= CURRENT_TIMESTAMP)',
      );

    if (filters?.type) {
      query.andWhere('n.type = :type', { type: filters.type });
    }
    if (filters?.isRead !== undefined) {
      query.andWhere('n.is_read = :isRead', { isRead: filters.isRead ? 1 : 0 });
    }
    if (filters?.startDate) {
      query.andWhere('n.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      query.andWhere('n.created_at <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('n.created_at', 'DESC');

    if (filters?.page !== undefined && filters?.size) {
      query.skip(filters.page * filters.size).take(filters.size);
    }

    const results = await query.getMany();
    return results.map((n) => this.mapEntityToNotification(n));
  }

  async getSummary(userId: number): Promise<NotificationSummary> {
    const notifications = await this.findAll(userId);

    const unread = notifications.filter((n) => !n.isRead).length;

    const byTypeMap = new Map<string, number>();
    const byPriorityMap = new Map<string, number>();

    for (const n of notifications) {
      byTypeMap.set(n.type, (byTypeMap.get(n.type) ?? 0) + 1);
      byPriorityMap.set(n.priority, (byPriorityMap.get(n.priority) ?? 0) + 1);
    }

    return {
      total: notifications.length,
      unread,
      byType: Array.from(byTypeMap.entries()).map(([type, count]) => ({
        type: type as Notification['type'],
        count,
      })),
      byPriority: Array.from(byPriorityMap.entries()).map(
        ([priority, count]) => ({
          priority: priority as Notification['priority'],
          count,
        }),
      ),
    };
  }

  async getSettings(userId: number): Promise<NotificationSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({ userId });
      settings = await this.settingsRepository.save(settings);
    }

    return this.mapEntityToSettings(settings);
  }

  async updateSettings(
    userId: number,
    data: UpdateNotificationSettingsInput,
  ): Promise<NotificationSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({ userId });
    }

    const patch: UpdateNotificationSettingsInput = {};
    for (const key of [
      'investmentYieldEnabled',
      'billDueEnabled',
      'budgetExceededEnabled',
      'goalReachedEnabled',
      'recurringGeneratedEnabled',
      'lowBalanceEnabled',
      'invoiceClosingEnabled',
      'soundEnabled',
    ] as const) {
      if (data[key] !== undefined) {
        if (typeof data[key] !== 'boolean')
          throw new Error('Preferência inválida');
        patch[key] = data[key];
      }
    }
    for (const [key, min, max] of [
      ['billDueDaysBefore', 0, 90],
      ['invoiceClosingDaysBefore', 0, 31],
      ['budgetThresholdPercent', 1, 100],
      ['lowBalanceThreshold', 0, 100000000],
    ] as const) {
      const value = data[key];
      if (value !== undefined) {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < min ||
          value > max ||
          (key !== 'lowBalanceThreshold' && !Number.isInteger(value))
        )
          throw new Error('Limite de notificação inválido');
        patch[key] = value;
      }
    }
    Object.assign(settings, patch);
    const saved = await this.settingsRepository.save(settings);

    return this.mapEntityToSettings(saved);
  }

  async sendDesktopNotification(
    payload: DesktopNotificationPayload,
  ): Promise<void> {
    if (!ElectronNotification.isSupported()) {
      logger.warning('Desktop notifications not supported');
      return;
    }

    const notification = new ElectronNotification({
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      silent: payload.silent ?? false,
      urgency: payload.urgency ?? 'normal',
    });

    notification.show();
    logger.info('Desktop notification sent:', payload.title);
  }

  async processScheduledNotifications(userId: number): Promise<void> {
    const now = new Date();

    const settings = await this.getSettings(userId);
    const scheduled = await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.scheduled_at <= :now', { now })
      .andWhere('n.sent_at IS NULL')
      .andWhere('n.is_dismissed = 0')
      .getMany();

    for (const notification of scheduled) {
      await this.sendDesktopNotification({
        silent: !settings.soundEnabled,
        title: notification.title,
        body: notification.message,
        urgency: notification.priority === 'urgent' ? 'critical' : 'normal',
      });

      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);
    }

    if (scheduled.length > 0) {
      logger.info(`Processadas ${scheduled.length} notificações agendadas`);
    }
  }

  // Helper methods for creating specific notification types
  async notifyBillDue(
    userId: number,
    billDescription: string,
    amount: number,
    dueDate: Date,
    transactionId: number,
  ): Promise<void> {
    const settings = await this.getSettings(userId);
    if (!settings.billDueEnabled) return;

    await this.create(userId, {
      type: 'bill_due',
      title: 'Conta a vencer',
      message: `${billDescription} - R$ ${amount.toFixed(2)} vence em ${dueDate.toLocaleDateString('pt-BR')}`,
      priority: 'high',
      referenceType: 'transaction',
      referenceId: transactionId,
    });
  }

  async notifyBudgetExceeded(
    userId: number,
    categoryName: string,
    percentUsed: number,
    budgetId: number,
  ): Promise<void> {
    const settings = await this.getSettings(userId);
    if (!settings.budgetExceededEnabled) return;
    if (percentUsed < settings.budgetThresholdPercent) return;

    await this.create(userId, {
      type: 'budget_exceeded',
      title:
        percentUsed >= 100
          ? 'Orçamento excedido!'
          : 'Orçamento próximo do limite',
      message: `Categoria "${categoryName}" está em ${percentUsed.toFixed(0)}% do orçamento`,
      priority: percentUsed >= 100 ? 'urgent' : 'high',
      referenceType: 'budget',
      referenceId: budgetId,
    });
  }

  async notifyLowBalance(
    userId: number,
    accountName: string,
    balance: number,
    accountId: number,
  ): Promise<void> {
    const settings = await this.getSettings(userId);
    if (!settings.lowBalanceEnabled) return;
    if (balance >= settings.lowBalanceThreshold) return;

    await this.create(userId, {
      type: 'low_balance',
      title: 'Saldo baixo',
      message: `Conta "${accountName}" está com saldo de R$ ${balance.toFixed(2)}`,
      priority: balance < 0 ? 'urgent' : 'high',
      referenceType: 'account',
      referenceId: accountId,
    });
  }
}
