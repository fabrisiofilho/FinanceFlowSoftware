import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThunkLoading, ThunkLoadingEnum } from '@renderer/types/thunks';
import type {
  Transaction,
  TransactionType,
} from '@shared/interfaces/types/transaction.types';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchTransactionById,
} from './thunks';
export interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface TransactionFiltersState {
  startDate?: Date;
  endDate?: Date;
  categoryId?: number;
  accountId?: number;
  type?: TransactionType;
}
interface TransactionState {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  pagination: PaginationState;
  filters: TransactionFiltersState;
  fetchLoading: ThunkLoading;
  createLoading: ThunkLoading;
  updateLoading: ThunkLoading;
  deleteLoading: ThunkLoading;
  fetchByIdLoading: ThunkLoading;
  error: string | null;
}
const initialState: TransactionState = {
  transactions: [],
  selectedTransaction: null,
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  filters: {},
  fetchLoading: ThunkLoadingEnum.IDLE,
  createLoading: ThunkLoadingEnum.IDLE,
  updateLoading: ThunkLoadingEnum.IDLE,
  deleteLoading: ThunkLoadingEnum.IDLE,
  fetchByIdLoading: ThunkLoadingEnum.IDLE,
  error: null,
};
export const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearTransactionState: (state) => {
      state.transactions = [];
      state.selectedTransaction = null;
      state.pagination = {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      };
      state.filters = {};
      state.fetchLoading = ThunkLoadingEnum.IDLE;
      state.createLoading = ThunkLoadingEnum.IDLE;
      state.updateLoading = ThunkLoadingEnum.IDLE;
      state.deleteLoading = ThunkLoadingEnum.IDLE;
      state.fetchByIdLoading = ThunkLoadingEnum.IDLE;
      state.error = null;
    },
    setSelectedTransaction: (
      state,
      action: PayloadAction<Transaction | null>,
    ) => {
      state.selectedTransaction = action.payload;
    },
    clearSelectedTransaction: (state) => {
      state.selectedTransaction = null;
    },
    setTransactionFilters: (
      state,
      action: PayloadAction<Partial<TransactionFiltersState>>,
    ) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
      state.pagination.page = 0;
    },
    applyFilters: (state, action: PayloadAction<TransactionFiltersState>) => {
      state.filters = action.payload;
      state.pagination.page = 0;
    },
    clearTransactionFilters: (state) => {
      state.filters = {};
      state.pagination.page = 0;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload;
      state.pagination.page = 0;
    },
    clearTransactionError: (state) => {
      state.error = null;
    },
    resetFetchLoading: (state) => {
      state.fetchLoading = ThunkLoadingEnum.IDLE;
    },
    resetCreateLoading: (state) => {
      state.createLoading = ThunkLoadingEnum.IDLE;
    },
    resetUpdateLoading: (state) => {
      state.updateLoading = ThunkLoadingEnum.IDLE;
    },
    resetDeleteLoading: (state) => {
      state.deleteLoading = ThunkLoadingEnum.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.fetchLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, { payload }) => {
        state.transactions = payload.content;
        state.pagination = {
          page: payload.page,
          size: payload.size,
          totalElements: payload.totalElements,
          totalPages: payload.totalPages,
        };
        state.fetchLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.fetchLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao carregar transações';
      })
      .addCase(createTransaction.pending, (state) => {
        state.createLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, { payload }) => {
        state.transactions.unshift(payload);
        state.pagination.totalElements += 1;
        state.createLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.createLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao criar transação';
      })
      .addCase(updateTransaction.pending, (state) => {
        state.updateLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, { payload }) => {
        const index = state.transactions.findIndex((t) => t.id === payload.id);
        if (index !== -1) {
          state.transactions[index] = payload;
        }
        if (state.selectedTransaction?.id === payload.id) {
          state.selectedTransaction = payload;
        }
        state.updateLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.updateLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao atualizar transação';
      })
      .addCase(deleteTransaction.pending, (state) => {
        state.deleteLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, { payload: deletedId }) => {
        state.transactions = state.transactions.filter(
          (t) => t.id !== deletedId,
        );
        state.pagination.totalElements = Math.max(
          0,
          state.pagination.totalElements - 1,
        );
        if (state.selectedTransaction?.id === deletedId) {
          state.selectedTransaction = null;
        }
        state.deleteLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.deleteLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao excluir transação';
      })
      .addCase(fetchTransactionById.pending, (state) => {
        state.fetchByIdLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, { payload }) => {
        state.selectedTransaction = payload;
        state.fetchByIdLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.fetchByIdLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao carregar transação';
      });
  },
});
export const {
  clearTransactionState,
  setSelectedTransaction,
  clearSelectedTransaction,
  setTransactionFilters,
  applyFilters,
  clearTransactionFilters,
  setPage,
  setPageSize,
  clearTransactionError,
  resetFetchLoading,
  resetCreateLoading,
  resetUpdateLoading,
  resetDeleteLoading,
} = transactionSlice.actions;
export {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchTransactionById,
} from './thunks';
export const selectTransactions = (state: { transaction: TransactionState }) =>
  state.transaction.transactions;
export const selectSelectedTransaction = (state: {
  transaction: TransactionState;
}) => state.transaction.selectedTransaction;
export const selectPagination = (state: { transaction: TransactionState }) =>
  state.transaction.pagination;
export const selectCurrentPage = (state: { transaction: TransactionState }) =>
  state.transaction.pagination.page;
export const selectPageSize = (state: { transaction: TransactionState }) =>
  state.transaction.pagination.size;
export const selectTotalElements = (state: { transaction: TransactionState }) =>
  state.transaction.pagination.totalElements;
export const selectTotalPages = (state: { transaction: TransactionState }) =>
  state.transaction.pagination.totalPages;
export const selectTransactionFilters = (state: {
  transaction: TransactionState;
}) => state.transaction.filters;
export const selectHasActiveFilters = (state: {
  transaction: TransactionState;
}) => {
  const { filters } = state.transaction;
  return !!(
    filters.startDate ||
    filters.endDate ||
    filters.categoryId ||
    filters.accountId ||
    filters.type
  );
};
export const selectFetchLoading = (state: { transaction: TransactionState }) =>
  state.transaction.fetchLoading;
export const selectCreateLoading = (state: { transaction: TransactionState }) =>
  state.transaction.createLoading;
export const selectUpdateLoading = (state: { transaction: TransactionState }) =>
  state.transaction.updateLoading;
export const selectDeleteLoading = (state: { transaction: TransactionState }) =>
  state.transaction.deleteLoading;
export const selectFetchByIdLoading = (state: {
  transaction: TransactionState;
}) => state.transaction.fetchByIdLoading;
export const selectTransactionError = (state: {
  transaction: TransactionState;
}) => state.transaction.error;
export const selectIsAnyLoading = (state: {
  transaction: TransactionState;
}) => {
  const { transaction } = state;
  return (
    transaction.fetchLoading === ThunkLoadingEnum.PENDING ||
    transaction.createLoading === ThunkLoadingEnum.PENDING ||
    transaction.updateLoading === ThunkLoadingEnum.PENDING ||
    transaction.deleteLoading === ThunkLoadingEnum.PENDING ||
    transaction.fetchByIdLoading === ThunkLoadingEnum.PENDING
  );
};
export const selectIsFetching = (state: { transaction: TransactionState }) =>
  state.transaction.fetchLoading === ThunkLoadingEnum.PENDING;
export const selectIsCreating = (state: { transaction: TransactionState }) =>
  state.transaction.createLoading === ThunkLoadingEnum.PENDING;
export const selectIsUpdating = (state: { transaction: TransactionState }) =>
  state.transaction.updateLoading === ThunkLoadingEnum.PENDING;
export const selectIsDeleting = (state: { transaction: TransactionState }) =>
  state.transaction.deleteLoading === ThunkLoadingEnum.PENDING;
export const selectFiltersForApi = (state: {
  transaction: TransactionState;
}) => {
  const { filters, pagination } = state.transaction;
  return {
    ...filters,
    page: pagination.page,
    size: pagination.size,
  };
};
