import { getDataSource } from '@main/infrastructure/database/data-source';
import type {
  Investment,
  InvestmentInput,
  InvestmentYield,
} from '@shared/interfaces/types/investment.types';
export class InvestmentRepository {
  async list(userId: number): Promise<Investment[]> {
    return getDataSource().query(
      'SELECT id,user_id AS userId,name,kind,principal_cents AS principalCents,start_month AS startMonth,monthly_rate AS monthlyRate FROM investments WHERE user_id=? ORDER BY id DESC',
      [userId],
    );
  }
  async yields(userId: number): Promise<InvestmentYield[]> {
    return getDataSource().query(
      'SELECT y.id,y.investment_id AS investmentId,y.month,y.amount_cents AS amountCents FROM investment_yields y JOIN investments i ON i.id=y.investment_id WHERE i.user_id=? ORDER BY y.month DESC',
      [userId],
    );
  }
  async create(userId: number, input: InvestmentInput): Promise<void> {
    await getDataSource().query(
      'INSERT INTO investments(user_id,name,kind,principal_cents,start_month,monthly_rate) VALUES(?,?,?,?,?,?)',
      [
        userId,
        input.name.trim(),
        input.kind.trim(),
        input.principalCents,
        input.startMonth,
        input.monthlyRate,
      ],
    );
  }
  async record(id: number, month: string, amount: number): Promise<void> {
    await getDataSource().query(
      'INSERT INTO investment_yields(investment_id,month,amount_cents) VALUES(?,?,?) ON CONFLICT(investment_id,month) DO UPDATE SET amount_cents=excluded.amount_cents',
      [id, month, amount],
    );
  }
  async remove(userId: number, id: number): Promise<void> {
    await getDataSource().transaction(async (manager) => {
      await manager.query(
        'DELETE FROM investment_yields WHERE investment_id IN (SELECT id FROM investments WHERE user_id=? AND id=?)',
        [userId, id],
      );
      await manager.query('DELETE FROM investments WHERE user_id=? AND id=?', [
        userId,
        id,
      ]);
    });
  }
}
