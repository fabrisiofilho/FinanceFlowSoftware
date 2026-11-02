import { CustomElectronAPI } from '../shared/interfaces/config/index.types';

declare global {
  interface Window {
    electronAPI: CustomElectronAPI;
  }
}

export {};
