import { getDataSource } from '@main/infrastructure/database/data-source';
import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import type { EntityManager } from 'typeorm';
import type { OnboardingState } from '@shared/interfaces/types/onboarding.types';
export class OnboardingService {
  async read(manager: EntityManager, userId: number): Promise<OnboardingState> {
    const [progress] = await manager.query(
      'SELECT * FROM onboarding_progress WHERE user_id=?',
      [userId],
    );
    const step = progress?.current_step ?? 0;
    const queries = [
      "SELECT COUNT(*) AS n FROM accounts WHERE user_id=? AND type<>'credit_card'",
      'SELECT COUNT(*) AS n FROM categories WHERE user_id=? OR is_default=1',
      "SELECT COUNT(*) AS n FROM transactions t JOIN accounts a ON a.id=t.account_id WHERE a.user_id=? AND t.type='income' AND t.origin<>'transfer'",
      "SELECT COUNT(*) AS n FROM transactions t JOIN accounts a ON a.id=t.account_id WHERE a.user_id=? AND t.type='expense' AND t.origin<>'transfer'",
      'SELECT COUNT(*) AS n FROM budgets WHERE user_id=?',
    ];
    const [row] =
      step < queries.length
        ? await manager.query(queries[step], [userId])
        : [{ n: 1 }];
    return {
      step,
      completed: Boolean(progress?.completed_at),
      ready: Number(row.n) > 0,
    };
  }
  state(userId: number): Promise<OnboardingState> {
    return this.read(getDataSource().manager, userId);
  }
  advance(
    userId: number,
    step: number,
    skip = false,
  ): Promise<OnboardingState> {
    return financialTransaction(async (manager) => {
      const state = await this.read(manager, userId);
      if (state.completed) return state;
      if (
        step !== state.step ||
        !Number.isInteger(step) ||
        step < 0 ||
        step > 5
      )
        throw new Error('Etapa inválida. Atualize o guia.');
      if (!state.ready && !(skip === true && step === 4))
        throw new Error('Conclua o cadastro desta etapa para continuar.');
      await manager.query(
        'INSERT INTO onboarding_progress(user_id,current_step,completed_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET current_step=excluded.current_step,completed_at=excluded.completed_at',
        [
          userId,
          Math.min(step + 1, 5),
          step === 5 ? new Date().toISOString() : null,
        ],
      );
      return this.read(manager, userId);
    });
  }
}
