import type { ValueTransformer } from 'typeorm';
/** Fronteira única: API e entidades em reais; SQLite armazena centavos inteiros.
 * Inicialize valores monetários nas entidades, sem `default` no decorator:
 * o retorno de INSERT do SQLite/TypeORM hidrata defaults duas vezes.
 * Defaults físicos continuam nas migrações; synchronize permanece desativado.
 */
export const moneyColumn: ValueTransformer = {
  to(value: number | null | undefined): number | null | undefined {
    if (value === null || value === undefined) return value;
    const cents = Math.round(value * 100);
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      !Number.isSafeInteger(cents) ||
      Math.abs(value * 100 - cents) > 0.0001
    )
      throw new Error(
        'Valor monetário inválido ou fora da precisão de centavos.',
      );
    return cents;
  },
  from(value: number | null): number | null {
    if (value === null) return null;
    if (!Number.isSafeInteger(value))
      throw new Error('Valor monetário corrompido no banco.');
    return value / 100;
  },
};
