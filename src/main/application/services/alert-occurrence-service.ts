import { getDataSource } from '@main/infrastructure/database/data-source';
import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import type { AlertWithStatus } from '@shared/interfaces/types/alert.types';
export interface AlertOccurrence {
  id: number;
  categoryName: string;
  severity: string;
  percentage: number;
  state: string;
  period: string;
}
export class AlertOccurrenceService {
  async evaluate(userId: number, period: string, alerts: AlertWithStatus[]) {
    return financialTransaction(async (m) => {
      const ids: number[] = [];
      for (const alert of alerts.filter((a) => a.status !== 'ok')) {
        await m.query(
          "INSERT INTO alert_occurrences(user_id,rule_id,period,severity,category_name,percentage) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,rule_id,period,severity) DO UPDATE SET percentage=excluded.percentage,category_name=excluded.category_name,state=CASE WHEN condition_active=0 THEN 'active' ELSE state END,condition_active=1,updated_at=CURRENT_TIMESTAMP",
          [
            userId,
            alert.alertId,
            period,
            alert.status,
            alert.categoryName,
            alert.percentage,
          ],
        );
        const [{ id }] = await m.query(
          'SELECT id FROM alert_occurrences WHERE user_id=? AND rule_id=? AND period=? AND severity=?',
          [userId, alert.alertId, period, alert.status],
        );
        ids.push(id);
      }
      await m.query(
        `UPDATE alert_occurrences SET condition_active=0,state=CASE WHEN state='active' THEN 'resolved' ELSE state END,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND condition_active=1 ${ids.length ? `AND id NOT IN (${ids.map(() => '?').join(',')})` : ''}`,
        [userId, ...ids],
      );
      // Resolving the condition archives its delivery; reading delivery never changes the condition.
      await m.query(
        "UPDATE notifications SET is_dismissed=1 WHERE user_id=? AND reference_type LIKE 'auto:alert:%' AND EXISTS(SELECT 1 FROM alert_occurrences o WHERE o.user_id=notifications.user_id AND o.rule_id=notifications.reference_id AND ('auto:alert:'||o.period||':'||o.severity)=notifications.reference_type AND o.condition_active=0)",
        [userId],
      );
    });
  }
  async list(
    userId: number,
    state = 'active',
    page = 0,
  ): Promise<AlertOccurrence[]> {
    if (
      !['active', 'resolved', 'dismissed'].includes(state) ||
      !Number.isInteger(page) ||
      page < 0
    )
      throw new Error('Filtro inválido');
    return getDataSource().query(
      'SELECT id,category_name categoryName,severity,percentage,state,period FROM alert_occurrences WHERE user_id=? AND state=? ORDER BY id DESC LIMIT 24 OFFSET ?',
      [userId, state, page * 24],
    );
  }
  async dismiss(userId: number, id: number) {
    return financialTransaction(async (m) => {
      await m.query(
        "UPDATE alert_occurrences SET state='dismissed',updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND id=?",
        [userId, id],
      );
      await m.query(
        "UPDATE notifications SET is_dismissed=1 WHERE user_id=? AND EXISTS(SELECT 1 FROM alert_occurrences o WHERE o.id=? AND o.user_id=notifications.user_id AND o.rule_id=notifications.reference_id AND ('auto:alert:'||o.period||':'||o.severity)=notifications.reference_type)",
        [userId, id],
      );
    });
  }
}
