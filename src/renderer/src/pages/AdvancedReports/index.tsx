import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Stack, Tab, Tabs, Typography, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import { AppAlert } from '@renderer/components/Feedback';
import { DateStringField } from '@renderer/components/Form/DatePicker/DateStringField';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { formatCurrency } from '@renderer/utils/currency';
import { validateReportQuery } from '@shared/finance/advanced-reports';
import type { AdvancedReportQuery, AdvancedReportResult, ReportPanel, ReportRow } from '@shared/finance/advanced-reports';

const panels: { id: ReportPanel; label: string }[] = [
  { id: 'health', label: 'Visão financeira' }, { id: 'history', label: 'Evolução' },
  { id: 'categories', label: 'Categorias' }, { id: 'comparison', label: 'Comparações' },
  { id: 'trends', label: 'Tendências' }, { id: 'habits', label: 'Hábitos' },
];
const initialQuery = (): AdvancedReportQuery => {
  try { const saved = sessionStorage.getItem('advanced-report-query'); if (saved) return validateReportQuery(JSON.parse(saved)); } catch { /* Ignore obsolete session filters. */ }
  const year = new Date().getFullYear();
  return { startDate: year + '-01-01', endDateExclusive: (year + 1) + '-01-01', basis: 'settlement' };
};
const money = (cents?: number) => cents === undefined ? '—' : formatCurrency(cents / 100);
function cells(row: ReportRow, panel: ReportPanel): string[] {
  if (panel === 'history' || panel === 'health') return [money(row.incomeCents), money(row.expenseCents), money((row.incomeCents ?? 0) - (row.expenseCents ?? 0))];
  if (panel === 'comparison') return [money(row.previousCents), money(row.totalCents), money(row.differenceCents), row.variationPercent === null ? 'Novo gasto / sem base' : row.variationPercent?.toFixed(1) + '%'];
  if (panel === 'trends') return [money(row.averageCents), row.predictedCents == null ? 'Amostra insuficiente' : money(row.predictedCents)];
  return [money(row.totalCents), String(row.count ?? 0), money(row.averageCents), ...(panel === 'categories' ? [row.percentage?.toFixed(1) + '%'] : [])];
}
export function AdvancedReportsPage() {
  const [panel, setPanel] = useState<ReportPanel>(() => {
    const saved = sessionStorage.getItem('advanced-report-panel'); return panels.some((p) => p.id === saved) ? saved as ReportPanel : 'health';
  });
  const [query, setQuery] = useState(initialQuery), [data, setData] = useState<AdvancedReportResult | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [accounts, setAccounts] = useState<{ value: number; label: string }[]>([]), [categories, setCategories] = useState<{ value: number; label: string }[]>([]);
  const sequence = useRef(0);
  useEffect(() => {
    let active = true;
    void Promise.allSettled([window.electronAPI.account.findAll(), window.electronAPI.category.findAll()]).then(([a,c]) => {
      if (!active) return;
      if (a.status === 'fulfilled' && a.value.success) setAccounts((a.value.data ?? []).map((r) => ({ value: r.id, label: r.name })));
      if (c.status === 'fulfilled' && c.value.success) setCategories((c.value.data ?? []).map((r) => ({ value: r.id, label: r.name })));
    });
    return () => { active = false; };
  }, []);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError(''); setData(null);
    try {
      const valid = validateReportQuery(query);
      sessionStorage.setItem('advanced-report-query', JSON.stringify(valid));
      sessionStorage.setItem('advanced-report-panel', panel);
      const response = await window.electronAPI.advancedReport.queryV2(panel, valid);
      if (request !== sequence.current) return;
      if (!response.success || !response.data) throw new Error(response.error || 'Falha ao consultar relatório');
      setData(response.data);
    } catch (reason) { if (request === sequence.current) setError(reason instanceof Error ? reason.message : 'Falha ao consultar'); }
    finally { if (request === sequence.current) setLoading(false); }
  }, [query, panel]);
  useEffect(() => { void load(); return () => { sequence.current++; }; }, [load]);
  const headers = panel === 'history' || panel === 'health' ? ['Receitas', 'Despesas', 'Resultado'] : panel === 'comparison' ? ['Ano anterior', 'Período atual', 'Diferença', 'Variação'] : panel === 'trends' ? ['Média mensal', 'Próximo mês (hipótese)'] : ['Total', 'Transações', 'Média por transação', ...(panel === 'categories' ? ['Participação'] : [])];
  function exportCsv() {
    if (!data) return;
    const escape = (v: string) => '"' + v.replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
    const lines = [[data.methodology].map(escape).join(';'), ['Referência', ...headers].map(escape).join(';'), ...data.rows.map((r) => [r.label,...cells(r,panel)].map(escape).join(';'))];
    if (panel === 'trends') for (const row of data.rows) for (const point of row.points ?? []) lines.push([row.label, point.month, money(point.amountCents)].map(escape).join(';'));
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'contabily-' + panel + '.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <PageContainer>
    <PageHeader title="Relatórios avançados" description="Período e metodologia compartilhados por todos os painéis" actions={<Stack direction="row" gap={1}><Button onClick={load}>Atualizar</Button><Button disabled={!data || loading} onClick={exportCsv}>Exportar CSV</Button></Stack>} />
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={2} flexWrap="wrap">
      <DateStringField label="Início" value={query.startDate} onChange={(startDate) => setQuery({ ...query, startDate })} />
      <DateStringField label="Fim exclusivo (não incluído)" value={query.endDateExclusive} onChange={(endDateExclusive) => setQuery({ ...query, endDateExclusive })} />
      <SelectInput label="Base" value={query.basis} items={[{ value: 'settlement', label: 'Realizado por liquidação' }, { value: 'competence', label: 'Competência com pendências' }]} onChange={(e) => setQuery({ ...query, basis: e.target.value as AdvancedReportQuery['basis'] })} />
      <SelectInput label="Conta" value={query.accountIds?.[0] ?? ''} items={[{ value: '', label: 'Todas' }, ...accounts]} onChange={(e) => setQuery({ ...query, accountIds: e.target.value === '' ? [] : [Number(e.target.value)] })} />
      <SelectInput label="Categoria" value={query.categoryIds?.[0] ?? ''} items={[{ value: '', label: 'Todas' }, ...categories]} onChange={(e) => setQuery({ ...query, categoryIds: e.target.value === '' ? [] : [Number(e.target.value)] })} />
    </Stack>
    <Tabs value={panel} onChange={(_, value) => setPanel(value)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>{panels.map((p) => <Tab key={p.id} value={p.id} label={p.label} />)}</Tabs>
    {error && <AppAlert severity="error" action={<Button onClick={load}>Tentar novamente</Button>}>{error}</AppAlert>}
    <ContentLoading loading={loading} initial="cards">
      {data && <Stack gap={2}>
        <Typography variant="body2" color="text.secondary">{data.methodology}</Typography>
        {data.health && <ContentSurface sx={{ p: 3 }}><Stack gap={1}>
          <Typography variant="h6">Score: {data.health.score ?? 'dados insuficientes'}</Typography>
          <Typography>{data.health.sampleSize} transações · {data.health.completeMonths} meses completos com movimentos</Typography>
          <Typography>Poupança: {data.health.savingsRate === null ? 'sem receita para calcular' : data.health.savingsRate.toFixed(1) + '%'}</Typography>
          <Typography>Despesas/receitas: {data.health.expenseToIncomeRatio === null ? 'sem receita para calcular' : data.health.expenseToIncomeRatio.toFixed(1) + '%'}</Typography>
          <Typography>Orçamento: {data.health.budgetAdherence === null ? 'não configurado / não comparável' : data.health.budgetAdherence.toFixed(1) + '% de aderência'} · Excesso: {money(data.health.budgetExcessCents)}</Typography>
          <Typography>Reserva de emergência: fontes não configuradas</Typography>
          {(data.health.recommendations.length ? data.health.recommendations : ['Sem recomendações automáticas.']).map((r) => <AppAlert key={r} severity="info">{r}</AppAlert>)}
        </Stack></ContentSurface>}
        {!data.rows.length ? <AppAlert severity="info">Nenhuma movimentação para os filtros selecionados.</AppAlert> : <ContentSurface sx={{ overflow: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>Referência</TableCell>{headers.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead><TableBody>{data.rows.map((r,i) => <TableRow key={i}><TableCell>{r.label}</TableCell>{cells(r,panel).map((v,j) => <TableCell key={j}>{v}</TableCell>)}</TableRow>)}</TableBody></Table></ContentSurface>}
        {panel === 'trends' && data.rows.map((r) => <ContentSurface key={r.label} sx={{ p: 2 }}><Typography variant="h6">{r.label} · histórico mensal</Typography><Stack sx={{ maxHeight: 260, overflow: 'auto' }}>{r.points?.map((p) => <Typography key={p.month} variant="body2">{p.month}: {money(p.amountCents)}</Typography>)}</Stack></ContentSurface>)}
      </Stack>}
    </ContentLoading>
  </PageContainer>;
}
