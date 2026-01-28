import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThunkLoading, ThunkLoadingEnum } from '@renderer/types/thunks';
import type {
  MonthSummary,
  CategoryExpense,
  Transaction,
} from '@shared/interfaces/types/transaction.types';
import type { IncomeVsExpense } from '@shared/interfaces/types/report.types';
import {
  loadDashboardData,
  loadTotalBalance,
  loadMonthSummary,
  loadExpensesByCategory,
  loadIncomeVsExpenses,
  loadRecentTransactions,
} from './thunks';
export interface DashboardUpcomingBill {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  categoryId: number;
  categoryName: string;
  accountId: number;
  accountName: string;
  isOverdue: boolean;
  daysUntilDue: number;
}
export interface DashboardFiltersState {
  year: number;
  month: number;
}
interface DashboardState {
  totalBalance: number;
  projectedBalance: number;
  monthSummary: MonthSummary | null;
  expensesByCategory: CategoryExpense[];
  incomeVsExpenses: IncomeVsExpense[];
  recentTransactions: Transaction[];
  upcomingBills: DashboardUpcomingBill[];
  lastUpdated: string | null;
  filters: DashboardFiltersState;
  dashboardLoading: ThunkLoading;
  totalBalanceLoading: ThunkLoading;
  monthSummaryLoading: ThunkLoading;
  expensesByCategoryLoading: ThunkLoading;
  incomeVsExpensesLoading: ThunkLoading;
  recentTransactionsLoading: ThunkLoading;
  error: string | null;
}
const getDefaultFilters = (): DashboardFiltersState => {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  };
};
const initialState: DashboardState = {
  totalBalance: 0,
  projectedBalance: 0,
  monthSummary: null,
  expensesByCategory: [],
  incomeVsExpenses: [],
  recentTransactions: [],
  upcomingBills: [],
  lastUpdated: null,
  filters: getDefaultFilters(),
  dashboardLoading: ThunkLoadingEnum.IDLE,
  totalBalanceLoading: ThunkLoadingEnum.IDLE,
  monthSummaryLoading: ThunkLoadingEnum.IDLE,
  expensesByCategoryLoading: ThunkLoadingEnum.IDLE,
  incomeVsExpensesLoading: ThunkLoadingEnum.IDLE,
  recentTransactionsLoading: ThunkLoadingEnum.IDLE,
  error: null,
};
export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardState: (state) => {
      state.totalBalance = 0;
      state.projectedBalance = 0;
      state.monthSummary = null;
      state.expensesByCategory = [];
      state.incomeVsExpenses = [];
      state.recentTransactions = [];
      state.upcomingBills = [];
      state.lastUpdated = null;
      state.filters = getDefaultFilters();
      state.dashboardLoading = ThunkLoadingEnum.IDLE;
      state.totalBalanceLoading = ThunkLoadingEnum.IDLE;
      state.monthSummaryLoading = ThunkLoadingEnum.IDLE;
      state.expensesByCategoryLoading = ThunkLoadingEnum.IDLE;
      state.incomeVsExpensesLoading = ThunkLoadingEnum.IDLE;
      state.recentTransactionsLoading = ThunkLoadingEnum.IDLE;
      state.error = null;
    },
    setDashboardFilters: (
      state,
      action: PayloadAction<Partial<DashboardFiltersState>>,
    ) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    resetDashboardFilters: (state) => {
      state.filters = getDefaultFilters();
    },
    resetDashboardLoading: (state) => {
      state.dashboardLoading = ThunkLoadingEnum.IDLE;
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDashboardData.pending, (state) => {
        state.dashboardLoading = ThunkLoadingEnum.PENDING;
        state.error = null;
      })
      .addCase(loadDashboardData.fulfilled, (state, { payload }) => {
        state.totalBalance = payload.totalBalance;
        state.projectedBalance = payload.projectedBalance;
        state.monthSummary = payload.monthSummary;
        state.expensesByCategory = payload.expensesByCategory;
        state.incomeVsExpenses = payload.incomeVsExpenses;
        state.recentTransactions = payload.recentTransactions;
        state.upcomingBills = payload.upcomingBills;
        state.lastUpdated = payload.lastUpdated;
        state.filters = payload.filters;
        state.dashboardLoading = ThunkLoadingEnum.FULFILLED;
        state.error = null;
      })
      .addCase(loadDashboardData.rejected, (state, action) => {
        state.dashboardLoading = ThunkLoadingEnum.REJECTED;
        state.error =
          action.error.message || 'Erro ao carregar dados do dashboard';
      })
      .addCase(loadTotalBalance.pending, (state) => {
        state.totalBalanceLoading = ThunkLoadingEnum.PENDING;
      })
      .addCase(loadTotalBalance.fulfilled, (state, { payload }) => {
        state.totalBalance = payload;
        state.totalBalanceLoading = ThunkLoadingEnum.FULFILLED;
      })
      .addCase(loadTotalBalance.rejected, (state) => {
        state.totalBalanceLoading = ThunkLoadingEnum.REJECTED;
      })
      .addCase(loadMonthSummary.pending, (state) => {
        state.monthSummaryLoading = ThunkLoadingEnum.PENDING;
      })
      .addCase(loadMonthSummary.fulfilled, (state, { payload }) => {
        state.monthSummary = payload;
        state.monthSummaryLoading = ThunkLoadingEnum.FULFILLED;
      })
      .addCase(loadMonthSummary.rejected, (state) => {
        state.monthSummaryLoading = ThunkLoadingEnum.REJECTED;
      })
      .addCase(loadExpensesByCategory.pending, (state) => {
        state.expensesByCategoryLoading = ThunkLoadingEnum.PENDING;
      })
      .addCase(loadExpensesByCategory.fulfilled, (state, { payload }) => {
        state.expensesByCategory = payload;
        state.expensesByCategoryLoading = ThunkLoadingEnum.FULFILLED;
      })
      .addCase(loadExpensesByCategory.rejected, (state) => {
        state.expensesByCategoryLoading = ThunkLoadingEnum.REJECTED;
      })
      .addCase(loadIncomeVsExpenses.pending, (state) => {
        state.incomeVsExpensesLoading = ThunkLoadingEnum.PENDING;
      })
      .addCase(loadIncomeVsExpenses.fulfilled, (state, { payload }) => {
        state.incomeVsExpenses = payload;
        state.incomeVsExpensesLoading = ThunkLoadingEnum.FULFILLED;
      })
      .addCase(loadIncomeVsExpenses.rejected, (state) => {
        state.incomeVsExpensesLoading = ThunkLoadingEnum.REJECTED;
      })
      .addCase(loadRecentTransactions.pending, (state) => {
        state.recentTransactionsLoading = ThunkLoadingEnum.PENDING;
      })
      .addCase(loadRecentTransactions.fulfilled, (state, { payload }) => {
        state.recentTransactions = payload;
        state.recentTransactionsLoading = ThunkLoadingEnum.FULFILLED;
      })
      .addCase(loadRecentTransactions.rejected, (state) => {
        state.recentTransactionsLoading = ThunkLoadingEnum.REJECTED;
      });
  },
});
export const {
  clearDashboardState,
  setDashboardFilters,
  resetDashboardFilters,
  resetDashboardLoading,
  clearDashboardError,
} = dashboardSlice.actions;
export {
  loadDashboardData,
  loadTotalBalance,
  loadMonthSummary,
  loadExpensesByCategory,
  loadIncomeVsExpenses,
  loadRecentTransactions,
} from './thunks';
export const selectTotalBalance = (state: { dashboard: DashboardState }) =>
  state.dashboard.totalBalance;
export const selectProjectedBalance = (state: { dashboard: DashboardState }) =>
  state.dashboard.projectedBalance;
export const selectMonthSummary = (state: { dashboard: DashboardState }) =>
  state.dashboard.monthSummary;
export const selectExpensesByCategory = (state: {
  dashboard: DashboardState;
}) => state.dashboard.expensesByCategory;
export const selectIncomeVsExpenses = (state: { dashboard: DashboardState }) =>
  state.dashboard.incomeVsExpenses;
export const selectRecentTransactions = (state: {
  dashboard: DashboardState;
}) => state.dashboard.recentTransactions;
export const selectUpcomingBills = (state: { dashboard: DashboardState }) =>
  state.dashboard.upcomingBills;
export const selectLastUpdated = (state: { dashboard: DashboardState }) =>
  state.dashboard.lastUpdated;
export const selectDashboardFilters = (state: { dashboard: DashboardState }) =>
  state.dashboard.filters;
export const selectDashboardLoading = (state: { dashboard: DashboardState }) =>
  state.dashboard.dashboardLoading;
export const selectTotalBalanceLoading = (state: {
  dashboard: DashboardState;
}) => state.dashboard.totalBalanceLoading;
export const selectMonthSummaryLoading = (state: {
  dashboard: DashboardState;
}) => state.dashboard.monthSummaryLoading;
export const selectExpensesByCategoryLoading = (state: {
  dashboard: DashboardState;
}) => state.dashboard.expensesByCategoryLoading;
export const selectIncomeVsExpensesLoading = (state: {
  dashboard: DashboardState;
}) => state.dashboard.incomeVsExpensesLoading;
export const selectRecentTransactionsLoading = (state: {
  dashboard: DashboardState;
}) => state.dashboard.recentTransactionsLoading;
export const selectDashboardError = (state: { dashboard: DashboardState }) =>
  state.dashboard.error;
export const selectMonthBalance = (state: { dashboard: DashboardState }) => {
  const summary = state.dashboard.monthSummary;
  if (!summary) return 0;
  return summary.totalIncome - summary.totalExpenses;
};
export const selectIsAnyLoading = (state: { dashboard: DashboardState }) => {
  const { dashboard } = state;
  return (
    dashboard.dashboardLoading === ThunkLoadingEnum.PENDING ||
    dashboard.totalBalanceLoading === ThunkLoadingEnum.PENDING ||
    dashboard.monthSummaryLoading === ThunkLoadingEnum.PENDING ||
    dashboard.expensesByCategoryLoading === ThunkLoadingEnum.PENDING ||
    dashboard.incomeVsExpensesLoading === ThunkLoadingEnum.PENDING ||
    dashboard.recentTransactionsLoading === ThunkLoadingEnum.PENDING
  );
};
