import { contextBridge, ipcRenderer, shell } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { CustomElectronAPI } from '@shared/interfaces/config/index.types';
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
import '@shared/config/dateFnsLocale';

console.log('PRELOAD LOADED!');
console.log('contextIsolated:', process.contextIsolated);

function createControllerFromConfig<T extends object>(
  prefix: string,
  methods: readonly (keyof T)[],
): T {
  const controller = {} as T;

  methods.forEach((methodName) => {
    const channel = `${prefix}:${String(methodName)}`;
    console.log('ipc::invoke::channel::' + channel);

    (controller as Record<string, unknown>)[methodName as string] = (
      ...args: unknown[]
    ) => ipcRenderer.invoke(channel, ...args);
  });

  return controller;
}

const api: CustomElectronAPI = {
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

  openExternalUrl: (url: string) => {
    shell.openExternal(url);
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
};

if (process.contextIsolated) {
  try {
    console.log('Exposing APIs via contextBridge...');
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('electronAPI', api);
    console.log('APIs exposed successfully!');
  } catch (error: unknown) {
    console.log('[ERROR] Error exposing APIs:', error);
  }
} else {
  window.electron = electronAPI;

  window.electronAPI = api;
}

export type PreloadAPI = CustomElectronAPI;
