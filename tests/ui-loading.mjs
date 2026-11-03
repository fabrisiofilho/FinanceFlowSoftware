import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path'),
  fs = require('fs'),
  ts = require('typescript'),
  vm = require('vm');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = process.env.CONTABILY_QA_APP_ROOT || root;
const __dirname = path.join(root, '.qa');
fs.mkdirSync(__dirname, { recursive: true });
app.setPath('userData', path.join(__dirname, 'ui-loading-user-data'));
const configuration = {};
const requests = [];
let guideCompleted = false;
const accountRows = Array.from({ length: 30 }, (_, index) => ({
  id: 1000 + index,
  name: 'Conta paginada ' + index,
  type: 'checking',
  balance: index === 0 ? 3800 : 0,
  cardColor: '#00bcd4',
  imageData:
    index === 29
      ? 'data:image/png;base64,' +
        fs.readFileSync(path.join(root, 'build/icon.png')).toString('base64')
      : null,
}));
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
      requests.push({ prefix, method, input: args[0] });
      if (prefix === 'advancedReport' && method === 'queryV2')
        return {
          success: true,
          data: {
            panel: args[0],
            query: args[1],
            methodology: 'Consulta de teste isolada',
            rows: [],
            health:
              args[0] === 'health'
                ? {
                    score: null,
                    savingsRate: null,
                    expenseToIncomeRatio: null,
                    budgetAdherence: null,
                    emergencyFundMonths: null,
                    sampleSize: 0,
                    completeMonths: 0,
                    budgetExcessCents: 0,
                    recommendations: [],
                  }
                : undefined,
          },
        };
      if (prefix === 'financing' && method === 'list')
        return { success: true, data: { contracts: [], total: 0 } };
      if (prefix === 'diagnostics')
        return {
          success: true,
          data: {
            version: '2.8.0',
            electron: '38',
            chromium: '140',
            uptimeSeconds: 1,
            initializationMs: 100,
            mainHeapBytes: 100,
            processes: [],
            sqliteBytes: 100,
            walBytes: 0,
            shmBytes: 0,
            attachmentBytes: 0,
            cacheBytes: 0,
            dataDirectory: '[teste]',
            queryMs: 1,
          },
        };
      if (prefix === 'externalData')
        return {
          success: true,
          data: {
            nextRefreshAt: null,
            indicators: ['usd', 'eur', 'selic', 'cdi', 'ipca'].map(
              (id, index) => ({
                id,
                status: id === 'eur' ? 'cached' : 'fresh',
                checkedAt: '2026-11-02T12:00:00Z',
                error:
                  id === 'eur'
                    ? 'Exibindo a última consulta salva.'
                    : undefined,
                points:
                  id === 'ipca'
                    ? Array.from({ length: 12 }, (_, month) => {
                        const d = new Date(2025, 10 + month, 1);
                        return {
                          date:
                            d.getFullYear() +
                            '-' +
                            String(d.getMonth() + 1).padStart(2, '0') +
                            '-01',
                          value: 0.5,
                        };
                      })
                    : [
                        { date: '2026-10-29', value: [5, 6, 10, 0.04][index] },
                        { date: '2026-10-30', value: [5, 6, 10, 0.04][index] },
                      ],
              }),
            ),
          },
        };
      if (prefix === 'category' && ['findAll', 'findByType'].includes(method))
        return {
          success: true,
          data: [
            {
              id: 100,
              name: 'Alimentação',
              type: 'expense',
              icon: 'Restaurant',
            },
            { id: 101, name: 'Salário', type: 'income', icon: 'Payments' },
            {
              id: 102,
              name: 'Transporte',
              type: 'expense',
              icon: 'DirectionsCar',
            },
          ],
        };
      if (prefix === 'category' && method === 'create')
        return {
          success: true,
          data: { id: 600, ...args[0], isDefault: false },
        };
      if (prefix === 'account' && method === 'findAll')
        return { success: true, data: accountRows };
      if (prefix === 'account' && method === 'create')
        return {
          success: true,
          data: {
            id: 601,
            ...args[0],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      if (prefix === 'onboarding')
        return {
          success: true,
          data: {
            step: guideCompleted ? 5 : 0,
            completed: guideCompleted,
            ready: guideCompleted,
          },
        };
      if (prefix === 'listing') {
        const query = args[0],
          rows = (
            query.kind === 'accounts'
              ? accountRows
              : query.kind === 'categories'
                ? [
                    {
                      id: 100,
                      name: 'Alimentação',
                      type: 'expense',
                      isDefault: true,
                      icon: 'Restaurant',
                    },
                    {
                      id: 101,
                      name: 'Salário',
                      type: 'income',
                      isDefault: true,
                      icon: 'Payments',
                    },
                  ]
                : []
          ).filter(
            (row) =>
              (!query.search || row.name.includes(query.search)) &&
              (!query.types?.length || query.types.includes(row.type)),
          );
        const page = query.page ?? 0,
          size = query.size ?? 24;
        return {
          success: true,
          data: {
            content: rows.slice(page * size, (page + 1) * size),
            page,
            size,
            totalElements: rows.length,
            totalPages: Math.ceil(rows.length / size),
          },
        };
      }
      if (prefix === 'investment' && ['list', 'query'].includes(method))
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
            page: 0,
            totalElements: 1,
            totalPages: 1,
            summary: {
              principalCents: 3000000,
              yieldCents: 20000,
              balanceCents: 3020000,
            },
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
        const type =
          args[0]?.types?.length === 1 ? args[0].types[0] : args[0]?.type;
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
        preload: path.join(appRoot, 'out/preload/index.js'),
        contextIsolation: true,
        sandbox: true,
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

    await window.loadFile(path.join(appRoot, 'out/renderer/index.html'));
    await new Promise((r) => setTimeout(r, 900));
    const opening = await window.webContents.executeJavaScript(`(() => {
      const title = document.querySelector('[aria-label="Abrindo Contabily"] .MuiTypography-root');
      const logo = document.querySelector('[data-opening-logo] svg');
      return { title: title?.textContent, height: title?.getBoundingClientRect().height,
        font: title && parseFloat(getComputedStyle(title).fontSize),
        overflow: title && getComputedStyle(title).overflow,
        animation: logo && getComputedStyle(logo).animationName };
    })()`);
    if (
      opening.title !== 'Contabily' ||
      opening.height < opening.font * 1.2 ||
      opening.overflow !== 'visible' ||
      !opening.animation ||
      opening.animation === 'none'
    )
      throw new Error(
        'Abertura deve preservar o nome completo e animar o símbolo da logo.',
      );
    console.log('OK logo animada e nome sem recorte na abertura');
    fs.writeFileSync(
      path.join(__dirname, 'neutral-opening.png'),
      (await window.webContents.capturePage()).toPNG(),
    );
    await new Promise((r) => setTimeout(r, 2400));

    const run = async (code) => {
      try {
        return await window.webContents.executeJavaScript(code);
      } catch (error) {
        console.error('Script QA:', code.slice(0, 300));
        console.error('Console QA:', errors.slice(-2));
        throw error;
      }
    };
    await run(
      'window.qaConfirmCount=0;window.confirm=()=>{window.qaConfirmCount++;return true;};true',
    );
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const assert = (value, message) => {
      if (!value) throw new Error(message);
      console.log('OK', message);
    };
    const checkChipIcons = async () =>
      run(`(() => {
      const luminance = color => {
        const channels = color.match(/[\\d.]+/g).slice(0,3).map(Number).map(value => { const channel=value/255; return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4; });
        return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
      };
      const icons=Array.from(document.querySelectorAll('.MuiChip-icon,.MuiChip-deleteIcon')).filter(icon=>icon.getClientRects().length);
      return icons.every(icon=>{
        const chip=icon.closest('.MuiChip-root'), style=getComputedStyle(icon);
        const layers=[];
        for(let node=chip;node;node=node.parentElement) layers.push(getComputedStyle(node).backgroundColor.match(/[\\d.]+/g).map(Number));
        const rgb=layers.reverse().reduce((base,layer)=>{const alpha=layer[3]??1;return base.map((channel,index)=>layer[index]*alpha+channel*(1-alpha));},[16,18,22]);
        const foreground=luminance(style.color), background=luminance('rgb('+rgb.join(',')+')');
        return style.fill===style.color && (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)>=3;
      });
    })()`);
    for (const route of [
      'dashboard',
      'investments',
      'external-data',
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
      'income-tax',
      'bank-import',
      'settings',
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
      assert(await checkChipIcons(), 'ícones de chips legíveis ' + route);
      if (['recurring', 'budget', 'transfers'].includes(route)) {
        const title = {
          recurring: 'Nova Recorrência',
          budget: 'Novo Orçamento',
          transfers: 'Nova Transferência',
        }[route];
        const prefix = {
          recurring: 'recurring',
          budget: 'budget',
          transfers: 'transfer',
        }[route];
        const before = requests.filter(
          (r) => r.prefix === prefix && r.method === 'create',
        ).length;
        await run(
          `Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='${title}').click()`,
        );
        await sleep(100);
        await run(
          "Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>['Salvar','Transferir'].includes(b.textContent)).click()",
        );
        await sleep(100);
        assert(
          await run(
            "document.querySelector('[role=dialog] [role=alert]')?.textContent.length>0",
          ),
          'cadastro vazio mostra erros em ' + route,
        );
        assert(
          requests.filter((r) => r.prefix === prefix && r.method === 'create')
            .length === before,
          'cadastro vazio não enviado em ' + route,
        );
        if (route === 'recurring') {
          assert(
            await run(
              "Array.from(document.querySelectorAll('[role=dialog] label')).some(l=>l.textContent.includes('Descrição')&&l.textContent.includes('*')) && document.querySelector('[role=dialog]').textContent.includes('Descrição é obrigatória.')",
            ),
            'recorrência exige descrição e identifica o campo',
          );
          await run(
            "Array.from(document.querySelectorAll('[role=dialog] label')).find(l=>l.textContent.includes('Regra mensal')).parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
          );
          await sleep(100);
          assert(
            await run(
              "document.body.innerText.includes('Primeiro dia útil do mês')&&document.body.innerText.includes('Último dia útil do mês')",
            ),
            'regras de dias úteis disponíveis',
          );
          await run(
            "Array.from(document.querySelectorAll('[role=option]')).find(o=>o.textContent==='Primeiro dia útil do mês').click()",
          );
          await sleep(100);
          assert(
            await run(
              "document.querySelector('[role=dialog]').textContent.includes('excluindo feriados nacionais')",
            ),
            'calendário nacional explicado no formulário',
          );
          fs.writeFileSync(
            path.join(__dirname, 'recurring-validation.png'),
            (await window.webContents.capturePage()).toPNG(),
          );
        }
        await run(
          "Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>b.textContent==='Cancelar').click()",
        );
        await sleep(100);
      }
      if (route === 'external-data') {
        assert(
          await run(
            "Array.from(document.querySelectorAll('a')).some(link=>link.textContent==='Dados externos'&&link.classList.contains('active'))",
          ),
          'dados externos disponíveis no menu',
        );
        assert(
          await run("document.body.innerText.includes('500,00')"),
          'conversor usa cotação da referência selecionada',
        );
        assert(
          await run("document.body.innerText.includes('Em cache')"),
          'consulta salva identificada',
        );
        await run(
          'document.querySelector(\'button[aria-label="Ver histórico de CDI diário"]\').click()',
        );
        await sleep(100);
        assert(
          await run(
            "document.querySelector('table').textContent.includes('% a.d.')",
          ),
          'CDI mantém unidade diária no histórico',
        );
        await run("document.querySelector('[data-chart-point]').focus()");
        await sleep(50);
        await run(
          "document.querySelector('[data-chart-point]').dispatchEvent(new FocusEvent('focusin',{bubbles:true}))",
        );
        await sleep(50);
        assert(
          await run(
            "document.querySelector('[data-chart-value]').textContent.includes('% a.d.') && document.querySelector('[data-chart-point]').getAttribute('aria-pressed')==='true'",
          ),
          'gráfico exibe data, valor e unidade ao focar um ponto',
        );
        await run(
          "Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Mostrar valores').click()",
        );
        await sleep(50);
        assert(
          await run(
            "document.querySelectorAll('[data-chart-point] text').length===2",
          ),
          'gráfico permite mostrar valores sobre a linha',
        );
        await run("document.querySelector('[data-chart-point]').focus()");
        await run(
          "document.querySelector('[data-chart-point]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))",
        );
        await sleep(50);
        assert(
          await run(
            "document.querySelectorAll('[data-chart-point]')[1].getAttribute('aria-pressed')==='true'",
          ),
          'setas do teclado consultam o próximo valor do gráfico',
        );
        await run(
          "document.querySelector('[data-chart-value]').scrollIntoView({block:'center'})",
        );
        await sleep(100);
        fs.writeFileSync(
          path.join(__dirname, 'external-chart-values.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
        await run(
          'document.querySelector(\'button[aria-label="Ver histórico de Dólar americano"]\').click()',
        );
        await sleep(100);
        fs.writeFileSync(
          path.join(__dirname, 'external-data.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
      }
      if (route === 'income-tax') {
        await run(
          "Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Calcular simulação').click()",
        );
        assert(
          await run("document.body.innerText.includes('Saldo zero')"),
          'simulação vazia não inventa imposto',
        );
        fs.writeFileSync(
          path.join(__dirname, 'v2-income-tax.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
      }
      if (route === 'settings')
        fs.writeFileSync(
          path.join(__dirname, 'v2-settings.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
      if (route === 'accounts') {
        assert(
          await run(
            'document.querySelectorAll(\'button[aria-label="Editar conta"]\').length===24',
          ),
          'board carrega só a primeira página',
        );
        await run(
          "document.getElementById('main-route-section').scrollTop=document.getElementById('main-route-section').scrollHeight",
        );
        await sleep(300);
        assert(
          await run(
            'document.querySelectorAll(\'button[aria-label="Editar conta"]\').length===30',
          ),
          'rolagem contínua carrega a próxima página',
        );
        assert(
          requests.some(
            (request) =>
              request.prefix === 'listing' &&
              request.input.kind === 'accounts' &&
              request.input.page === 1,
          ),
          'segunda página solicitada ao backend',
        );
        await run(
          "(()=>{const label=Array.from(document.querySelectorAll('label')).find(label=>label.textContent==='Buscar registros');const input=document.getElementById(label.htmlFor);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Conta paginada 29');input.dispatchEvent(new Event('input',{bubbles:true}));})()",
        );
        await sleep(450);
        assert(
          await run(
            'document.querySelectorAll(\'button[aria-label="Editar conta"]\').length===1',
          ),
          'busca no backend substitui as páginas anteriores',
        );
        assert(
          await run(
            "Array.from(document.images).some(image=>image.alt==='Conta paginada 29'&&image.naturalWidth>0)",
          ),
          'logo da conta renderizada',
        );
        fs.writeFileSync(
          path.join(__dirname, 'v2-accounts.png'),
          (await window.webContents.capturePage()).toPNG(),
        );

        assert(
          await run(
            'document.querySelectorAll(\'button[aria-label="Ampliar card"]\').length===0',
          ),
          'indicadores e contas sem expansão desnecessária',
        );
        await run(
          "Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Nova Conta').click()",
        );
        await sleep(150);
        assert(
          await run(
            "document.querySelector('[role=dialog]').textContent.includes('Cor de identificação')",
          ),
          'cor disponível em conta corrente',
        );
        await run(
          "Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Cancelar').click()",
        );
        await sleep(100);
      }
      if (route === 'dashboard') {
        assert(
          await run(
            "document.querySelector('[aria-label=\"Primeiros passos\"]')?.textContent.includes('Retomar guia')",
          ),
          'guia pendente aparece na visão geral',
        );
        await run(
          "Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Retomar guia').click()",
        );
        await sleep(150);
        assert(
          await run("location.hash.includes('/panel/accounts')"),
          'guia abre a tela da etapa',
        );
        assert(
          await run(
            "Array.from(document.querySelectorAll('[aria-label=\"Tour guiado\"] button')).find(button=>button.textContent==='Avançar').disabled",
          ),
          'guia exige cadastro antes de avançar',
        );
        for (let attempt = 0; attempt < 50; attempt++) {
          if (
            await run("document.querySelector('[data-tour-spotlight]')!==null")
          )
            break;
          await sleep(100);
        }
        assert(
          await run("document.querySelector('[data-tour-spotlight]')!==null"),
          'tour destaca o controle da tela',
        );
        assert(
          await checkChipIcons(),
          'estrelinha do tour tem contraste mínimo de 3:1',
        );
        assert(
          await run(`(() => {
          const panel=document.querySelector('[aria-label="Tour guiado"]');
          const chip=panel.querySelector('.MuiChip-root').getBoundingClientRect();
          const bounds=panel.getBoundingClientRect();
          const buttons=Array.from(panel.querySelectorAll('button')).filter(b=>['Voltar','Avançar'].includes(b.textContent));
          return Math.abs(chip.left+chip.width/2-bounds.left-bounds.width/2)<2 && Math.abs(buttons[0].getBoundingClientRect().width-buttons[1].getBoundingClientRect().width)<2 && !document.querySelector('[data-tour-connector]').hasAttribute('stroke-dasharray');
        })()`),
          'tour centraliza chip, equilibra botões e usa seta contínua',
        );
        await sleep(250);
        fs.writeFileSync(
          path.join(__dirname, 'tour-guided-account.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
        await run(
          "Array.from(document.querySelectorAll('[aria-label=\"Tour guiado\"] button')).find(button=>button.textContent==='Abrir cadastro').click()",
        );
        await sleep(250);
        assert(
          await run(
            "document.querySelector('[role=dialog]')!==null&&Number(document.querySelector('[data-tour-spotlight]').getAttribute('width'))>300",
          ),
          'tour acompanha o formulário em modal',
        );
        await run(
          "Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Cancelar').click()",
        );
        await sleep(100);
        assert(
          await run("document.querySelector('[data-guided-tour]')!==null"),
          'fechar formulário preserva o tour',
        );
        await run(
          "Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Continuar depois').click();location.hash='/panel/dashboard'",
        );
        await sleep(650);
        await run(
          'document.querySelector(\'button[aria-label="Ampliar card"]\').click()',
        );
        await sleep(180);
        assert(
          await run(
            "document.querySelector('[role=dialog]').textContent.includes('Buscar lançamentos')",
          ),
          'expansão útil usa listagem própria',
        );
        await run(
          "(()=>{const input=document.querySelector('[role=dialog] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'termo inexistente');input.dispatchEvent(new Event('input',{bubbles:true}));})()",
        );
        await sleep(450);
        assert(
          requests.some(
            (request) =>
              request.prefix === 'transaction' &&
              request.method === 'findAll' &&
              request.input.search === 'termo inexistente',
          ),
          'busca ampliada consulta endpoint',
        );
        await run(
          'document.querySelector(\'button[aria-label="Fechar detalhes"]\').click()',
        );
        await sleep(120);
      }
      if (route === 'dashboard')
        fs.writeFileSync(
          path.join(__dirname, 'v2-dashboard.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
      if (route === 'investments') {
        await run(
          "(()=>{const l=Array.from(document.querySelectorAll('label')).find(l=>l.textContent==='Tipos de investimento');window.qaMulti=document.getElementById(l.htmlFor).closest('.MuiAutocomplete-root');qaMulti.style.maxWidth='240px';window.qaMultiHeight=qaMulti.getBoundingClientRect().height;})()",
        );
        for (const label of [
          'CDB',
          'LCI',
          'LCA',
          'Tesouro Direto',
          'Poupança',
          'Outros',
        ]) {
          await run(
            "qaMulti.querySelector('.MuiAutocomplete-popupIndicator')?.click()",
          );
          await sleep(40);
          await run(
            `Array.from(document.querySelectorAll('[role=option]')).find(o=>o.textContent==='${label}').click()`,
          );
          await sleep(40);
        }
        assert(
          await run(
            "(()=>{const row=qaMulti.querySelector('[data-multi-values]');return row.scrollWidth>row.clientWidth && getComputedStyle(qaMulti.querySelector('.MuiAutocomplete-inputRoot')).flexWrap==='nowrap' && qaMulti.getBoundingClientRect().height<=qaMultiHeight+8;})()",
          ),
          'seleção múltipla mantém uma linha e permite rolagem lateral',
        );
        fs.writeFileSync(
          path.join(__dirname, 'multi-filter-single-line.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
        await run(
          "Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Rendimentos e simulação')?.click()",
        );
        await sleep(250);
        await run(
          "Array.from(document.querySelectorAll('[role=tab]')).find(button=>button.textContent==='Movimentações')?.click()",
        );
        await sleep(100);
        assert(
          await run(
            "document.body.innerText.includes('Registrar movimentação')",
          ),
          'formulário de aportes e resgates disponível',
        );
        fs.writeFileSync(
          path.join(__dirname, 'v2-investment-details.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
        await run(
          "Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Fechar')?.click()",
        );
        await sleep(150);
      }
      if (route === 'transactions') {
        await run(
          "Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Nova Transação')?.click()",
        );
        await sleep(250);
        assert(
          await run(
            "document.body.innerText.includes('Data de competência')&&document.body.innerText.includes('Pago / recebido em')",
          ),
          'formulário separa competência e liquidação',
        );
        for (const type of ['expense', 'income']) {
          const contrast = await run(`(() => {
            const button = document.querySelector('button[aria-label="${type === 'income' ? 'receita' : 'despesa'}"]');
            button.click();
            return true;
          })()`);
          assert(contrast, 'seletor de ' + type + ' disponível');
          await sleep(250);
          const ratio = await run(`(() => {
            const button = document.querySelector('button[aria-label="${type === 'income' ? 'receita' : 'despesa'}"]');
            const style = getComputedStyle(button);
            const luminance = color => {
              const channels = color.match(/[\\d.]+/g).slice(0,3).map(Number).map(value => { const channel = value/255; return channel <= .04045 ? channel/12.92 : ((channel+.055)/1.055)**2.4; });
              return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
            };
            const foreground = luminance(style.color), background = luminance(style.backgroundColor);
            return { ratio: (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05), selected: button.getAttribute('aria-pressed')==='true' };
          })()`);
          assert(
            ratio.selected && ratio.ratio >= 4.5,
            'contraste de ' + type + ' selecionado >= 4.5:1',
          );
          fs.writeFileSync(
            path.join(__dirname, 'contrast-' + type + '.png'),
            (await window.webContents.capturePage()).toPNG(),
          );
        }
        await run(
          `(()=>{const input=document.querySelector('[role=dialog] input[name=description]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Lançamento preservado');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
        );
        for (const [field, label, id] of [
          ['categoryId', 'Cadastrar categoria', '600'],
          ['accountId', 'Cadastrar conta', '601'],
        ]) {
          await run(
            `document.querySelector('[role=dialog] input[name=${field}]').parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))`,
          );
          await sleep(120);
          await run(
            `Array.from(document.querySelectorAll('[role=option]')).find(option=>option.textContent.includes('${label}')).click()`,
          );
          await sleep(150);
          assert(
            await run("document.querySelectorAll('[role=dialog]').length===2"),
            'cadastro rápido abre modal adicional de ' + field,
          );
          await run(
            `(()=>{const dialog=Array.from(document.querySelectorAll('[role=dialog]')).at(-1);const input=dialog.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Cadastro na hora');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
          );
          await sleep(70);
          await run(
            "Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Cadastrar e selecionar').click()",
          );
          await sleep(250);
          assert(
            await run(
              `document.querySelector('[role=dialog] input[name=${field}]').value==='${id}'`,
            ),
            'novo cadastro selecionado em ' + field,
          );
          assert(
            await run(
              "document.querySelector('[role=dialog] input[name=description]').value==='Lançamento preservado'",
            ),
            'cadastro rápido preserva lançamento em edição',
          );
        }
        fs.writeFileSync(
          path.join(__dirname, 'v2-transaction-form.png'),
          (await window.webContents.capturePage()).toPNG(),
        );
        await run(
          "Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Cancelar')?.click()",
        );
        await sleep(150);
      }
    }
    guideCompleted = true;
    await run("location.hash='/panel/settings'");
    await sleep(400);
    const advancesBefore = requests.filter(
      (request) =>
        request.prefix === 'onboarding' && request.method === 'advance',
    ).length;
    await run(
      "Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Fazer tour guiado').click()",
    );
    await sleep(250);
    assert(
      await run(
        "document.querySelector('[aria-label=\"Tour guiado\"]').textContent.includes('Modo de apresentação')",
      ),
      'tour pode ser revisto após conclusão',
    );
    await run(
      "Array.from(document.querySelectorAll('[aria-label=\"Tour guiado\"] button')).find(button=>button.textContent==='Próxima etapa').click()",
    );
    await sleep(150);
    await run(
      "Array.from(document.querySelectorAll('[aria-label=\"Tour guiado\"] button')).find(button=>button.textContent==='Voltar').click()",
    );
    await sleep(150);
    assert(
      await run("location.hash.includes('/panel/accounts')"),
      'tour permite voltar à etapa anterior',
    );
    assert(
      requests.filter(
        (request) =>
          request.prefix === 'onboarding' && request.method === 'advance',
      ).length === advancesBefore,
      'rever tour não apaga nem regrava progresso concluído',
    );
    await run(
      'document.querySelector(\'button[aria-label="Pausar tour"]\').click()',
    );
    await sleep(100);
    await run(
      "Array.from(document.querySelectorAll('button,a')).find(a=>a.textContent==='Nova receita').click()",
    );
    await sleep(500);
    assert(
      await run(
        "document.querySelector('[role=dialog]')?.textContent.includes('Receita')",
      ),
      'atalho Nova receita abre formulário',
    );
    const editAmount = (digits) =>
      run(`(() => {
      const input = document.querySelector('[role=dialog] input[inputmode=numeric]');
      input.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '${digits}');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await editAmount('12345');
    await run(
      "Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>b.textContent==='Cancelar').click()",
    );
    await run(
      "Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>b.textContent==='Continuar editando').click()",
    );
    await editAmount('67890');
    assert(
      await run(
        "document.querySelector('[role=dialog] input[inputmode=numeric]').value.includes('678,90')",
      ),
      'Valor continua editável após cancelar descarte',
    );
    await run(
      "Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>b.textContent==='Cancelar').click()",
    );
    await run(
      "Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>b.textContent==='Descartar').click()",
    );

    await run(
      "Array.from(document.querySelectorAll('button,a')).find(a=>a.textContent==='Nova despesa').click()",
    );
    await sleep(350);
    assert(
      await run(
        "document.querySelector('[role=dialog]')?.textContent.includes('Despesa')",
      ),
      'atalho Nova despesa abre formulário',
    );
    await run(
      "Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>b.textContent==='Cancelar').click()",
    );
    await run("location.hash='/panel/reports'");
    await sleep(600);
    await run(
      "window.qaHeader=document.querySelector('[data-page-header]');window.qaCards=Array.from(document.querySelectorAll('[data-card-skeleton]')).filter(s=>!s.closest('[data-filter-panel]')).map(s=>({node:s.parentElement,width:s.parentElement.getBoundingClientRect().width,height:s.parentElement.getBoundingClientRect().height}));",
    );
    assert(
      await run(
        "Array.from(document.querySelectorAll('a')).some(a=>a.textContent.includes('Análises')&&a.classList.contains('active'))",
      ),
      'área Análises ativa na rota antiga de relatórios',
    );
    const select = async (value, append = false) => {
      if (!append) {
        await run(
          "Array.from(document.querySelectorAll('[role=combobox]')).at(-1).closest('.MuiAutocomplete-root').querySelector('.MuiAutocomplete-clearIndicator')?.click()",
        );
        await sleep(40);
      }
      if (!value) return;
      await run(
        "Array.from(document.querySelectorAll('[role=combobox]')).at(-1).closest('.MuiAutocomplete-root').querySelector('.MuiAutocomplete-popupIndicator').click()",
      );
      await sleep(70);
      const label = value === 'income' ? 'Receitas' : 'Despesas';
      await run(
        `Array.from(document.querySelectorAll('[role=option]')).find(option=>option.textContent==='${label}').click()`,
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
    await select('income', true);
    await sleep(120);
    const combined = requests
      .filter(
        (request) =>
          request.prefix === 'report' && request.method === 'generateReport',
      )
      .at(-1).input.types;
    assert(
      combined.includes('income') && combined.includes('expense'),
      'filtro múltiplo envia os dois tipos ao backend',
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
