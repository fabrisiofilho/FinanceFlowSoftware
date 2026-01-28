import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { app, BrowserWindow } from 'electron';
import { logger } from '@main/infrastructure/log/logger';
import {
  UpdateState,
  UpdateStatus,
} from '@shared/interfaces/types/auto-updater.types';
const AUTO_UPDATER_ENABLED = false;
export class AutoUpdaterService {
  private static instance: AutoUpdaterService;
  private mainWindow: BrowserWindow | null = null;
  private state: UpdateState = { status: 'idle' };
  private periodicCheckInterval: NodeJS.Timeout | null = null;
  private readonly enabled: boolean = AUTO_UPDATER_ENABLED;
  private constructor() {
    if (!this.enabled) {
      logger.info('AutoUpdater is disabled - skipping configuration');
      return;
    }
    this.configureAutoUpdater();
    this.setupEventHandlers();
  }
  static getInstance(): AutoUpdaterService {
    if (!AutoUpdaterService.instance) {
      AutoUpdaterService.instance = new AutoUpdaterService();
    }
    return AutoUpdaterService.instance;
  }
  private configureAutoUpdater(): void {
    autoUpdater.allowDowngrade = true;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger = {
      info: (message) => logger.info('[AutoUpdater]', message),
      warn: (message) => logger.warning('[AutoUpdater]', message),
      error: (message) => logger.error('[AutoUpdater]', message),
      debug: (message) => logger.debug('[AutoUpdater]', message),
    };
    logger.info('AutoUpdater configured with allowDowngrade=true');
  }
  private setupEventHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...');
      this.updateState('checking');
    });
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      logger.info('Update available:', info.version);
      this.updateState('available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes as string | null,
      });
    });
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      logger.info('No updates available. Current version:', info.version);
      this.updateState('not-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes as string | null,
      });
    });
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      logger.debug(
        `Download progress: ${progress.percent.toFixed(1)}% (${progress.transferred}/${progress.total})`,
      );
      this.state = {
        ...this.state,
        status: 'downloading',
        progress: {
          bytesPerSecond: progress.bytesPerSecond,
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
        },
      };
      this.sendStatusToRenderer();
    });
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      logger.success('Update downloaded:', info.version);
      this.updateState('downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes as string | null,
      });
    });
    autoUpdater.on('error', (error: Error) => {
      logger.error('AutoUpdater error:', error.message);
      this.state = {
        status: 'error',
        error: error.message,
        info: this.state.info,
      };
      this.sendStatusToRenderer();
    });
  }
  private updateState(status: UpdateStatus, info?: UpdateState['info']): void {
    this.state = {
      status,
      info: info || this.state.info,
      progress: undefined,
      error: undefined,
    };
    this.sendStatusToRenderer();
  }
  private sendStatusToRenderer(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('autoUpdater:statusUpdate', this.state);
    }
  }
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }
  getAppVersion(): string {
    return app.getVersion();
  }
  async checkForUpdates(): Promise<UpdateInfo | null> {
    if (!this.enabled) {
      logger.debug('AutoUpdater disabled - skipping update check');
      return null;
    }
    try {
      logger.info('Manually checking for updates...');
      const result = await autoUpdater.checkForUpdates();
      return result?.updateInfo || null;
    } catch (error) {
      logger.error('Failed to check for updates:', error);
      throw error;
    }
  }
  async downloadUpdate(): Promise<void> {
    if (!this.enabled) {
      logger.debug('AutoUpdater disabled - skipping download');
      return;
    }
    try {
      logger.info('Starting update download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('Failed to download update:', error);
      throw error;
    }
  }
  installUpdate(): void {
    if (!this.enabled) {
      logger.debug('AutoUpdater disabled - skipping install');
      return;
    }
    logger.info('Installing update and restarting...');
    autoUpdater.quitAndInstall(false, true);
  }
  getUpdateState(): UpdateState {
    return this.state;
  }
  isEnabled(): boolean {
    return this.enabled;
  }
  startPeriodicCheck(intervalHours: number = 4): void {
    if (!this.enabled) {
      logger.debug('AutoUpdater disabled - skipping periodic check');
      return;
    }
    this.stopPeriodicCheck();
    const intervalMs = intervalHours * 60 * 60 * 1000;
    setTimeout(() => {
      this.checkForUpdates().catch((err) =>
        logger.error('Periodic update check failed:', err),
      );
    }, 10000);
    this.periodicCheckInterval = setInterval(() => {
      this.checkForUpdates().catch((err) =>
        logger.error('Periodic update check failed:', err),
      );
    }, intervalMs);
    logger.info(`Periodic update check started (every ${intervalHours} hours)`);
  }
  stopPeriodicCheck(): void {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
      logger.info('Periodic update check stopped');
    }
  }
}
