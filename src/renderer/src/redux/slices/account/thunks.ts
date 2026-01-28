import { createAsyncThunk } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '@shared/interfaces/types/account.types';
export const fetchAccounts = createAsyncThunk(
  'account/fetchAccounts',
  async () => {
    try {
      const response = await window.electronAPI.account.findAll();
      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar contas');
      }
      return response.data as Account[];
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao carregar contas',
      });
      throw err;
    }
  },
);
export const fetchTotalBalance = createAsyncThunk(
  'account/fetchTotalBalance',
  async () => {
    try {
      const response = await window.electronAPI.account.getTotalBalance();
      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar saldo total');
      }
      return response.data as number;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao carregar saldo total',
      });
      throw err;
    }
  },
);
export const fetchAccountsWithBalance = createAsyncThunk(
  'account/fetchAccountsWithBalance',
  async () => {
    try {
      const [accountsResponse, totalBalanceResponse] = await Promise.all([
        window.electronAPI.account.findAll(),
        window.electronAPI.account.getTotalBalance(),
      ]);
      if (!accountsResponse.success) {
        throw new Error(accountsResponse.error || 'Erro ao carregar contas');
      }
      return {
        accounts: accountsResponse.data as Account[],
        totalBalance: totalBalanceResponse.success
          ? (totalBalanceResponse.data as number)
          : 0,
      };
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao carregar contas',
      });
      throw err;
    }
  },
);
export const createAccount = createAsyncThunk(
  'account/createAccount',
  async (data: CreateAccountInput) => {
    try {
      const response = await window.electronAPI.account.create(data);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar conta');
      }
      enqueueSnackbar({
        variant: 'success',
        message: 'Conta criada com sucesso!',
      });
      return response.data as Account;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao criar conta',
      });
      throw err;
    }
  },
);
export const updateAccount = createAsyncThunk(
  'account/updateAccount',
  async ({ id, data }: { id: number; data: UpdateAccountInput }) => {
    try {
      const response = await window.electronAPI.account.update(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar conta');
      }
      enqueueSnackbar({
        variant: 'success',
        message: 'Conta atualizada com sucesso!',
      });
      return response.data as Account;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao atualizar conta',
      });
      throw err;
    }
  },
);
export const deleteAccount = createAsyncThunk(
  'account/deleteAccount',
  async (id: number) => {
    try {
      const response = await window.electronAPI.account.delete(id);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao excluir conta');
      }
      enqueueSnackbar({
        variant: 'success',
        message: 'Conta excluída com sucesso!',
      });
      return id;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao excluir conta',
      });
      throw err;
    }
  },
);
export const fetchAccountById = createAsyncThunk(
  'account/fetchAccountById',
  async (id: number) => {
    try {
      const response = await window.electronAPI.account.findById(id);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar conta');
      }
      return response.data as Account;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao carregar conta',
      });
      throw err;
    }
  },
);
