import { app, BrowserWindow } from 'electron';
import { autoUpdater, type UpdateInfo } from 'electron-updater';
import type { UpdateState } from '@shared/interfaces/types/auto-updater.types';

/** Canal próprio do Contabily. */
export class AutoUpdaterService {
  private static instance: AutoUpdaterService;
  private state: UpdateState = { status: 'idle' };
  private constructor() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'fabrisiofilho',
      repo: 'contabily',
    });
    autoUpdater.on('checking-for-update', () =>
      this.update({ status: 'checking' }),
    );
    autoUpdater.on('update-not-available', () =>
      this.update({ status: 'not-available' }),
    );
    autoUpdater.on('update-available', (info) =>
      this.update({ status: 'available', info: this.info(info) }),
    );
    autoUpdater.on('download-progress', (progress) =>
      this.update({ ...this.state, status: 'downloading', progress }),
    );
    autoUpdater.on('update-downloaded', (info) =>
      this.update({ status: 'downloaded', info: this.info(info) }),
    );
    autoUpdater.on('error', (error) =>
      this.update({ status: 'error', error: error.message }),
    );
  }
  private info(info: UpdateInfo) {
    return {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes:
        typeof info.releaseNotes === 'string' ? info.releaseNotes : null,
    };
  }
  private update(state: UpdateState): void {
    this.state = state;
    for (const window of BrowserWindow.getAllWindows())
      if (!window.isDestroyed())
        window.webContents.send('autoUpdater:statusUpdate', state);
  }

  static getInstance(): AutoUpdaterService {
    AutoUpdaterService.instance ??= new AutoUpdaterService();
    return AutoUpdaterService.instance;
  }

  getAppVersion(): string {
    return app.getVersion();
  }

  async checkForUpdates(): Promise<UpdateInfo | null> {
    if (
      !app.isPackaged ||
      ['checking', 'downloading', 'downloaded'].includes(this.state.status)
    )
      return null;
    return (await autoUpdater.checkForUpdates())?.updateInfo ?? null;
  }

  async downloadUpdate(): Promise<void> {
    if (this.state.status !== 'available')
      throw new Error(
        'Verifique a disponibilidade de uma atualização primeiro.',
      );
    await autoUpdater.downloadUpdate();
  }

  installUpdate(): void {
    if (this.state.status !== 'downloaded')
      throw new Error('Aguarde o download completo da atualização.');
    autoUpdater.quitAndInstall();
  }

  getUpdateState(): UpdateState {
    return this.state;
  }
}
