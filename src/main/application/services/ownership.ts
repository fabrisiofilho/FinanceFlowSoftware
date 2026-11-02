import { getDataSource } from '@main/infrastructure/database/data-source';
import { TransactionEntity } from '../entities/transaction.entity';
import { CategoryRepository } from '../repositories/category-repository';
import { AccountRepository } from '../repositories/account-repository';

export async function requireAccountOwner(
  userId: number,
  id: number,
): Promise<void> {
  if (
    !Number.isSafeInteger(userId) ||
    userId < 1 ||
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !(await new AccountRepository().findById(id, userId))
  )
    throw new Error('Conta não encontrada.');
}
export async function requireCategoryOwner(
  userId: number,
  id: number,
  type?: 'income' | 'expense',
): Promise<void> {
  if (
    !Number.isSafeInteger(userId) ||
    userId < 1 ||
    !Number.isSafeInteger(id) ||
    id < 1
  )
    throw new Error('Categoria não encontrada.');
  const category = await new CategoryRepository().findById(id, userId);
  if (!category) throw new Error('Categoria não encontrada.');
  if (type && category.type !== type)
    throw new Error('Categoria incompatível com o tipo de lançamento.');
}

export async function requireTransactionOwner(
  userId: number,
  transactionId: number,
): Promise<void> {
  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !Number.isSafeInteger(transactionId) ||
    transactionId <= 0
  )
    throw new Error('Lançamento não encontrado.');
  const entry = await getDataSource()
    .getRepository(TransactionEntity)
    .findOne({ where: { id: transactionId, account: { userId } } });
  if (!entry) throw new Error('Lançamento não encontrado.');
}
