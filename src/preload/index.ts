import type { OnboardingAPI } from '@shared/interfaces/types/onboarding.types';
import type { ListingAPI } from '@shared/interfaces/types/listing.types';
import type { BackupAPI } from '@shared/interfaces/types/backup.types';
import type { InvestmentAPI } from '@shared/interfaces/types/investment.types';
import { contextBridge, ipcRenderer } from 'electron';
import {
  CustomElectronAPI,
  IpcResultEvent,
} from '@shared/interfaces/config/index.types';
import { CONTROLLER_CONFIG } from './controller-config';
import './index.d';

import type { IFinanceAuthController } from '@shared/interfaces/controllers/finance-auth.controller.interface';
import type { IAccountController } from '@shared/interfaces/controllers/account.controller.interface';
import type { ICategoryController } from '@shared/interfaces/controllers/category.controller.interface';
import type { ITransactionController } from '@shared/interfaces/controllers/transaction.controller.interface';
import type { IGoalController } from '@shared/interfaces/controllers/goal.controller.interface';
import type { IAlertController } from '@shared/interfaces/controllers/alert.controller.interface';
import type { ICreditCardController } from '@shared/interfaces/controllers/credit-card.controller.interface';
import type { IReportController } from '@shared/interfaces/controllers/report.controller.interface';
import type { IImportController } from '@shared/interfaces/controllers/import.controller.interface';
import type {
  IAutoUpdaterController,
  UpdateState,
} from '@shared/interfaces/types/auto-updater.types';
import type { IBudgetController } from '@shared/interfaces/controllers/budget.controller.interface';
import type { ITransferController } from '@shared/interfaces/controllers/transfer.controller.interface';
import type { IRecurringController } from '@shared/interfaces/controllers/recurring.controller.interface';
import type { ICashFlowController } from '@shared/interfaces/controllers/cash-flow.controller.interface';
import type { IAdvancedReportController } from '@shared/interfaces/controllers/advanced-report.controller.interface';
import type { IBankImportController } from '@shared/interfaces/controllers/bank-import.controller.interface';
import type { ITagController } from '@shared/interfaces/controllers/tag.controller.interface';
import type { INotificationController } from '@shared/interfaces/controllers/notification.controller.interface';
import type { ICurrencyController } from '@shared/interfaces/controllers/currency.controller.interface';
import type { IAttachmentController } from '@shared/interfaces/controllers/attachment.controller.interface';

console.log('PRELOAD LOADED!');
console.log('contextIsolated:', process.contextIsolated);

// Event emitter para resultados IPC (sucesso e erro)
type IpcResultCallback = (event: IpcResultEvent) => void;
const ipcResultListeners: Set<IpcResultCallback> = new Set();

function emitIpcResult(event: IpcResultEvent): void {
  ipcResultListeners.forEach((callback) => {
    try {
      callback(event);
    } catch (e) {
      console.error('Error in IPC result listener:', e);
    }
  });
}

function createControllerFromConfig<T extends object>(
  prefix: string,
  methods: readonly (keyof T)[],
): T {
  const controller = {} as T;

  methods.forEach((methodName) => {
    const channel = `${prefix}:${String(methodName)}`;
    console.log('ipc::invoke::channel::' + channel);

    (controller as Record<string, unknown>)[methodName as string] = async (
      ...args: unknown[]
    ) => {
      try {
        const result = await ipcRenderer.invoke(channel, ...args);

        if (result && typeof result === 'object' && 'success' in result) {
          if (result.success) {
            // Emite evento de sucesso
            emitIpcResult({ channel, success: true });
          } else {
            // Emite evento de erro
            const errorMessage =
              result.error || result.message || 'Erro desconhecido';
            emitIpcResult({ channel, success: false, error: errorMessage });
          }
        }

        return result;
      } catch (error) {
        // Captura erros de invocação IPC
        const errorMessage =
          error instanceof Error ? error.message : 'Erro de comunicação';
        emitIpcResult({ channel, success: false, error: errorMessage });
        throw error;
      }
    };
  });

  return controller;
}

const api: CustomElectronAPI = {
  onboarding: createControllerFromConfig<OnboardingAPI>('onboarding', [
    'state',
    'advance',
  ]),
  listing: createControllerFromConfig<ListingAPI>('listing', ['query']),
  backup: createControllerFromConfig<BackupAPI>(
    CONTROLLER_CONFIG.backup.prefix,
    CONTROLLER_CONFIG.backup.methods,
  ),
  investment: createControllerFromConfig<InvestmentAPI>(
    CONTROLLER_CONFIG.investment.prefix,
    CONTROLLER_CONFIG.investment.methods,
  ),
  financeAuth: createControllerFromConfig<IFinanceAuthController>(
    CONTROLLER_CONFIG.financeAuth.prefix,
    CONTROLLER_CONFIG.financeAuth.methods,
  ),

  account: createControllerFromConfig<IAccountController>(
    CONTROLLER_CONFIG.account.prefix,
    CONTROLLER_CONFIG.account.methods,
  ),

  category: createControllerFromConfig<ICategoryController>(
    CONTROLLER_CONFIG.category.prefix,
    CONTROLLER_CONFIG.category.methods,
  ),

  transaction: createControllerFromConfig<ITransactionController>(
    CONTROLLER_CONFIG.transaction.prefix,
    CONTROLLER_CONFIG.transaction.methods,
  ),

  goal: createControllerFromConfig<IGoalController>(
    CONTROLLER_CONFIG.goal.prefix,
    CONTROLLER_CONFIG.goal.methods,
  ),

  alert: createControllerFromConfig<IAlertController>(
    CONTROLLER_CONFIG.alert.prefix,
    CONTROLLER_CONFIG.alert.methods,
  ),

  creditCard: createControllerFromConfig<ICreditCardController>(
    CONTROLLER_CONFIG.creditCard.prefix,
    CONTROLLER_CONFIG.creditCard.methods,
  ),

  report: createControllerFromConfig<IReportController>(
    CONTROLLER_CONFIG.report.prefix,
    CONTROLLER_CONFIG.report.methods,
  ),

  import: createControllerFromConfig<IImportController>(
    CONTROLLER_CONFIG.import.prefix,
    CONTROLLER_CONFIG.import.methods,
  ),

  autoUpdater: createControllerFromConfig<IAutoUpdaterController>(
    CONTROLLER_CONFIG.autoUpdater.prefix,
    CONTROLLER_CONFIG.autoUpdater.methods,
  ),

  budget: createControllerFromConfig<IBudgetController>(
    CONTROLLER_CONFIG.budget.prefix,
    CONTROLLER_CONFIG.budget.methods as readonly (keyof IBudgetController)[],
  ),

  transfer: createControllerFromConfig<ITransferController>(
    CONTROLLER_CONFIG.transfer.prefix,
    CONTROLLER_CONFIG.transfer
      .methods as readonly (keyof ITransferController)[],
  ),

  recurring: createControllerFromConfig<IRecurringController>(
    CONTROLLER_CONFIG.recurring.prefix,
    CONTROLLER_CONFIG.recurring
      .methods as readonly (keyof IRecurringController)[],
  ),

  cashFlow: createControllerFromConfig<ICashFlowController>(
    CONTROLLER_CONFIG.cashFlow.prefix,
    CONTROLLER_CONFIG.cashFlow
      .methods as readonly (keyof ICashFlowController)[],
  ),

  advancedReport: createControllerFromConfig<IAdvancedReportController>(
    CONTROLLER_CONFIG.advancedReport.prefix,
    CONTROLLER_CONFIG.advancedReport
      .methods as readonly (keyof IAdvancedReportController)[],
  ),

  bankImport: createControllerFromConfig<IBankImportController>(
    CONTROLLER_CONFIG.bankImport.prefix,
    CONTROLLER_CONFIG.bankImport
      .methods as readonly (keyof IBankImportController)[],
  ),

  tag: createControllerFromConfig<ITagController>(
    CONTROLLER_CONFIG.tag.prefix,
    CONTROLLER_CONFIG.tag.methods as readonly (keyof ITagController)[],
  ),

  notification: createControllerFromConfig<INotificationController>(
    CONTROLLER_CONFIG.notification.prefix,
    CONTROLLER_CONFIG.notification
      .methods as readonly (keyof INotificationController)[],
  ),

  currency: createControllerFromConfig<ICurrencyController>(
    CONTROLLER_CONFIG.currency.prefix,
    CONTROLLER_CONFIG.currency
      .methods as readonly (keyof ICurrencyController)[],
  ),

  attachment: createControllerFromConfig<IAttachmentController>(
    CONTROLLER_CONFIG.attachment.prefix,
    CONTROLLER_CONFIG.attachment
      .methods as readonly (keyof IAttachmentController)[],
  ),

  openExternalUrl: (url: string) => {
    void ipcRenderer.invoke('app:openExternal', url);
  },
  windowControls: {
    minimize: () => ipcRenderer.send('window:control', 'minimize'),
    toggleMaximize: () => ipcRenderer.send('window:control', 'toggle-maximize'),
    close: () => ipcRenderer.send('window:control', 'close'),
  },

  onAutoUpdaterStatus: (
    callback: (state: UpdateState) => void,
  ): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      state: UpdateState,
    ) => {
      callback(state);
    };
    ipcRenderer.on('autoUpdater:statusUpdate', listener);
    return () =>
      ipcRenderer.removeListener('autoUpdater:statusUpdate', listener);
  },

  onIpcResult: (callback: (event: IpcResultEvent) => void): (() => void) => {
    ipcResultListeners.add(callback);
    return () => {
      ipcResultListeners.delete(callback);
    };
  },
};

if (process.contextIsolated) {
  try {
    console.log('Exposing APIs via contextBridge...');
    contextBridge.exposeInMainWorld('electronAPI', api);
    console.log('APIs exposed successfully!');
  } catch (error: unknown) {
    console.log('[ERROR] Error exposing APIs:', error);
  }
} else {
  window.electronAPI = api;
}

export type PreloadAPI = CustomElectronAPI;
