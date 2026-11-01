import { app } from 'electron';
import type { UpdateInfo } from 'electron-updater';
import type { UpdateState } from '@shared/interfaces/types/auto-updater.types';

/** Mantém o contrato IPC sem consultar releases de outro produto. */
export class AutoUpdaterService {
  private static instance: AutoUpdaterService;

  static getInstance(): AutoUpdaterService {
    AutoUpdaterService.instance ??= new AutoUpdaterService();
    return AutoUpdaterService.instance;
  }

  getAppVersion(): string {
    return app.getVersion();
  }

  async checkForUpdates(): Promise<UpdateInfo | null> {
    return null;
  }

  async downloadUpdate(): Promise<void> {
    throw new Error('O Contabily ainda não possui um canal de atualização.');
  }

  installUpdate(): void {
    throw new Error('O Contabily ainda não possui um canal de atualização.');
  }

  getUpdateState(): UpdateState {
    return { status: 'idle' };
  }
}
