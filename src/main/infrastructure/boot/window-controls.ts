import { BrowserWindow, ipcMain, type IpcMainEvent } from 'electron';

/** Cada janela aceita comandos apenas do seu próprio renderer. */
export function registerWindowControls(window: BrowserWindow): void {
  const listener = (event: IpcMainEvent, action: unknown): void => {
    if (
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame
    )
      return;
    switch (action) {
      case 'minimize':
        window.minimize();
        break;
      case 'toggle-maximize':
        if (window.isMaximized()) window.unmaximize();
        else window.maximize();
        break;
      case 'close':
        window.close();
        break;
    }
  };
  ipcMain.on('window:control', listener);
  window.once('closed', () =>
    ipcMain.removeListener('window:control', listener),
  );
}
