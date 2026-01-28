import { configureStore } from '@reduxjs/toolkit';
import { drawerSlice } from './slices/drawer';
import { authSlice } from './slices/auth';
import { confirmModalSlice } from './slices/confirmModal';
import { dashboardSlice } from './slices/dashboard';
import { transactionSlice } from './slices/transaction';
import { accountSlice } from './slices/account';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    drawer: drawerSlice.reducer,
    confirmModal: confirmModalSlice.reducer,
    dashboard: dashboardSlice.reducer,
    transaction: transactionSlice.reducer,
    account: accountSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'confirmModal/openConfirmModal',
          'confirmModal/closeConfirmModal',
        ],
        ignoredPaths: ['confirmModal.action', 'confirmModal.rejectAction'],
      },
    }),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
