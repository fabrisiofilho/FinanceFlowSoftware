import { getDataSource } from '@main/infrastructure/database/data-source';
import { AccountEntity } from '../entities/account.entity';
import { CategoryEntity } from '../entities/category.entity';
import { GoalEntity } from '../entities/goal.entity';
import { RecurringTransactionEntity } from '../entities/recurring-transaction.entity';
import { TransferEntity } from '../entities/transfer.entity';
import type {
  ListingKind,
  ListingQuery,
  ListingPage,
  ListingRecords,
} from '@shared/interfaces/types/listing.types';

export class ListingService {
  async query<K extends ListingKind>(
    userId: number,
    input: ListingQuery & { kind: K },
  ): Promise<ListingPage<ListingRecords[K]>> {
    const entities = {
      accounts: AccountEntity,
      categories: CategoryEntity,
      goals: GoalEntity,
      recurring: RecurringTransactionEntity,
      transfers: TransferEntity,
    };
    const entity = entities[input.kind];
    if (!entity || !userId) throw new Error('Listagem inválida');
    const page = input.page ?? 0,
      size = input.size ?? 24;
    if (
      !Number.isSafeInteger(page) ||
      page < 0 ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    )
      throw new Error('Paginação inválida');
    for (const ids of [input.accountIds, input.categoryIds])
      if (
        ids &&
        (!Array.isArray(ids) ||
          ids.length > 100 ||
          ids.some((id) => !Number.isSafeInteger(id) || id < 1))
      )
        throw new Error('Filtro inválido');
    const builder = getDataSource()
      .createQueryBuilder()
      .select('r')
      .from(entity, 'r');
    if (input.kind === 'categories')
      builder.where('(r.user_id=:userId OR r.is_default=1)', { userId });
    else builder.where('r.user_id=:userId', { userId });
    const label = ['accounts', 'categories', 'goals'].includes(input.kind)
      ? 'name'
      : 'description';
    if (input.search?.trim())
      builder.andWhere(`LOWER(r.${label}) LIKE LOWER(:search) ESCAPE '\\'`, {
        search:
          '%' +
          input.search
            .trim()
            .slice(0, 200)
            .replace(/[\\%_]/g, '\\$&') +
          '%',
      });
    if (
      input.types?.length &&
      ['accounts', 'categories', 'recurring'].includes(input.kind)
    )
      builder.andWhere('r.type IN (:...types)', {
        types: input.types.slice(0, 10),
      });
    if (input.accountIds?.length) {
      if (input.kind === 'accounts')
        builder.andWhere('r.id IN (:...ids)', { ids: input.accountIds });
      else if (input.kind === 'transfers')
        builder.andWhere(
          '(r.from_account_id IN (:...ids) OR r.to_account_id IN (:...ids))',
          { ids: input.accountIds },
        );
      else if (input.kind === 'goals' || input.kind === 'recurring')
        builder.andWhere('r.account_id IN (:...ids)', {
          ids: input.accountIds,
        });
    }
    if (input.categoryIds?.length && input.kind === 'recurring')
      builder.andWhere('r.category_id IN (:...categories)', {
        categories: input.categoryIds,
      });
    if (input.kind === 'recurring') {
      builder
        .leftJoinAndSelect('r.account', 'account')
        .leftJoinAndSelect('r.category', 'category');
    }
    if (input.kind === 'transfers')
      builder
        .leftJoinAndSelect('r.fromAccount', 'fromAccount')
        .leftJoinAndSelect('r.toAccount', 'toAccount');
    builder
      .orderBy('r.id', 'DESC')
      .skip(page * size)
      .take(size);
    const [rows, totalElements] = await builder.getManyAndCount();
    const content = rows.map((row) => {
      const item = row as unknown as Record<string, unknown>;
      if (input.kind === 'goals')
        return {
          ...item,
          progress: Math.min(
            100,
            (Number(item.currentAmount) / Number(item.targetAmount)) * 100,
          ),
        };
      if (input.kind === 'recurring')
        return {
          ...item,
          accountName: (item.account as AccountEntity)?.name,
          categoryName: (item.category as CategoryEntity)?.name,
        };
      if (input.kind === 'transfers')
        return {
          ...item,
          fromAccountName: (item.fromAccount as AccountEntity)?.name,
          toAccountName: (item.toAccount as AccountEntity)?.name,
        };
      return item;
    }) as unknown as ListingRecords[K][];
    return {
      content,
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
    };
  }
}
