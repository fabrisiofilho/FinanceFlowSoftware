import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path'),
  fs = require('fs'),
  ts = require('typescript'),
  vm = require('vm');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const __dirname = path.join(root, '.qa');
fs.mkdirSync(__dirname, { recursive: true });
app.setPath('userData', path.join(__dirname, 'ui-loading-user-data'));
const configuration = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      path.join(root, 'src/preload/controller-config.ts'),
      'utf8',
    ),
    { compilerOptions: { module: 1 } },
  ).outputText,
  { exports: configuration },
);
for (const { prefix, methods } of Object.values(
  configuration.CONTROLLER_CONFIG,
))
  for (const method of methods)
    ipcMain.handle(`${prefix}:${method}`, async (_, ...args) => {
      if (prefix === 'investment' && method === 'list')
        return {
          success: true,
          data: {
            investments: [
              {
                id: 1,
                userId: 1,
                name: 'CDB Reserva',
                kind: 'CDB',
                principalCents: 3000000,
                startMonth: '2026-01',
                monthlyRate: 0.8,
              },
            ],
            yields: [
              { id: 1, investmentId: 1, month: '2026-10', amountCents: 20000 },
            ],
          },
        };
      if (prefix === 'autoUpdater')
        return method === 'getAppVersion' ? '1.0.0' : { status: 'idle' };
      if (prefix === 'notification' && method === 'getSummary')
        return { success: true, data: { total: 2, unread: 1 } };
      if (prefix === 'notification' && method === 'findAll')
        return {
          success: true,
          data: [
            {
              id: 1,
              title: 'Revisão do orçamento',
              message: 'Confira seus gastos de alimentação neste mês.',
              createdAt: new Date(),
              isRead: false,
            },
            {
              id: 2,
              title: 'Bem-vindo ao Contabily',
              message: 'Conheça os recursos no manual do sistema.',
              createdAt: new Date(),
              isRead: true,
            },
          ],
        };
      if (prefix === 'budget' && method === 'getSummary')
        return {
          success: true,
          data: {
            budgets: [],
            totalPlanned: 0,
            totalSpent: 0,
            totalRemaining: 0,
            overallPercentUsed: 0,
          },
        };
      if (prefix === 'cashFlow' && method === 'getProjection')
        return {
          success: true,
          data: {
            currentBalance: 3800,
            projectedBalance: 4200,
            totalIncome: 5000,
            totalExpenses: 1200,
            projections: [],
            dailyBalances: [],
            netCashFlow: 400,
            alerts: [],
          },
        };
      if (prefix === 'report' && method === 'generateReport') {
        const type = args[0]?.type;
        await new Promise((r) =>
          setTimeout(
            r,
            type === 'income' ? 750 : type === 'expense' ? 350 : 25,
          ),
        );
        return {
          success: true,
          data: {
            summary: {
              totalIncome: type === 'expense' ? 8000 : 5000,
              totalExpenses: 1200,
              balance: 3800,
              transactionCount: 2,
              expensesByCategory: [
                {
                  categoryId: 1,
                  categoryName: 'Moradia',
                  totalAmount: 1200,
                  percentage: 100,
                },
              ],
            },
            incomeVsExpenses: [
              {
                year: 2026,
                month: 11,
                income: 5000,
                expense: 1200,
                balance: 3800,
              },
            ],
          },
        };
      }
      if (prefix === 'advancedReport' && method === 'financialHealth')
        return {
          success: true,
          data: {
            score: 70,
            savingsRate: 24,
            expenseToIncomeRatio: 76,
            budgetAdherence: 100,
            emergencyFundMonths: 2,
            recommendations: [
              'Reserve parte de seus ganhos para uma reserva de emergência.',
            ],
          },
        };
      if (method === 'getCurrentUser')
        return {
          success: true,
          data: { id: 1, name: 'Demonstração', email: 'demo@example.test' },
        };
      if (method === 'getMonthSummary')
        return {
          success: true,
          data: {
            totalIncome: 5000,
            totalExpenses: 1200,
            balance: 3800,
            expensesByCategory: [],
          },
        };
      if (method === 'getTotalBalance') return { success: true, data: 3800 };
      if (prefix === 'transaction' && method === 'findAll')
        return {
          success: true,
          data: { content: [], totalElements: 0, totalPages: 0 },
        };
      return { success: true, data: [] };
    });
app
  .whenReady()
  .then(async () => {
    const window = new BrowserWindow({
      show: false,
      width: 1440,
      height: 960,
      frame: false,
      webPreferences: {
        preload: path.join(root, 'out/preload/index.js'),
        contextIsolation: true,
        sandbox: false,
        backgroundThrottling: false,
        offscreen: true,
      },
    });
    window.webContents.on('preload-error', (_, file, error) =>
      console.log('preload', error.message),
    );
    const errors = [];
    window.webContents.on('console-message', (_, level, message) => {
      if (level >= 3) errors.push(message);
    });
    window.webContents.on('render-process-gone', (_, detail) =>
      errors.push(detail.reason),
    );

    await window.loadFile(path.join(root, 'out/renderer/index.html'));
    await new Promise((r) => setTimeout(r, 900));
    fs.writeFileSync(
      path.join(__dirname, 'neutral-opening.png'),
      (await window.webContents.capturePage()).toPNG(),
    );
    await new Promise((r) => setTimeout(r, 2400));

    const run = (code) => window.webContents.executeJavaScript(code);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const assert = (value, message) => {
      if (!value) throw new Error(message);
      console.log('OK', message);
    };
    for (const route of [
      'dashboard',
      'investments',
      'accounts',
      'categories',
      'goals',
      'credit-cards',
      'alerts',
      'transactions',
      'reports',
      'budget',
      'transfers',
      'recurring',
      'advanced-reports',
      'cash-flow',
      'bank-import',
      'manual',
    ]) {
      await run("location.hash='/panel/" + route + "'");
      await sleep(700);
      const state = await run(
        "({title:document.querySelector('[data-page-header] h1')?.textContent,emptyErrors:Array.from(document.querySelectorAll('[role=alert]')).filter(e=>!e.textContent.trim()).length})",
      );
      console.log(route, state);
      assert(!!state.title, 'cabeçalho ' + route);
      assert(!state.emptyErrors, 'sem alerta vazio ' + route);
    }
    await run("location.hash='/panel/reports'");
    await sleep(600);
    await run(
      "window.qaHeader=document.querySelector('[data-page-header]');window.qaCards=Array.from(document.querySelectorAll('[data-card-skeleton]')).map(s=>({node:s.parentElement,width:s.parentElement.getBoundingClientRect().width,height:s.parentElement.getBoundingClientRect().height}));",
    );
    const select = async (value) => {
      await run(
        "Array.from(document.querySelectorAll('[role=combobox]')).at(-1).dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
      );
      await sleep(40);
      await run(
        'document.querySelector(\'[role=option][data-value="' +
          value +
          '"]\').click()',
      );
    };
    await select('income');
    await sleep(220);
    const during = await run(
      "({header:window.qaHeader===document.querySelector('[data-page-header]'),headerSkeletons:window.qaHeader.querySelectorAll('.MuiSkeleton-root').length,dimensions:qaCards.every(c=>c.node.isConnected&&Math.abs(c.node.getBoundingClientRect().height-c.height)<1&&Math.abs(c.node.getBoundingClientRect().width-c.width)<1),busy:document.querySelectorAll('[aria-busy=true][class*=MuiPaper]').length})",
    );
    console.log('during filter', during);
    assert(
      during.header &&
        !during.headerSkeletons &&
        during.dimensions &&
        during.busy > 0,
      'filtro mantém cabeçalho e dimensões dos cards',
    );
    fs.writeFileSync(
      path.join(__dirname, 'stable-loading-reports.png'),
      (await window.webContents.capturePage()).toPNG(),
    );
    await select('expense');
    await sleep(1000);
    assert(
      await run("document.body.innerText.includes('8.000,00')"),
      'resposta antiga não sobrescreve filtro atual',
    );
    assert(
      await run(
        "window.qaHeader===document.querySelector('[data-page-header]')&&qaCards.every(c=>c.node.isConnected&&Math.abs(c.node.getBoundingClientRect().height-c.height)<1)",
      ),
      'mesmos elementos após atualização',
    );
    fs.writeFileSync(
      path.join(__dirname, 'stable-reports.png'),
      (await window.webContents.capturePage()).toPNG(),
    );
    await select('');
    await sleep(70);
    assert(
      await run(
        "document.querySelectorAll('[aria-busy=true][class*=MuiPaper]').length===0",
      ),
      'consulta rápida não pisca skeleton',
    );
    await sleep(300);
    await run("location.hash='/login'");
    await sleep(1000);
    const trace = await run(
      "(()=>{const trail=document.querySelector('path[pathLength]');const point=trail.parentElement.querySelector('circle');const progress=Number(trail.getAttribute('stroke-dasharray').split(' ')[0])-Number(trail.getAttribute('stroke-dashoffset'));const end=trail.getPointAtLength(trail.getTotalLength()*progress);return Math.hypot(end.x-Number(point.getAttribute('cx')),end.y-Number(point.getAttribute('cy')));})()",
    );
    assert(trace < 0.1, 'ponto e fim do rastro coincidem');
    const button = await run(
      "(()=>{const b=document.querySelector('button[type=submit]');return {background:getComputedStyle(b).backgroundColor,color:getComputedStyle(b).color}})()",
    );
    assert(
      button.background === 'rgb(155, 217, 181)' &&
        button.color === 'rgb(16, 34, 25)',
      'botão do login usa o padrão menta com texto escuro',
    );
    const position = await run(
      "(()=>{const r=document.querySelector('button[type=submit]').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()",
    );
    window.webContents.sendInputEvent({ type: 'mouseMove', ...position });
    await sleep(250);
    const hover = await run(
      "(()=>{const b=document.querySelector('button[type=submit]');return {background:getComputedStyle(b).backgroundColor,color:getComputedStyle(b).color}})()",
    );
    assert(
      hover.background === 'rgb(181, 231, 202)' && hover.color === button.color,
      'hover mantém contraste do texto',
    );
    fs.writeFileSync(
      path.join(__dirname, 'stable-login.png'),
      (await window.webContents.capturePage()).toPNG(),
    );
    assert(!errors.length, 'sem falha de renderer');
    window.destroy();
    app.quit();
  })
  .catch((e) => {
    console.error(e);
    app.exit(1);
  });
