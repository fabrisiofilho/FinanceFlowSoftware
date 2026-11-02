/** Regras puras, independentes de Electron, banco e interface. */
export function assertPositiveAmount(
  value: unknown,
  label = 'Valor',
): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} deve ser um número finito maior que zero`);
  }
}

export function validateTransferValues(
  amount: unknown,
  exchangeRate: unknown = 1,
): number {
  assertPositiveAmount(amount);
  assertPositiveAmount(exchangeRate, 'Taxa de conversão');
  const convertedAmount = amount * exchangeRate;
  assertPositiveAmount(convertedAmount, 'Valor convertido');
  return convertedAmount;
}
