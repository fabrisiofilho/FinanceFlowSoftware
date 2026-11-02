export function assertMonth(month: string): void {
  if (typeof month !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error('Competência inválida');
}
export function assertCents(amount: number, positive = false): void {
  if (!Number.isSafeInteger(amount) || (positive && amount <= 0))
    throw new Error('Informe um valor monetário válido');
}
export function projectInvestment(
  balanceCents: number,
  monthlyRate: number,
  months: number,
  contributionCents = 0,
  contributionTiming: 'start' | 'end' = 'end',
): {
  month: number;
  balanceCents: number;
  yieldCents: number;
  accumulatedYieldCents: number;
  accumulatedContributionCents: number;
}[] {
  assertCents(balanceCents);
  assertCents(contributionCents);
  if (
    balanceCents < 0 ||
    !Number.isFinite(monthlyRate) ||
    monthlyRate <= -100 ||
    monthlyRate > 100 ||
    !Number.isInteger(months) ||
    contributionCents < 0 ||
    !['start', 'end'].includes(contributionTiming) ||
    months < 0 ||
    months > 360
  )
    throw new Error(
      'Use taxa mensal entre -100% e 100% e prazo de 0 a 360 meses',
    );
  let balance = balanceCents,
    accumulatedYieldCents = 0,
    accumulatedContributionCents = 0;
  return Array.from({ length: months }, (_, index) => {
    const base =
      balance + (contributionTiming === 'start' ? contributionCents : 0);
    assertCents(base);
    const income = Math.round((base * monthlyRate) / 100);
    accumulatedYieldCents += income;
    accumulatedContributionCents += contributionCents;
    balance += income + contributionCents;
    assertCents(accumulatedYieldCents);
    assertCents(accumulatedContributionCents);
    assertCents(balance);
    return {
      month: index + 1,
      balanceCents: balance,
      yieldCents: income,
      accumulatedYieldCents,
      accumulatedContributionCents,
    };
  });
}
import type {
  Investment,
  InvestmentPortfolio,
} from '../interfaces/types/investment.types';
export function investmentBalance(
  investment: Investment,
  portfolio: InvestmentPortfolio,
): number {
  const yields = portfolio.yields
    .filter((item) => item.investmentId === investment.id)
    .reduce((sum, item) => sum + item.amountCents, 0);
  const movements = (portfolio.events ?? [])
    .filter((item) => item.investmentId === investment.id)
    .reduce(
      (sum, item) =>
        sum +
        (item.kind === 'initial'
          ? 0
          : item.kind === 'deposit'
            ? item.amountCents
            : -item.amountCents),
      0,
    );
  const result = investment.principalCents + yields + movements;
  assertCents(result);
  return result;
}
