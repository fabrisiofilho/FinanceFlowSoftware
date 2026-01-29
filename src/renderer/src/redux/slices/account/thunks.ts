import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '@shared/interfaces/types/account.types';

export const fetchAccounts = createAsyncThunk(
  'account/fetchAccounts',
  async () => {
    const response = await window.electronAPI.account.findAll();
    if (!response.success) {
      throw new Error(response.error || 'Erro ao carregar contas');
    }
    return response.data as Account[];
  },
);

export const fetchTotalBalance = createAsyncThunk(
  'account/fetchTotalBalance',
  async () => {
    const response = await window.electronAPI.account.getTotalBalance();
    if (!response.success) {
      throw new Error(response.error || 'Erro ao carregar saldo total');
    }
    return response.data as number;
  },
);

export const fetchAccountsWithBalance = createAsyncThunk(
  'account/fetchAccountsWithBalance',
  async () => {
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
  },
);

export const createAccount = createAsyncThunk(
  'account/createAccount',
  async (data: CreateAccountInput) => {
    const response = await window.electronAPI.account.create(data);
    if (!response.success) {
      throw new Error(response.error || 'Erro ao criar conta');
    }
    return response.data as Account;
  },
);

export const updateAccount = createAsyncThunk(
  'account/updateAccount',
  async ({ id, data }: { id: number; data: UpdateAccountInput }) => {
    const response = await window.electronAPI.account.update(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Erro ao atualizar conta');
    }
    return response.data as Account;
  },
);

export const deleteAccount = createAsyncThunk(
  'account/deleteAccount',
  async (id: number) => {
    const response = await window.electronAPI.account.delete(id);
    if (!response.success) {
      throw new Error(response.error || 'Erro ao excluir conta');
    }
    return id;
  },
);

export const fetchAccountById = createAsyncThunk(
  'account/fetchAccountById',
  async (id: number) => {
    const response = await window.electronAPI.account.findById(id);
    if (!response.success) {
      throw new Error(response.error || 'Erro ao carregar conta');
    }
    return response.data as Account;
  },
);
