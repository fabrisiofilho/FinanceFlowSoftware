import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('updater usa canal próprio, transmite estados e exige download antes de instalar', async () => {
  const updater = new EventEmitter();
  const messages = [];
  let provider,
    downloads = 0,
    installs = 0,
    checks = 0;
  const info = {
    version: '2.1.0',
    releaseDate: '2026-11-03',
    releaseNotes: 'Teste',
  };
  updater.setFeedURL = (value) => {
    provider = value;
  };
  updater.checkForUpdates = async () => {
    checks++;
    updater.emit('checking-for-update');
    updater.emit('update-available', info);
    return { updateInfo: info };
  };
  updater.downloadUpdate = async () => {
    downloads++;
    updater.emit('download-progress', { percent: 50 });
    updater.emit('update-downloaded', info);
  };
  updater.quitAndInstall = () => {
    installs++;
  };
  const app = { isPackaged: true, getVersion: () => '2.0.0' };
  const exports = {};
  const require = (name) =>
    name === 'electron'
      ? {
          app,
          BrowserWindow: {
            getAllWindows: () => [
              {
                isDestroyed: () => false,
                webContents: {
                  send: (channel, state) => messages.push([channel, state]),
                },
              },
            ],
          },
        }
      : { autoUpdater: updater };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        'src/main/infrastructure/auto-updater/auto-updater-service.ts',
        'utf8',
      ),
      { compilerOptions: { module: 1 } },
    ).outputText,
    { exports, require },
  );
  const service = exports.AutoUpdaterService.getInstance();
  assert.equal(provider.repo, 'contabily');
  assert.equal(provider.owner, 'fabrisiofilho');
  assert.equal(updater.autoDownload, false);
  assert.equal(updater.allowDowngrade, false);
  assert.throws(() => service.installUpdate());
  await assert.rejects(() => service.downloadUpdate());
  app.isPackaged = false;
  assert.equal(await service.checkForUpdates(), null);
  assert.equal(checks, 0);
  app.isPackaged = true;
  await service.checkForUpdates();
  assert.equal(service.getUpdateState().status, 'available');
  await service.downloadUpdate();
  assert.equal(downloads, 1);
  assert.equal(service.getUpdateState().status, 'downloaded');
  assert.equal(await service.checkForUpdates(), null);
  service.installUpdate();
  assert.equal(installs, 1);
  assert.ok(
    messages.every(([channel]) => channel === 'autoUpdater:statusUpdate'),
  );
  updater.emit('error', new Error('Falha de rede'));
  assert.equal(service.getUpdateState().status, 'error');
  assert.throws(() => service.installUpdate());
});
