import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
export async function verifyRoadmap(source, require) {
  const { AdvancedReportV2Service } = require('../src/main/application/services/advanced-report-v2-service.ts');
  const { FinancingService } = require('../src/main/application/services/financing-service.ts');
  const { financingSchedule } = require('../src/shared/finance/financing.ts');
  const { relativeVariation, calendarDate, predictNext } = require('../src/shared/finance/advanced-reports.ts');
  assert.equal(relativeVariation(10000,0),null); assert.equal(relativeVariation(0,0),0);
  assert.throws(() => calendarDate('2026-02-29')); assert.equal(calendarDate('2024-02-29'),'2024-02-29');
  assert.equal(predictNext([30000,10000,100]),0); assert.equal(predictNext([0,100,0]),null);
  await source.query("INSERT INTO finance_users(id,name,email,password_hash) VALUES(901,'Roadmap','roadmap@example.test','dummy'),(902,'Outro','other-roadmap@example.test','dummy')");
  await source.query("INSERT INTO accounts(id,user_id,name,type,balance,initial_balance) VALUES(901,901,'Conta A','checking',1000000,1000000),(902,901,'Conta B','checking',0,0),(903,902,'Outro','checking',0,0)");
  await source.query("INSERT INTO categories(id,user_id,name,type) VALUES(901,901,'Gasto A','expense'),(902,901,'Gasto B','expense'),(903,901,'Renda','income'),(904,902,'Outro','expense')");
  const insert = (account,category,date,status='settled',amount=10000,type='expense') => source.query('INSERT INTO transactions(account_id,category_id,description,type,amount,transaction_date,settlement_date,status,origin) VALUES(?,?,?, ?,?,?,?,?,?)',[account,category,'Fictício',type,amount,date,status==='settled' ? date : null,status,'entry']);
  await insert(901,901,'2024-01-31'); await insert(901,901,'2024-12-31');
  await insert(902,902,'2024-12-31','pending',99000); await insert(903,904,'2024-12-31','settled',88000);
  const reports = new AdvancedReportV2Service(), query={startDate:'2024-01-01',endDateExclusive:'2025-01-01',basis:'settlement'};
  const comparison = await reports.query(901,'comparison',query);
  assert.equal(comparison.rows[0].variationPercent,null); assert.equal(comparison.rows[0].totalCents,20000);
  const trends=await reports.query(901,'trends',query);
  assert.equal(trends.rows[0].points.length,12); assert.equal(trends.rows[0].points[1].amountCents,0); assert.equal(trends.rows[0].predictedCents,null);
  const habits=await reports.query(901,'habits',query);
  assert.equal(habits.rows.reduce((s,r)=>s+r.totalCents,0),20000);
  assert.equal(habits.rows.find((r)=>r.count>0).averageCents,10000);
  const filtered=await reports.query(901,'categories',{...query,accountIds:[902]}); assert.equal(filtered.rows.length,0);
  const pending=await reports.query(901,'categories',{...query,basis:'competence',categoryIds:[902]}); assert.equal(pending.rows[0].totalCents,99000);
  const health=(await reports.query(901,'health',query)).health;
  assert.equal(health.score,null); assert.equal(health.expenseToIncomeRatio,null); assert.equal(health.budgetAdherence,null); assert.equal(health.emergencyFundMonths,null);
  const input={name:'Contrato fictício',creditor:'Teste',accountId:901,categoryId:901,method:'SAC',principalCents:100000,monthlyRatePercent:1,termMonths:3,firstDueDate:'2026-01-31',manualInstallmentCents:0,monthlyFeesCents:100};
  const schedule=financingSchedule(input); assert.equal(schedule[1].dueDate,'2026-02-28'); assert.equal(schedule[2].dueDate,'2026-03-31'); assert.equal(schedule.reduce((s,r)=>s+r.principalCents,0),100000);
  const price=financingSchedule({...input,method:'PRICE'}); assert.equal(price.reduce((s,r)=>s+r.principalCents,0),100000); assert.ok(price.every((r)=>Number.isSafeInteger(r.totalCents)));
  const zero=financingSchedule({...input,method:'PRICE',monthlyRatePercent:0}); assert.equal(zero.reduce((s,r)=>s+r.interestCents,0),0);
  const service=new FinancingService(), id=await service.create(901,input);
  const detail=await service.detail(901,id); await assert.rejects(()=>service.detail(902,id),/não encontrado/);
  assert.equal((await source.query('SELECT balance FROM accounts WHERE id=901'))[0].balance,1000000);
  const payment={installmentId:detail.installments[0].id,amountCents:10000,principalCents:9000,paidAt:'2026-01-20',requestId:'roadmap-payment-id-001'};
  await Promise.all([service.pay(901,payment),service.pay(901,payment)]);
  assert.equal((await service.detail(901,id)).installments[0].paidCents,10000);
  assert.equal((await source.query('SELECT balance FROM accounts WHERE id=901'))[0].balance,990000);
  const expense=(await reports.query(901,'categories',{startDate:'2026-01-01',endDateExclusive:'2026-02-01',basis:'settlement'})).rows;
  assert.equal(expense[0].totalCents,1000);
  await assert.rejects(()=>service.pay(902,{...payment,requestId:'roadmap-other-payment'}),/não encontrada/);
  await assert.rejects(()=>service.pay(901,{...payment,amountCents:10001}),/outros valores/);
  await assert.rejects(()=>service.adjust(901,payment.installmentId,20000,'Novo valor'),/pagamento/);
  const paid=(await service.detail(901,id)).payments[0]; await service.reverse(901,paid.id); await service.reverse(901,paid.id);
  assert.equal((await source.query('SELECT balance FROM accounts WHERE id=901'))[0].balance,1000000);
  await service.adjust(901,payment.installmentId,40000,'Valor comunicado pelo credor');
  assert.equal((await service.detail(901,id)).installments[0].totalCents,40000);
  const { AlertOccurrenceService }=require('../src/main/application/services/alert-occurrence-service.ts');
  const occurrences=new AlertOccurrenceService(), rule={alertId:901,status:'critical',categoryName:'Gasto A',percentage:110};
  await occurrences.evaluate(901,'2026-11',[rule]); await occurrences.evaluate(901,'2026-11',[rule]); assert.equal((await occurrences.list(901)).length,1);
  await occurrences.dismiss(901,(await occurrences.list(901))[0].id); await occurrences.evaluate(901,'2026-11',[rule]); assert.equal((await occurrences.list(901)).length,0);
  await occurrences.evaluate(901,'2026-11',[]); await occurrences.evaluate(901,'2026-11',[rule]); assert.equal((await occurrences.list(901)).length,1);
  // Synthetic reproducible query workload. No personal database or EXPLAIN-driven index changes.
  const benchmarks=[];
  for(const count of [10000,100000]) {
    await source.query('DELETE FROM transactions WHERE account_id=902');
    await source.query(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<?) INSERT INTO transactions(account_id,category_id,description,type,amount,transaction_date,settlement_date,status,origin) SELECT 902,902,'Sintético','expense',100,'2024-06-01','2024-06-01','settled','entry' FROM n`,[count]);
    const timings=[]; for(let i=0;i<10;i++){const start=performance.now();await reports.query(901,'history',{...query,accountIds:[902]});timings.push(performance.now()-start);}
    timings.sort((a,b)=>a-b); benchmarks.push({count,p50Ms:timings[4],p95Ms:timings[9],heapBytes:process.memoryUsage().heapUsed});
  }
  const plan=await source.query("EXPLAIN QUERY PLAN SELECT SUM(t.amount) FROM transactions t JOIN accounts a ON a.id=t.account_id WHERE a.user_id=901 AND t.status='settled' AND t.settlement_date>='2024-01-01' AND t.settlement_date<'2025-01-01'");
  console.log('ROADMAP_BENCHMARK',JSON.stringify({benchmarks,plan}));
  console.log('Roadmap ORM: relatórios, isolamento, centavos, SAC/Price, pagamento parcial idempotente, estorno, ajuste e ocorrências: OK');
}
