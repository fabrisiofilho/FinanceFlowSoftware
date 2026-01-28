import { createAsyncThunk } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from '@shared/interfaces/types/transaction.types';
export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export const fetchTransactions = createAsyncThunk(
  'transaction/fetchTransactions',
  async (filters?: TransactionFilters) => {
    try {
      const response = await window.electronAPI.transaction.findAll(
        filters ?? {},
      );
      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar transações');
      }
      return response.data as PageResult<Transaction>;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao carregar transações',
      });
      throw err;
    }
  },
);
export const createTransaction = createAsyncThunk(
  'transaction/createTransaction',
  async (data: CreateTransactionInput) => {
    try {
      const response = await window.electronAPI.transaction.create(data);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar transação');
      }
      enqueueSnackbar({
        variant: 'success',
        message: 'Transação criada com sucesso!',
      });
      return response.data as Transaction;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao criar transação',
      });
      throw err;
    }
  },
);
export const updateTransaction = createAsyncThunk(
  'transaction/updateTransaction',
  async ({ id, data }: { id: number; data: UpdateTransactionInput }) => {
    try {
      const response = await window.electronAPI.transaction.update(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar transação');
      }
      enqueueSnackbar({
        variant: 'success',
        message: 'Transação atualizada com sucesso!',
      });
      return response.data as Transaction;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao atualizar transação',
      });
      throw err;
    }
  },
);
export const deleteTransaction = createAsyncThunk(
  'transaction/deleteTransaction',
  async ({
    id,
    deleteAllInstallments,
  }: {
    id: number;
    deleteAllInstallments?: boolean;
  }) => {
    try {
      const response = await window.electronAPI.transaction.delete(
        id,
        deleteAllInstallments,
      );
      if (!response.success) {
        throw new Error(response.error || 'Erro ao excluir transação');
      }
      enqueueSnackbar({
        variant: 'success',
        message: 'Transação excluída com sucesso!',
      });
      return id;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao excluir transação',
      });
      throw err;
    }
  },
);
export const fetchTransactionById = createAsyncThunk(
  'transaction/fetchTransactionById',
  async (id: number) => {
    try {
      const response = await window.electronAPI.transaction.findById(id);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar transação');
      }
      return response.data as Transaction;
    } catch (err: unknown) {
      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao carregar transação',
      });
      throw err;
    }
  },
);
