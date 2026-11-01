import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('controles pertencem à janela solicitante e removem listeners ao fechar', () => {
  const ipcMain = new EventEmitter();
  const window = new EventEmitter();
  window.webContents = { mainFrame: {} };
  const calls = [];
  let maximized = false;
  window.minimize = () => calls.push('minimize');
  window.maximize = () => {
    maximized = true;
    calls.push('maximize');
  };
  window.unmaximize = () => {
    maximized = false;
    calls.push('restore');
  };
  window.isMaximized = () => maximized;
  window.close = () => calls.push('close');
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync('src/main/infrastructure/boot/window-controls.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(code, { exports, require: () => ({ ipcMain }) });
  exports.registerWindowControls(window);
  const event = {
    sender: window.webContents,
    senderFrame: window.webContents.mainFrame,
  };
  ipcMain.emit('window:control', { sender: {} }, 'close');
  ipcMain.emit('window:control', { ...event, senderFrame: {} }, 'close');
  ipcMain.emit('window:control', event, 'unknown');
  assert.deepEqual(calls, []);
  for (const action of [
    'minimize',
    'toggle-maximize',
    'toggle-maximize',
    'close',
  ])
    ipcMain.emit('window:control', event, action);
  assert.deepEqual(calls, ['minimize', 'maximize', 'restore', 'close']);
  window.emit('closed');
  assert.equal(ipcMain.listenerCount('window:control'), 0);
});
