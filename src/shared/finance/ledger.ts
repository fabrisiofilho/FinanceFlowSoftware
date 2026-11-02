import { amountToCents } from './entry-schedule';

/** Porta implementada dentro de uma unidade de trabalho atômica no adaptador. */
export interface GoalContributionPort<T> {
  findOwnedGoal(
    actorId: number,
    goalId: number,
  ): Promise<{ currentCents: number; targetCents: number } | null>;
  append(goalId: number, cents: number, date: Date): Promise<void>;
  recompute(goalId: number): Promise<T>;
}

export async function contributeToGoal<T>(
  port: GoalContributionPort<T>,
  command: { actorId: number; goalId: number; amount: number; date: Date },
): Promise<{ wasCompleted: boolean; entity: T }> {
  const cents = amountToCents(command.amount);
  if (
    !Number.isSafeInteger(command.actorId) ||
    command.actorId < 1 ||
    !Number.isSafeInteger(command.goalId) ||
    command.goalId < 1
  )
    throw new Error('Meta não encontrada.');
  if (
    !(command.date instanceof Date) ||
    !Number.isFinite(command.date.getTime())
  )
    throw new Error('Data da contribuição inválida.');
  const goal = await port.findOwnedGoal(command.actorId, command.goalId);
  if (!goal) throw new Error('Meta não encontrada.');
  await port.append(command.goalId, cents, command.date);
  return {
    wasCompleted: goal.currentCents >= goal.targetCents,
    entity: await port.recompute(command.goalId),
  };
}

export function balanceImpactCents(
  type: 'income' | 'expense',
  amount: number,
): number {
  if (type !== 'income' && type !== 'expense')
    throw new Error('Tipo de lançamento inválido.');
  if (amount === 0) return 0;
  const cents = amountToCents(amount);
  return type === 'income' ? cents : -cents;
}

export function assertInvoiceLink(
  entry: { accountId: number; type: string; status?: string; origin?: string },
  invoice: { accountId: number },
): void {
  if (
    entry.accountId !== invoice.accountId ||
    entry.type !== 'expense' ||
    entry.status === 'cancelled' ||
    entry.origin === 'transfer'
  )
    throw new Error(
      'Somente despesas válidas do mesmo cartão podem ser vinculadas à fatura.',
    );
}
