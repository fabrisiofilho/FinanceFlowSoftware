import { createAsyncThunk } from '@reduxjs/toolkit';
import { WithCallback } from '@renderer/types/thunks';
import {
  LoginCredentials,
  RegisterCredentials,
} from '@shared/interfaces/types/finance-auth.types';
import { enqueueSnackbar } from 'notistack';

export const login = createAsyncThunk(
  'auth/login',
  async ({ cb, ...params }: WithCallback<LoginCredentials>) => {
    try {
      const response = await window.electronAPI.financeAuth.login(
        params.email,
        params.password,
      );

      if (!response.success) {
        throw new Error(response.error || 'Erro ao fazer login!');
      }

      cb(true);

      return response.data!.user;
    } catch (err: unknown) {
      cb(false);

      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao conectar com o servidor',
      });

      throw err;
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ cb, ...params }: WithCallback<RegisterCredentials>) => {
    try {
      const response = await window.electronAPI.financeAuth.register(params);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar conta!');
      }

      cb(true);

      return response.data!;
    } catch (err: unknown) {
      cb(false);

      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao conectar com o servidor',
      });

      throw err;
    }
  },
);

export const loadAuthData = createAsyncThunk('auth/loadAuthData', async () => {
  const response = await window.electronAPI.financeAuth.getCurrentUser();

  if (!response.success) {
    throw new Error(
      response.error || 'Erro ao carregar dados de autenticação!',
    );
  }

  return response.data;
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const response = await window.electronAPI.financeAuth.checkAuth();

  if (!response.success) {
    throw new Error(response.error || 'Erro ao verificar autenticação!');
  }

  return response.data;
});

export const logout = createAsyncThunk(
  'auth/logout',
  async (cb: (success: boolean) => void) => {
    try {
      const response = await window.electronAPI.financeAuth.logout();

      if (!response.success) {
        throw new Error(response.error);
      }

      cb(true);

      return true;
    } catch (err: unknown) {
      cb(false);

      const error = err as { message?: string };
      enqueueSnackbar({
        variant: 'error',
        message: error?.message || 'Erro ao conectar com o servidor',
      });

      throw err;
    }
  },
);
