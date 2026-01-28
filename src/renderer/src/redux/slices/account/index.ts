import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThunkLoading, ThunkLoadingEnum } from '@renderer/types/thunks';
import type { Account } from '@shared/interfaces/types/account.types';
import {
  fetchAccounts,
  fetchTotalBalance,
  fetchAccountsWithBalance,
  createAccount,
  updateAccount,
  deleteAccount,
  fetchAccountById,
} from './thunks';
interface AccountState {
  accounts: Account[];
  totalBalance: number;
  selectedAccount: Account | null;
  fetchLoading: ThunkLoading;
  createLoading: ThunkLoading;
  updateLoading: ThunkLoading;
  deleteLoading: ThunkLoading;
  fetchByIdLoading: ThunkLoading;
  fetchTotalBalanceLoading: ThunkLoading;
  error: string | null;
}
const initialState: AccountState = {
  accounts: [],
  totalBalance: 0,
  selectedAccount: null,
  fetchLoading: ThunkLoadingEnum.IDLE,
  createLoading: ThunkLoadingEnum.IDLE,
  updateLoading: ThunkLoadingEnum.IDLE,
  deleteLoading: ThunkLoadingEnum.IDLE,
  fetchByIdLoading: ThunkLoadingEnum.IDLE,
  fetchTotalBalanceLoading: ThunkLoadingEnum.IDLE,
  error: null,
};
export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    clearAccountState: (state) => {
      state.accounts = [];
      state.totalBalance = 0;
      state.selectedAccount = null;
      state.fetchLoading = ThunkLoadingEnum.IDLE;
      state.createLoading = ThunkLoadingEnum.IDLE;
      state.updateLoading = ThunkLoadingEnum.IDLE;
      state.deleteLoading = ThunkLoadingEnum.IDLE;
      state.fetchByIdLoading = ThunkLoadingEnum.IDLE;
      state.fetchTotalBalanceLoading = ThunkLoadingEnum.IDLE;
      state.error = null;
    },
    setSelectedAccount: (state, action: PayloadAction<Account | null>) => {
      state.selectedAccount = action.payload;
    },
    clearSelectedAccount: (state) => {
      state.selectedAccount = null;
    },
    clearAccountError: (state) => {
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
      .addCase(fetchAccounts.pending, (state) => {
        state.fetchLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, { payload }) => {
        state.accounts = payload;
        state.fetchLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.fetchLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao carregar contas';
      })
      .addCase(fetchTotalBalance.pending, (state) => {
        state.fetchTotalBalanceLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(fetchTotalBalance.fulfilled, (state, { payload }) => {
        state.totalBalance = payload;
        state.fetchTotalBalanceLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(fetchTotalBalance.rejected, (state, action) => {
        state.fetchTotalBalanceLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao carregar saldo total';
      })
      .addCase(fetchAccountsWithBalance.pending, (state) => {
        state.fetchLoading = ThunkLoadingEnum.PENDING;
        state.fetchTotalBalanceLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(fetchAccountsWithBalance.fulfilled, (state, { payload }) => {
        state.accounts = payload.accounts;
        state.totalBalance = payload.totalBalance;
        state.fetchLoading = ThunkLoadingEnum.FULFILLED;
        state.fetchTotalBalanceLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(fetchAccountsWithBalance.rejected, (state, action) => {
        state.fetchLoading = ThunkLoadingEnum.REJECTED;
        state.fetchTotalBalanceLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao carregar contas';
      })
      .addCase(createAccount.pending, (state) => {
        state.createLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, { payload }) => {
        state.accounts.push(payload);
        state.totalBalance += payload.balance;
        state.createLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.createLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao criar conta';
      })
      .addCase(updateAccount.pending, (state) => {
        state.updateLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, { payload }) => {
        const index = state.accounts.findIndex((a) => a.id === payload.id);
        if (index !== -1) {
          const oldBalance = state.accounts[index].balance;
          state.totalBalance =
            state.totalBalance - oldBalance + payload.balance;
          state.accounts[index] = payload;
        }
        if (state.selectedAccount?.id === payload.id) {
          state.selectedAccount = payload;
        }
        state.updateLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.updateLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao atualizar conta';
      })
      .addCase(deleteAccount.pending, (state) => {
        state.deleteLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, { payload: deletedId }) => {
        const deletedAccount = state.accounts.find((a) => a.id === deletedId);
        if (deletedAccount) {
          state.totalBalance -= deletedAccount.balance;
        }
        state.accounts = state.accounts.filter((a) => a.id !== deletedId);
        if (state.selectedAccount?.id === deletedId) {
          state.selectedAccount = null;
        }
        state.deleteLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deleteLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao excluir conta';
      })
      .addCase(fetchAccountById.pending, (state) => {
        state.fetchByIdLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(fetchAccountById.fulfilled, (state, { payload }) => {
        state.selectedAccount = payload;
        state.fetchByIdLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(fetchAccountById.rejected, (state, action) => {
        state.fetchByIdLoading = ThunkLoadingEnum.REJECTED;
        state.error = action.error.message || 'Erro ao carregar conta';
      });
  },
});
export const {
  clearAccountState,
  setSelectedAccount,
  clearSelectedAccount,
  clearAccountError,
  resetFetchLoading,
  resetCreateLoading,
  resetUpdateLoading,
  resetDeleteLoading,
} = accountSlice.actions;
export {
  fetchAccounts,
  fetchTotalBalance,
  fetchAccountsWithBalance,
  createAccount,
  updateAccount,
  deleteAccount,
  fetchAccountById,
} from './thunks';
export const selectAccounts = (state: { account: AccountState }) =>
  state.account.accounts;
export const selectTotalBalance = (state: { account: AccountState }) =>
  state.account.totalBalance;
export const selectSelectedAccount = (state: { account: AccountState }) =>
  state.account.selectedAccount;
export const selectFetchLoading = (state: { account: AccountState }) =>
  state.account.fetchLoading;
export const selectCreateLoading = (state: { account: AccountState }) =>
  state.account.createLoading;
export const selectUpdateLoading = (state: { account: AccountState }) =>
  state.account.updateLoading;
export const selectDeleteLoading = (state: { account: AccountState }) =>
  state.account.deleteLoading;
export const selectFetchByIdLoading = (state: { account: AccountState }) =>
  state.account.fetchByIdLoading;
export const selectFetchTotalBalanceLoading = (state: {
  account: AccountState;
}) => state.account.fetchTotalBalanceLoading;
export const selectAccountError = (state: { account: AccountState }) =>
  state.account.error;
export const selectIsAnyLoading = (state: { account: AccountState }) => {
  const { account } = state;
  return (
    account.fetchLoading === ThunkLoadingEnum.PENDING ||
    account.createLoading === ThunkLoadingEnum.PENDING ||
    account.updateLoading === ThunkLoadingEnum.PENDING ||
    account.deleteLoading === ThunkLoadingEnum.PENDING ||
    account.fetchByIdLoading === ThunkLoadingEnum.PENDING ||
    account.fetchTotalBalanceLoading === ThunkLoadingEnum.PENDING
  );
};
export const selectIsFetching = (state: { account: AccountState }) =>
  state.account.fetchLoading === ThunkLoadingEnum.PENDING;
export const selectIsCreating = (state: { account: AccountState }) =>
  state.account.createLoading === ThunkLoadingEnum.PENDING;
export const selectIsUpdating = (state: { account: AccountState }) =>
  state.account.updateLoading === ThunkLoadingEnum.PENDING;
export const selectIsDeleting = (state: { account: AccountState }) =>
  state.account.deleteLoading === ThunkLoadingEnum.PENDING;
export const selectAccountsByType =
  (type: string) => (state: { account: AccountState }) =>
    state.account.accounts.filter((account) => account.type === type);
export const selectAccountsWithNegativeBalance = (state: {
  account: AccountState;
}) => state.account.accounts.filter((account) => account.balance < 0);
export const selectCreditCards = (state: { account: AccountState }) =>
  state.account.accounts.filter((account) => account.type === 'credit_card');
export const selectNonCreditCardAccounts = (state: { account: AccountState }) =>
  state.account.accounts.filter((account) => account.type !== 'credit_card');
