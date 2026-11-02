import type { EntityManager } from 'typeorm';
import { getDataSource } from './data-source';

// SQLite usa uma única conexão. Serializa operações compostas para evitar
// transações assíncronas sobrepostas e atualizações perdidas no processo main.
let pending: Promise<unknown> = Promise.resolve();
export function financialTransaction<T>(
  operation: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  return serializeFinancialOperation(() =>
    getDataSource().transaction(operation),
  );
}
/** Operações como VACUUM/restore precisam da fila, mas não de BEGIN/COMMIT. */
export function serializeFinancialOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const result = pending.then(operation);
  pending = result.catch(() => undefined);
  return result;
}
