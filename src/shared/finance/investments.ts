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
): { month: number; balanceCents: number; yieldCents: number }[] {
  assertCents(balanceCents);
  if (
    balanceCents < 0 ||
    !Number.isFinite(monthlyRate) ||
    monthlyRate <= -100 ||
    monthlyRate > 100 ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > 360
  )
    throw new Error(
      'Use taxa mensal entre -100% e 100% e prazo de 1 a 360 meses',
    );
  let balance = balanceCents;
  return Array.from({ length: months }, (_, index) => {
    const income = Math.round((balance * monthlyRate) / 100);
    balance += income;
    assertCents(balance);
    return { month: index + 1, balanceCents: balance, yieldCents: income };
  });
}
