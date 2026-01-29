import { createAsyncThunk } from '@reduxjs/toolkit';
import type { DashboardFilters } from '@shared/interfaces/types/dashboard.types';

export const loadDashboardData = createAsyncThunk(
  'dashboard/loadDashboardData',
  async (filters?: DashboardFilters) => {
    const today = new Date();
    const year = filters?.year ?? today.getFullYear();
    const month = filters?.month ?? today.getMonth() + 1;

    const totalBalanceResponse =
      await window.electronAPI.account.getTotalBalance();
    if (!totalBalanceResponse.success) {
      throw new Error(
        totalBalanceResponse.error || 'Erro ao carregar saldo total',
      );
    }

    const monthSummaryResponse =
      await window.electronAPI.transaction.getMonthSummary(year, month);
    if (!monthSummaryResponse.success) {
      throw new Error(
        monthSummaryResponse.error || 'Erro ao carregar resumo do mês',
      );
    }

    const expensesByCategoryResponse =
      await window.electronAPI.report.getExpensesByCategory(year, month);
    if (!expensesByCategoryResponse.success) {
      throw new Error(
        expensesByCategoryResponse.error ||
          'Erro ao carregar gastos por categoria',
      );
    }

    const incomeVsExpensesResponse =
      await window.electronAPI.report.getIncomeVsExpenses(6);
    if (!incomeVsExpensesResponse.success) {
      throw new Error(
        incomeVsExpensesResponse.error ||
          'Erro ao carregar evolução receitas x despesas',
      );
    }

    const transactionsResponse = await window.electronAPI.transaction.findAll({
      page: 0,
      size: 10,
    });
    if (!transactionsResponse.success) {
      throw new Error(
        transactionsResponse.error || 'Erro ao carregar transações',
      );
    }

    const transactions = transactionsResponse.data?.content ?? [];
    const sortedTransactions = [...transactions]
      .sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime(),
      )
      .slice(0, 5);

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingBills = transactions
      .filter((t) => {
        if (t.type !== 'expense' || !t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      })
      .map((t) => {
        const dueDate = new Date(t.dueDate!);
        const diffTime = dueDate.getTime() - now.getTime();
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: t.id,
          description: t.description,
          amount: t.amount,
          dueDate: dueDate.toISOString(),
          categoryId: t.categoryId,
          categoryName: 'Categoria',
          accountId: t.accountId,
          accountName: 'Conta',
          isOverdue: daysUntilDue < 0,
          daysUntilDue,
        };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 5);

    const totalBalance = totalBalanceResponse.data ?? 0;
    const monthSummary = monthSummaryResponse.data!;
    const projectedBalance =
      totalBalance + monthSummary.totalIncome - monthSummary.totalExpenses;

    return {
      totalBalance,
      projectedBalance,
      monthSummary,
      expensesByCategory: expensesByCategoryResponse.data ?? [],
      incomeVsExpenses: incomeVsExpensesResponse.data ?? [],
      recentTransactions: sortedTransactions,
      upcomingBills,
      lastUpdated: new Date().toISOString(),
      filters: {
        year,
        month,
      },
    };
  },
);

export const loadTotalBalance = createAsyncThunk(
  'dashboard/loadTotalBalance',
  async () => {
    const response = await window.electronAPI.account.getTotalBalance();
    if (!response.success) {
      throw new Error(response.error || 'Erro ao carregar saldo total');
    }
    return response.data ?? 0;
  },
);

export const loadMonthSummary = createAsyncThunk(
  'dashboard/loadMonthSummary',
  async (params?: { year?: number; month?: number }) => {
    const today = new Date();
    const year = params?.year ?? today.getFullYear();
    const month = params?.month ?? today.getMonth() + 1;
    const response = await window.electronAPI.transaction.getMonthSummary(
      year,
      month,
    );
    if (!response.success) {
      throw new Error(response.error || 'Erro ao carregar resumo do mês');
    }
    return response.data!;
  },
);

export const loadExpensesByCategory = createAsyncThunk(
  'dashboard/loadExpensesByCategory',
  async (params?: { year?: number; month?: number }) => {
    const today = new Date();
    const year = params?.year ?? today.getFullYear();
    const month = params?.month ?? today.getMonth() + 1;
    const response = await window.electronAPI.report.getExpensesByCategory(
      year,
      month,
    );
    if (!response.success) {
      throw new Error(
        response.error || 'Erro ao carregar gastos por categoria',
      );
    }
    return response.data ?? [];
  },
);

export const loadIncomeVsExpenses = createAsyncThunk(
  'dashboard/loadIncomeVsExpenses',
  async (months: number = 6) => {
    const response =
      await window.electronAPI.report.getIncomeVsExpenses(months);
    if (!response.success) {
      throw new Error(
        response.error || 'Erro ao carregar evolução receitas x despesas',
      );
    }
    return response.data ?? [];
  },
);

export const loadRecentTransactions = createAsyncThunk(
  'dashboard/loadRecentTransactions',
  async (limit: number = 5) => {
    const response = await window.electronAPI.transaction.findAll({
      page: 1,
      size: limit,
    });
    if (!response.success) {
      throw new Error(response.error || 'Erro ao carregar transações recentes');
    }
    const transactions = response.data?.content ?? [];
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime(),
      )
      .slice(0, limit);
  },
);
