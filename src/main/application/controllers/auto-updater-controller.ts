import { ipcMain } from 'electron';
import { AutoUpdaterService } from '@main/infrastructure/auto-updater/auto-updater-service';
import { logger } from '@main/infrastructure/log/logger';
import type {
  IAutoUpdaterController,
  UpdateState,
} from '@shared/interfaces/types/auto-updater.types';
const PREFIX = 'autoUpdater';
export class AutoUpdaterController implements IAutoUpdaterController {
  private service: AutoUpdaterService;
  constructor() {
    this.service = AutoUpdaterService.getInstance();
    this.registerHandlers();
  }
  private registerHandlers(): void {
    ipcMain.handle(`${PREFIX}:getAppVersion`, () => this.getAppVersion());
    ipcMain.handle(`${PREFIX}:checkForUpdates`, () => this.checkForUpdates());
    ipcMain.handle(`${PREFIX}:downloadUpdate`, () => this.downloadUpdate());
    ipcMain.handle(`${PREFIX}:installUpdate`, () => this.installUpdate());
    ipcMain.handle(`${PREFIX}:getUpdateState`, () => this.getUpdateState());
    logger.info('AutoUpdaterController handlers registered');
  }
  async getAppVersion(): Promise<string> {
    return this.service.getAppVersion();
  }
  async checkForUpdates(): Promise<{
    version: string;
    releaseDate: string;
    releaseNotes?: string | null;
  } | null> {
    const result = await this.service.checkForUpdates();
    if (!result) return null;
    return {
      version: result.version,
      releaseDate: result.releaseDate,
      releaseNotes:
        typeof result.releaseNotes === 'string' ? result.releaseNotes : null,
    };
  }
  async downloadUpdate(): Promise<void> {
    return this.service.downloadUpdate();
  }
  async installUpdate(): Promise<void> {
    this.service.installUpdate();
  }
  async getUpdateState(): Promise<UpdateState> {
    return this.service.getUpdateState();
  }
}
