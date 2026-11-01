import { getDataSource } from '@main/infrastructure/database/data-source';
import { NotificationService } from './notification-service';
import { AlertService } from './alert-service';
import { BudgetService } from './budget-service';
import { repositoryCache } from '../repositories/repository-cache';
import type { CreateNotificationInput } from '@shared/interfaces/types/notification.types';

/** Converte condições financeiras em avisos persistentes, sem repetição por consulta. */
export class NotificationEvaluationService {
  private static readonly running = new Map<number, Promise<void>>();
  refresh(userId: number): Promise<void> {
    const active = NotificationEvaluationService.running.get(userId);
    if (active) return active;
    const job = this.evaluate(userId).finally(() =>
      NotificationEvaluationService.running.delete(userId),
    );
    NotificationEvaluationService.running.set(userId, job);
    return job;
  }
  private readonly notifications = new NotificationService();
  private async once(
    userId: number,
    input: CreateNotificationInput,
  ): Promise<void> {
    await getDataSource().query(
      'INSERT OR IGNORE INTO notifications(user_id,type,title,message,priority,reference_type,reference_id,is_read,is_dismissed) VALUES(?,?,?,?,?,?,?,0,0)',
      [
        userId,
        input.type,
        input.title,
        input.message,
        input.priority || 'normal',
        input.referenceType,
        input.referenceId,
      ],
    );
  }
  private async evaluate(userId: number): Promise<void> {
    const now = new Date(),
      period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const settings = await this.notifications.getSettings(userId);
    const alerts = await new AlertService().checkAlerts(userId);
    for (const alert of alerts.filter((item) => item.status !== 'ok'))
      await this.once(userId, {
        type: 'custom',
        title:
          alert.status === 'critical'
            ? 'Limite de gastos ultrapassado'
            : 'Gastos próximos do limite',
        message: `${alert.categoryName}: ${alert.percentage.toFixed(0)}% do limite configurado.`,
        priority: alert.status === 'critical' ? 'high' : 'normal',
        referenceId: alert.alertId,
        referenceType: `auto:alert:${period}:${alert.status}`,
      });
    if (settings.billDueEnabled) {
      const bills =
        await repositoryCache.transactionRepository.findUpcomingBills(
          userId,
          settings.billDueDaysBefore,
        );
      for (const bill of bills)
        await this.once(userId, {
          type: 'bill_due',
          title: 'Vencimento cadastrado',
          message: `${bill.description}: confira o vencimento e a quitação nos seus registros.`,
          priority: 'high',
          referenceId: bill.id,
          referenceType: `auto:bill:${String(bill.dueDate).slice(0, 10)}`,
        });
    }
    if (settings.lowBalanceEnabled) {
      const accounts =
        await repositoryCache.accountRepository.findAllByUserId(userId);
      for (const account of accounts.filter(
        (item) =>
          item.type !== 'credit_card' &&
          Number(item.balance) < settings.lowBalanceThreshold,
      ))
        await this.once(userId, {
          type: 'low_balance',
          title: 'Saldo abaixo do limite',
          message: `Confira o saldo da conta ${account.name}.`,
          referenceId: account.id,
          referenceType: `auto:balance:${period}:${now.getDate()}`,
        });
    }
    if (settings.budgetExceededEnabled) {
      const budgets = await new BudgetService().findAll(userId, {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
      for (const budget of budgets.filter(
        (item) => (item.percentUsed || 0) >= settings.budgetThresholdPercent,
      ))
        await this.once(userId, {
          type: 'budget_exceeded',
          title:
            (budget.percentUsed || 0) >= 100
              ? 'Orçamento excedido'
              : 'Orçamento próximo do limite',
          message: `${budget.categoryName}: ${(budget.percentUsed || 0).toFixed(0)}% do orçamento do mês.`,
          referenceId: budget.id,
          referenceType: `auto:budget:${period}:${(budget.percentUsed || 0) >= 100 ? 'exceeded' : 'warning'}`,
        });
    }
    if (settings.goalReachedEnabled) {
      const goals = (await getDataSource().query(
        'SELECT id,name FROM goals WHERE user_id=? AND target_amount>0 AND current_amount>=target_amount',
        [userId],
      )) as { id: number; name: string }[];
      for (const goal of goals)
        await this.once(userId, {
          type: 'goal_reached',
          title: 'Meta alcançada',
          message: `Você alcançou a meta ${goal.name}.`,
          referenceId: goal.id,
          referenceType: 'auto:goal',
        });
    }
    if (settings.invoiceClosingEnabled) {
      const cards = (await getDataSource().query(
        "SELECT id,name,closing_day AS closingDay FROM accounts WHERE user_id=? AND type='credit_card' AND closing_day IS NOT NULL",
        [userId],
      )) as { id: number; name: string; closingDay: number }[];
      for (const card of cards) {
        let close = new Date(
          now.getFullYear(),
          now.getMonth(),
          Math.min(
            card.closingDay,
            new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
          ),
        );
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        if (close < today)
          close = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            Math.min(
              card.closingDay,
              new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate(),
            ),
          );
        const days = Math.round((close.getTime() - today.getTime()) / 86400000);
        if (days <= settings.invoiceClosingDaysBefore)
          await this.once(userId, {
            type: 'invoice_closing',
            title: 'Fechamento de fatura próximo',
            message: card.name + ': confira suas compras antes do fechamento.',
            referenceId: card.id,
            referenceType:
              'auto:invoice:' + close.getFullYear() + '-' + close.getMonth(),
          });
      }
    }
    if (settings.investmentYieldEnabled) {
      const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month =
        previous.getFullYear() +
        '-' +
        String(previous.getMonth() + 1).padStart(2, '0');
      const missing = (await getDataSource().query(
        'SELECT i.id,i.name FROM investments i LEFT JOIN investment_yields y ON y.investment_id=i.id AND y.month=? WHERE i.user_id=? AND i.start_month<=? AND y.id IS NULL',
        [month, userId, month],
      )) as { id: number; name: string }[];
      for (const item of missing)
        await this.once(userId, {
          type: 'custom',
          title: 'Rendimento mensal pendente',
          message: item.name + ': informe o rendimento de ' + month + '.',
          referenceId: item.id,
          referenceType: 'auto:yield:' + month,
        });
    }
    await this.notifications.processScheduledNotifications(userId);
  }
}
