import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('IPC privado exige sessão, janela do aplicativo e frame principal', async () => {
  let actor = null,
    calls = 0;
  const registered = new Map();
  const exports = {};
  const source = fs.readFileSync(
    'src/main/application/controllers/config/base-handler.ts',
    'utf8',
  );
  const dependencies = {
    electron: {
      ipcMain: {
        handle: (channel, callback) => registered.set(channel, callback),
      },
      BrowserWindow: {
        fromWebContents: (sender) => (sender.trusted ? {} : null),
      },
    },
    '../../services/finance-auth-service': {
      FinanceAuthService: {
        getInstance: () => ({ getCurrentUserId: () => actor }),
      },
    },
    '@main/infrastructure/log/logger': { logger: { info: () => {} } },
    '@main/infrastructure/decorators/ipc.decorator': {
      getIpcMethods: () => [{ methodName: 'read', channel: 'account:findAll' }],
    },
  };
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: 1, target: 9 } })
      .outputText,
    {
      exports,
      require: (name) => {
        if (!(name in dependencies)) throw new Error(name);
        return dependencies[name];
      },
    },
  );
  class Controller extends exports.BaseHandler {
    async read() {
      calls++;
      return { success: true };
    }
  }
  new Controller();
  const invoke = registered.get('account:findAll');
  const frame = {};
  const sender = { trusted: true, mainFrame: frame };
  assert.equal((await invoke({ sender, senderFrame: frame })).success, false);
  assert.equal(calls, 0);
  actor = 1;
  assert.equal((await invoke({ sender, senderFrame: {} })).success, false);
  assert.equal(
    (
      await invoke({
        sender: { ...sender, trusted: false },
        senderFrame: frame,
      })
    ).success,
    false,
  );
  assert.equal(calls, 0);
  assert.equal((await invoke({ sender, senderFrame: frame })).success, true);
  assert.equal(calls, 1);
});
