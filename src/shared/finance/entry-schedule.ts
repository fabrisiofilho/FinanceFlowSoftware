/** Valores de entrada em reais; cálculos de parcelas exclusivamente em centavos. */
export function amountToCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error('Valor deve ser positivo e finito.');
  const cents = Math.round(amount * 100);
  if (
    !Number.isSafeInteger(cents) ||
    cents <= 0 ||
    Math.abs(amount * 100 - cents) > 0.000001
  )
    throw new Error(
      'Informe um valor em reais com até duas casas decimais e dentro do limite permitido.',
    );
  return cents;
}

export function installmentAmounts(amount: number, count: number): number[] {
  const cents = amountToCents(amount);
  if (!Number.isInteger(count) || count < 1 || count > 360 || count > cents)
    throw new Error(
      'Parcelamento inválido: use de 1 a 360 parcelas de pelo menos um centavo.',
    );
  const base = Math.floor(cents / count);
  return Array.from(
    { length: count },
    (_, index) => (base + (index === count - 1 ? cents % count : 0)) / 100,
  );
}

/** Datas locais, ancoradas no dia original, inclusive em fevereiro. */
export function occurrenceDate(
  anchor: Date,
  index: number,
  frequency: 'monthly' | 'weekly' = 'monthly',
): Date {
  if (
    !(anchor instanceof Date) ||
    !Number.isFinite(anchor.getTime()) ||
    !Number.isInteger(index) ||
    index < 0
  )
    throw new Error('Data ou ocorrência inválida.');
  if (frequency === 'weekly')
    return new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      anchor.getDate() + index * 7,
    );
  const last = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + index + 1,
    0,
  ).getDate();
  return new Date(
    anchor.getFullYear(),
    anchor.getMonth() + index,
    Math.min(anchor.getDate(), last),
  );
}
