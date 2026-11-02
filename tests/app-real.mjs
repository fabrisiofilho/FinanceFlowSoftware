import Module, { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const { app, BrowserWindow } = require('electron');
const root = process.cwd(),
  directory = fs.mkdtempSync(path.join(root, '.qa', 'app-real-'));
app.setPath('userData', directory);
app.setPath('documents', directory);
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith('@main/'))
    request = path.resolve('src/main', request.slice(6));
  if (request.startsWith('@shared/'))
    request = path.resolve('src/shared', request.slice(8));
  return originalResolve.call(this, request, ...args);
};
Module._extensions['.ts'] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: 1,
        target: 9,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
process.env.NODE_ENV = 'development';
const start = performance.now();
let win;
void (async () => {
  try {
    await app.whenReady();
    const db = require('../src/main/infrastructure/database/data-source.ts');
    db.setDatabasePath(path.join(directory, 'test.sqlite'));
    await db.initializeDatabase();
    require('../src/main/application/controllers/config/index.ts').loadIpcControllers();
    win = new BrowserWindow({
      show: false,
      width: 1400,
      height: 1000,
      webPreferences: {
        preload: path.join(root, 'out/preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
        offscreen: true,
      },
    });
    const errors = [];
    win.webContents.on('console-message', (_, level, message) => {
      if (level >= 3) errors.push(message);
    });
    const invoke = (controller, method, ...args) =>
      win.webContents.executeJavaScript(
        `window.electronAPI[${JSON.stringify(controller)}][${JSON.stringify(method)}](...${JSON.stringify(args)})`,
      );
    const ok = (response) => {
      assert.equal(response.success, true, response.error);
      return response.data;
    };
    await win.loadFile(path.join(root, 'out/renderer/index.html'));
    ok(
      await invoke('financeAuth', 'register', {
        name: 'Homologação fictícia',
        email: 'real-app@example.test',
        password: 'Ficticio-12345!',
      }),
    );
    ok(
      await invoke(
        'financeAuth',
        'login',
        'real-app@example.test',
        'Ficticio-12345!',
      ),
    );
    const account = ok(
      await invoke('account', 'create', {
        name: 'Conta fictícia',
        type: 'checking',
        balance: 10000,
      }),
    );
    const categories = ok(await invoke('category', 'findAll'));
    const expense = categories.find((c) => c.type === 'expense'),
      income = categories.find((c) => c.type === 'income');
    assert.ok(expense && income, 'Categorias padrão');
    const civil = '2026-11-02';
    ok(
      await invoke('transaction', 'create', {
        description: 'Receita fictícia',
        amount: 5000,
        type: 'income',
        accountId: account.id,
        categoryId: income.id,
        transactionDate: civil,
        status: 'settled',
        settlementDate: civil,
      }),
    );
    ok(
      await invoke('transaction', 'create', {
        description: 'Despesa fictícia',
        amount: 1200,
        type: 'expense',
        accountId: account.id,
        categoryId: expense.id,
        transactionDate: civil,
        status: 'settled',
        settlementDate: civil,
      }),
    );
    const summary = ok(
      await invoke('transaction', 'getMonthSummary', 2026, 11),
    );
    const query = {
      startDate: '2026-11-01',
      endDateExclusive: '2026-12-01',
      basis: 'settlement',
    };
    const report = ok(
      await invoke('advancedReport', 'queryV2', 'history', query),
    );
    assert.equal(
      report.rows[0].incomeCents - report.rows[0].expenseCents,
      380000,
    );
    const pdf = ok(
      await invoke('report', 'generatePDF', {
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      }),
    );
    assert.equal(pdf.success, true, pdf.errorMessage);
    assert.equal(
      fs.readFileSync(pdf.filePath).subarray(0, 5).toString(),
      '%PDF-',
    );
    const initialMemory = app.getAppMetrics().map((m) => ({
      type: m.type,
      workingSetKb: m.memory.workingSetSize,
      privateKb: m.memory.privateBytes,
    }));
    await win.loadFile(path.join(root, 'out/renderer/index.html'));
    const waitFor = async (fn, timeout = 15000) => {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        if (await fn()) return;
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error('Timeout esperando tela real');
    };
    await waitFor(() =>
      win.webContents.executeJavaScript("!!document.querySelector('h1')"),
    );
    await win.webContents.executeJavaScript(
      "location.hash='#/panel/advanced-reports'",
    );
    await waitFor(() =>
      win.webContents.executeJavaScript(
        "document.body.innerText.includes('Relatórios avançados')",
      ),
    );
    await waitFor(() =>
      win.webContents.executeJavaScript(
        "!document.body.innerText.includes('Pular abertura')",
      ),
    );
    await new Promise((r) => setTimeout(r, 300));
    fs.writeFileSync(
      path.join(root, '.qa', 'roadmap-2026-11-02', 'advanced-reports-real.png'),
      (await win.webContents.capturePage()).toPNG(),
    );
    await win.webContents.executeJavaScript(
      "window.dispatchEvent(new CustomEvent('quick-transaction',{detail:'expense'}))",
    );
    await waitFor(() =>
      win.webContents.executeJavaScript(
        "!!document.querySelector('[role=dialog]')",
      ),
    );
    await new Promise((r) => setTimeout(r, 400));
    assert.equal(
      await win.webContents.executeJavaScript(
        "location.hash.includes('advanced-reports')",
      ),
      true,
    );
    fs.writeFileSync(
      path.join(
        root,
        '.qa',
        'roadmap-2026-11-02',
        'quick-transaction-real.png',
      ),
      (await win.webContents.capturePage()).toPNG(),
    );
    await win.webContents.executeJavaScript(
      "document.querySelector('[role=dialog] button:last-child')?.focus()",
    );
    const diagnostics = ok(await invoke('diagnostics', 'snapshot'));
    assert.ok(diagnostics.sqliteBytes > 0);
    const result = {
      startupToDataReadyMs: performance.now() - start,
      initialMemory,
      diagnostics: { ...diagnostics, dataDirectory: '[isolated]' },
      summary,
      rendererErrors: errors,
    };
    fs.writeFileSync(
      path.join(root, '.qa', 'roadmap-2026-11-02', 'app-real.json'),
      JSON.stringify(result, null, 2),
    );
    console.log(
      'Aplicativo real: IPC autenticado, SQLite, resultado R$3800, PDF verdadeiro, rota preservada e diagnóstico: OK',
    );
    win.destroy();
    await db.closeDatabase();
    app.quit();
  } catch (e) {
    console.error(e);
    win?.destroy();
    app.exit(1);
  }
})();
