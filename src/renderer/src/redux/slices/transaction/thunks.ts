import { createAsyncThunk } from '@reduxjs/toolkit';
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
    const response = await window.electronAPI.transaction.findAll(
      filters ?? {},
    );
    if (!response.success) {
      throw new Error(response.error || 'Erro ao carregar transações');
    }
    return response.data as PageResult<Transaction>;
  },
);

export const createTransaction = createAsyncThunk(
  'transaction/createTransaction',
  async (data: CreateTransactionInput) => {
    const response = await window.electronAPI.transaction.create(data);
    if (!response.success) {
      throw new Error(response.error || 'Erro ao criar transação');
    }
    return response.data as Transaction;
  },
);

export const updateTransaction = createAsyncThunk(
  'transaction/updateTransaction',
  async ({ id, data }: { id: number; data: UpdateTransactionInput }) => {
    const response = await window.electronAPI.transaction.update(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Erro ao atualizar transação');
    }
    return response.data as Transaction;
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
    const response = await window.electronAPI.transaction.delete(
      id,
      deleteAllInstallments,
    );
    if (!response.success) {
      throw new Error(response.error || 'Erro ao excluir transação');
    }
    return id;
  },
);

export const fetchTransactionById = createAsyncThunk(
  'transaction/fetchTransactionById',
  async (id: number) => {
    const response = await window.electronAPI.transaction.findById(id);
    if (!response.success) {
      throw new Error(response.error || 'Erro ao carregar transação');
    }
    return response.data as Transaction;
  },
);
