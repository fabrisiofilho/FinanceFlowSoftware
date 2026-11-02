import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = process.cwd(),
  directory = fs.mkdtempSync(path.join(root, '.qa', 'packaged-real-'));
const port = 19381;
const executable = path.join(root, 'dist/win-unpacked/contabily.exe');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(
  executable,
  [`--user-data-dir=${directory}`, `--remote-debugging-port=${port}`],
  { env, windowsHide: true, stdio: 'ignore' },
);
let ws;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 100; i++) {
    try {
      target = (
        await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
      ).find((t) => t.type === 'page');
      if (target) break;
    } catch {}
    await pause(200);
  }
  assert.ok(target, 'Janela de produção iniciou');
  assert.ok(
    fs.existsSync(path.join(directory, 'database', 'finance.db')),
    'Banco deve estar no diretório isolado antes de qualquer escrita de teste',
  );
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let next = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++next;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };
  await evaluate('window.electronAPI.windowControls.minimize();true');
  for (let i = 0; i < 100; i++) {
    if (await evaluate("!!document.querySelector('input[type=email]')")) break;
    await pause(100);
  }
  const result = await evaluate(`(async()=>{
  const api=window.electronAPI;
  const ok=r=>{if(!r.success)throw new Error(r.error);return r.data;};
  ok(await api.financeAuth.register({name:'Teste empacotado',email:'package@example.test',password:'Ficticio-12345!'}));
  ok(await api.financeAuth.login('package@example.test','Ficticio-12345!'));
  const a=ok(await api.account.create({name:'Conta empacotada',type:'checking',balance:1000}));
  const c=ok(await api.category.findAll()).find(c=>c.type==='expense');
  const id=ok(await api.financing.create({name:'Contrato fictício',creditor:'Teste',accountId:a.id,categoryId:c.id,method:'MANUAL',principalCents:10000,monthlyRatePercent:0,termMonths:1,firstDueDate:'2026-11-30',manualInstallmentCents:11000,monthlyFeesCents:0}));
  const d=ok(await api.financing.detail(id));
  const payment={installmentId:d.installments[0].id,amountCents:11000,principalCents:10000,paidAt:'2026-11-02',requestId:'packaged-payment-0001'};
  ok(await api.financing.pay(payment));ok(await api.financing.pay(payment));
  const report=ok(await api.advancedReport.queryV2('categories',{startDate:'2026-11-01',endDateExclusive:'2026-12-01',basis:'settlement'}));
  const diagnostic=ok(await api.diagnostics.snapshot());
  return {version:diagnostic.version,expenseCents:report.rows.reduce((sum,r)=>sum+r.totalCents,0),balance:ok(await api.account.findAll()).find(r=>r.id===a.id).balance};
 })()`);
  assert.equal(result.version, '2.8.1');
  assert.equal(result.expenseCents, 1000);
  assert.equal(result.balance, 890);
  fs.writeFileSync(
    path.join(root, '.qa/roadmap-2026-11-02/packaged-real.json'),
    JSON.stringify(result, null, 2),
  );
  console.log(
    'Executável empacotado: migrações, SQLite nativo, IPC, categorias padrão, pagamento idempotente e versão 2.8.1: OK',
  );
  await evaluate('window.electronAPI.windowControls.close();true').catch(
    () => {},
  );
} finally {
  ws?.close();
  child.kill();
}
