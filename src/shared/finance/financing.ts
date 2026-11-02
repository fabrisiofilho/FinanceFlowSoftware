import { assertCents } from './investments';
import { calendarDate } from './advanced-reports';
export interface FinancingInput {
  name: string;
  creditor: string;
  accountId: number;
  categoryId: number;
  method: 'MANUAL' | 'SAC' | 'PRICE';
  principalCents: number;
  monthlyRatePercent: number;
  termMonths: number;
  firstDueDate: string;
  manualInstallmentCents: number;
  monthlyFeesCents: number;
}
export interface FinancingInstallment {
  number: number;
  dueDate: string;
  principalCents: number;
  interestCents: number;
  feesCents: number;
  totalCents: number;
}
const rounded = (n: bigint, d: bigint): number => Number((n + d / 2n) / d);
export function financingSchedule(
  input: FinancingInput,
): FinancingInstallment[] {
  if (!input || !['MANUAL', 'SAC', 'PRICE'].includes(input.method))
    throw new Error('Método inválido');
  for (const amount of [
    input.principalCents,
    input.manualInstallmentCents,
    input.monthlyFeesCents,
  ]) {
    assertCents(amount);
    if (amount < 0) throw new Error('Valor negativo');
  }
  if (
    !input.name?.trim() ||
    !input.creditor?.trim() ||
    input.name.length > 120 ||
    input.creditor.length > 120
  )
    throw new Error('Informe nome e credor (até 120 caracteres)');
  if (
    !Number.isInteger(input.termMonths) ||
    input.termMonths < 1 ||
    input.termMonths > 600
  )
    throw new Error('Prazo de 1 a 600 meses');
  if (
    !Number.isFinite(input.monthlyRatePercent) ||
    input.monthlyRatePercent < 0 ||
    input.monthlyRatePercent > 100
  )
    throw new Error('Taxa mensal de 0 a 100%');
  calendarDate(input.firstDueDate);
  if (input.method !== 'MANUAL' && input.principalCents <= 0)
    throw new Error('Informe o principal');
  if (input.method === 'MANUAL' && input.manualInstallmentCents <= 0)
    throw new Error('Informe a parcela prevista');
  const denominator = 1000000n,
    rate = BigInt(Math.round(input.monthlyRatePercent * 10000));
  const principal = BigInt(input.principalCents),
    n = BigInt(input.termMonths);
  const power = (denominator + rate) ** n,
    base = denominator ** n;
  const payment =
    rate === 0n
      ? rounded(principal, n)
      : rounded(principal * rate * power, denominator * (power - base));
  let remaining = input.principalCents;
  const [year, month, day] = input.firstDueDate.split('-').map(Number);
  return Array.from({ length: input.termMonths }, (_, i) => {
    const date = new Date(year, month - 1 + i, 1),
      last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dueDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(Math.min(day, last)).padStart(2, '0')}`;
    const interestCents =
      input.method === 'MANUAL'
        ? 0
        : rounded(BigInt(remaining) * rate, denominator);
    let principalCents =
      input.method === 'MANUAL'
        ? 0
        : input.method === 'SAC'
          ? Math.floor(input.principalCents / input.termMonths) +
            (i < input.principalCents % input.termMonths ? 1 : 0)
          : Math.min(remaining, Math.max(0, payment - interestCents));
    if (input.method !== 'MANUAL' && i === input.termMonths - 1)
      principalCents = remaining;
    remaining -= principalCents;
    const totalCents =
      input.method === 'MANUAL'
        ? input.manualInstallmentCents
        : principalCents + interestCents + input.monthlyFeesCents;
    assertCents(totalCents, true);
    return {
      number: i + 1,
      dueDate,
      principalCents,
      interestCents,
      feesCents: input.monthlyFeesCents,
      totalCents,
    };
  });
}
