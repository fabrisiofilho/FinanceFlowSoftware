import type { Account } from './account.types';
import type { Category } from './category.types';
import type { Goal } from './goal.types';
import type { RecurringTransaction } from './recurring.types';
import type { Transfer } from './transfer.types';
export interface ListingRecords {
  accounts: Account;
  categories: Category;
  goals: Goal;
  recurring: RecurringTransaction;
  transfers: Transfer;
}
export type ListingKind = keyof ListingRecords;
export interface ListingQuery {
  kind: ListingKind;
  search?: string;
  page?: number;
  size?: number;
  accountIds?: number[];
  categoryIds?: number[];
  types?: string[];
}
export interface ListingPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface ListingAPI {
  query<K extends ListingKind>(
    query: ListingQuery & { kind: K },
  ): Promise<
    import('./common.types').ApiResponse<ListingPage<ListingRecords[K]>>
  >;
}
