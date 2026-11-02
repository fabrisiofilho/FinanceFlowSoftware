import { InfiniteMore, MultiFilter } from '@renderer/components/BoardListing';
import { QuickCreate } from '@renderer/components/QuickCreate';
import { useRequestSequence } from '@renderer/hooks/requestSequence';
import { DateStringField } from '@renderer/components/Form/DatePicker/DateStringField';
import type { Account } from '@shared/interfaces/types/account.types';
import type { InvestmentEventInput } from '@shared/interfaces/types/investment.types';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  ShowChartRounded,
  DeleteOutlineRounded,
} from '@mui/icons-material';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import { ExpandableCard } from '@renderer/components/ExpandableCard';
import { Input } from '@renderer/components/Form/Input';
import { MonthField } from '@renderer/components/Form/MonthField';
import { CurrencyInput } from '@renderer/components/Form/CurrencyInput';
import { AppAlert } from '@renderer/components/Feedback';
import {
  projectInvestment,
  investmentBalance,
} from '@shared/finance/investments';
import type {
  Investment,
  InvestmentPortfolio,
} from '@shared/interfaces/types/investment.types';
import { formatCurrency } from '@renderer/utils/currency';

const today = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const money = (cents: number): string => formatCurrency(cents / 100);
export function InvestmentsPage() {
  const [portfolio, setPortfolio] = useState<InvestmentPortfolio>({
    investments: [],
    yields: [],
  });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [creating, setCreating] = useState(false),
    [selected, setSelected] = useState<Investment | null>(null),
    [deleting, setDeleting] = useState<Investment | null>(null);
  const [name, setName] = useState(''),
    [kind, setKind] = useState('CDB'),
    [principal, setPrincipal] = useState(0),
    [start, setStart] = useState(today),
    [rate, setRate] = useState('0');
  const [detailTab, setDetailTab] = useState('summary');
  const [contribution, setContribution] = useState(0);
  const [timing, setTiming] = useState<'start' | 'end'>('end');
  const [projectionPage, setProjectionPage] = useState(0);
  const [month, setMonth] = useState(today),
    [amount, setAmount] = useState(0),
    [loss, setLoss] = useState(false),
    [horizon, setHorizon] = useState('12');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [quickAccount, setQuickAccount] = useState<'initial' | 'event' | null>(
    null,
  );
  const [accountId, setAccountId] = useState<number | string>('');
  const [eventKind, setEventKind] =
    useState<InvestmentEventInput['kind']>('deposit');
  const [eventAmount, setEventAmount] = useState(0);
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    return today() + '-' + String(d.getDate()).padStart(2, '0');
  });
  const [eventAccount, setEventAccount] = useState<number | string>('');
  useEffect(() => {
    void window.electronAPI.account.findAll().then((result) => {
      if (result.success && result.data)
        setAccounts(result.data.filter((item) => item.type !== 'credit_card'));
    });
  }, []);
  const [search, setSearch] = useState(''),
    [query, setQuery] = useState(''),
    [kinds, setKinds] = useState<string[]>([]);
  const [total, setTotal] = useState(0),
    [hasMore, setHasMore] = useState(false),
    [listingBusy, setListingBusy] = useState(false);
  const [totals, setTotals] = useState({
    principalCents: 0,
    yieldCents: 0,
    balanceCents: 0,
  });
  const cursor = useRef(0),
    inFlight = useRef(false);
  const { begin, isCurrent } = useRequestSequence();
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const load = useCallback(async () => {
    const request = begin();
    inFlight.current = true;
    setListingBusy(true);
    setError('');
    try {
      let combined: InvestmentPortfolio = {
        investments: [],
        yields: [],
        events: [],
      };
      const through = cursor.current;
      for (let page = 0; page <= through; page++) {
        const result = await window.electronAPI.investment.query({
          page,
          size: 24,
          search: query,
          kinds,
        });
        if (!isCurrent(request)) return;
        if (!result.success || !result.data)
          throw new Error(result.error || 'Falha ao carregar investimentos.');
        const data = result.data;
        combined = {
          investments: [...combined.investments, ...data.investments],
          yields: [...combined.yields, ...data.yields],
          events: [...(combined.events ?? []), ...(data.events ?? [])],
        };
        setTotals(data.summary);
        setTotal(data.totalElements);
        setHasMore(page + 1 < data.totalPages);
        cursor.current = page;
        if (page + 1 >= data.totalPages) break;
      }
      setPortfolio(combined);
    } catch (reason) {
      if (isCurrent(request))
        setError(
          reason instanceof Error ? reason.message : 'Falha ao carregar.',
        );
    } finally {
      if (isCurrent(request)) {
        inFlight.current = false;
        setLoading(false);
        setListingBusy(false);
      }
    }
  }, [query, kinds, begin, isCurrent]);
  useEffect(() => {
    cursor.current = 0;
    setLoading(true);
    void load();
  }, [load]);
  const more = useCallback(async () => {
    if (inFlight.current || !hasMore || error) return;
    const request = begin();
    inFlight.current = true;
    setListingBusy(true);
    try {
      const result = await window.electronAPI.investment.query({
        page: cursor.current + 1,
        size: 24,
        search: query,
        kinds,
      });
      if (!isCurrent(request)) return;
      if (!result.success || !result.data)
        throw new Error(result.error || 'Falha ao carregar.');
      const data = result.data;
      cursor.current++;
      setPortfolio((previous) => ({
        investments: [
          ...previous.investments,
          ...data.investments.filter(
            (i) => !previous.investments.some((p) => p.id === i.id),
          ),
        ],
        yields: [
          ...previous.yields,
          ...data.yields.filter(
            (i) => !previous.yields.some((p) => p.id === i.id),
          ),
        ],
        events: [
          ...(previous.events ?? []),
          ...(data.events ?? []).filter(
            (i) => !previous.events?.some((p) => p.id === i.id),
          ),
        ],
      }));
      setHasMore(cursor.current + 1 < data.totalPages);
      setTotal(data.totalElements);
      setTotals(data.summary);
    } catch (reason) {
      if (isCurrent(request))
        setError(
          reason instanceof Error ? reason.message : 'Falha ao carregar.',
        );
    } finally {
      if (isCurrent(request)) {
        inFlight.current = false;
        setListingBusy(false);
      }
    }
  }, [query, kinds, hasMore, error, begin, isCurrent]);
  const run = async (
    action: () => Promise<{ success: boolean; error?: string }>,
    done?: () => void,
  ): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const result = await action();
      if (!result.success)
        throw new Error(result.error || 'Não foi possível salvar');
      await load();
      done?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha na operação');
    } finally {
      setBusy(false);
    }
  };
  const balance = (investment: Investment): number =>
    investmentBalance(investment, portfolio);
  const open = (investment: Investment): void => {
    setDetailTab('summary');
    setProjectionPage(0);
    setSelected(investment);
    setRate(String(investment.monthlyRate));
    const entry = portfolio.yields.find(
      (item) => item.investmentId === investment.id && item.month === month,
    );
    setAmount(Math.abs(entry?.amountCents || 0) / 100);
    setLoss((entry?.amountCents || 0) < 0);
    setError('');
  };
  const selectMonth = (value: string): void => {
    setMonth(value);
    const entry = portfolio.yields.find(
      (item) => item.investmentId === selected?.id && item.month === value,
    );
    setAmount(Math.abs(entry?.amountCents || 0) / 100);
    setLoss((entry?.amountCents || 0) < 0);
  };
  let projection: ReturnType<typeof projectInvestment> = [],
    projectionError = '';
  if (selected)
    try {
      projection = projectInvestment(
        balance(selected),
        Number(rate),
        Number(horizon),
        Math.round(contribution * 100),
        timing,
      );
    } catch (reason) {
      projectionError =
        reason instanceof Error ? reason.message : 'Parâmetros inválidos';
    }
  const totalPrincipal = totals.principalCents,
    totalYield = totals.yieldCents;
  return (
    <PageContainer>
      <PageHeader
        title="Investimentos"
        actions={
          <>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddRounded />}
              onClick={() => {
                setName('');
                setPrincipal(0);
                setRate('0');
                setCreating(true);
                setError('');
              }}
            >
              Novo investimento
            </Button>
          </>
        }
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Input
          label="Buscar investimentos"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ flex: 2 }}
        />
        <MultiFilter
          label="Tipos de investimento"
          options={[
            'CDB',
            'LCI',
            'LCA',
            'Tesouro Direto',
            'Poupança',
            'Outros',
          ].map((kind) => ({ id: kind, label: kind }))}
          value={kinds}
          onChange={setKinds}
        />
        <Typography variant="caption">
          {total} investimento(s) · totais da carteira completa
        </Typography>
      </Stack>
      <ContentLoading loading={loading} initial="inline">
        {error && !selected && !creating && (
          <AppAlert severity="error">{error}</AppAlert>
        )}
        {
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(3,minmax(0,1fr))',
                },
                gap: 2,
                mb: 3,
              }}
            >
              {[
                ['Valor aplicado', money(totalPrincipal)],
                ['Rendimento registrado', money(totalYield)],
                ['Saldo acompanhado', money(totals.balanceCents)],
              ].map(([label, value]) => (
                <ContentSurface key={label} sx={{ p: 3 }}>
                  <Typography color="text.secondary" variant="body2">
                    {label}
                  </Typography>
                  <Typography variant="h5" mt={1}>
                    {value}
                  </Typography>
                </ContentSurface>
              ))}
            </Box>
            <AppAlert severity="info">
              Aportes e resgates com conta vinculada movimentam o saldo da
              conta. Rendimentos, taxas e impostos alteram apenas o
              investimento. A projeção usa a taxa mensal informada, com juros
              compostos, sem impostos, aportes ou resgates.
            </AppAlert>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2,minmax(0,1fr))',
                },
                gap: 3,
                mt: 3,
                alignItems: 'stretch',
              }}
            >
              {portfolio.investments.map((investment) => (
                <ExpandableCard
                  key={investment.id}
                  sx={{ p: 3, height: '100%' }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" gap={1} alignItems="center">
                      <ShowChartRounded color="secondary" />
                      <Typography variant="h6">{investment.name}</Typography>
                      <Chip label={investment.kind} size="small" />
                    </Stack>
                    <Typography variant="h4">
                      {money(balance(investment))}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Aplicado: {money(investment.principalCents)} · início{' '}
                      {investment.startMonth}
                    </Typography>
                    <Typography variant="body2">
                      Taxa estimada: {investment.monthlyRate}% ao mês
                    </Typography>
                    <Stack direction="row" gap={1}>
                      <Button
                        variant="outlined"
                        onClick={() => open(investment)}
                      >
                        Rendimentos e simulação
                      </Button>
                      <Button
                        color="error"
                        startIcon={<DeleteOutlineRounded />}
                        onClick={() => setDeleting(investment)}
                      >
                        Excluir
                      </Button>
                    </Stack>
                    <Stack spacing={1}>
                      {portfolio.yields
                        .filter((item) => item.investmentId === investment.id)
                        .slice(0, 3)
                        .map((item) => (
                          <Stack
                            key={item.id}
                            data-card-row
                            direction="row"
                            justifyContent="space-between"
                          >
                            <Typography variant="body2">
                              {item.month}
                            </Typography>
                            <Typography
                              variant="body2"
                              color={
                                item.amountCents < 0
                                  ? 'error.main'
                                  : 'success.main'
                              }
                            >
                              {money(item.amountCents)}
                            </Typography>
                          </Stack>
                        ))}
                    </Stack>
                  </Stack>
                </ExpandableCard>
              ))}
            </Box>
            {!portfolio.investments.length && (
              <ContentSurface sx={{ p: 5, mt: 3, textAlign: 'center' }}>
                <ShowChartRounded
                  sx={{ fontSize: 40, color: 'text.secondary' }}
                />
                <Typography variant="h6">
                  Comece pelo seu primeiro investimento
                </Typography>
                <Typography color="text.secondary">
                  Cadastre, por exemplo, um CDB de R$ 30.000 e informe o
                  rendimento de cada mês.
                </Typography>
              </ContentSurface>
            )}
          </>
        }
        <Dialog
          open={creating}
          onClose={() => !busy && setCreating(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Novo investimento</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              {error && <AppAlert severity="error">{error}</AppAlert>}
              <Input
                label="Nome"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                label="Tipo (CDB, Tesouro, fundo…)"
                required
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              />
              <CurrencyInput
                label="Valor aplicado"
                required
                value={principal}
                onChange={setPrincipal}
              />
              <SelectInput
                label="Conta de origem"
                onCreate={() => setQuickAccount('initial')}
                createLabel="Cadastrar conta"
                value={accountId}
                items={[
                  {
                    value: '',
                    label: 'Posição já existente (sem debitar conta)',
                  },
                  ...accounts.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
                onChange={(event) =>
                  setAccountId(event.target.value as string | number)
                }
              />
              <MonthField
                label="Competência inicial"
                value={start}
                onChange={setStart}
              />
              <Input
                label="Taxa mensal estimada (%)"
                type="number"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              disabled={busy || !name.trim() || principal <= 0}
              onClick={() =>
                void run(
                  () =>
                    window.electronAPI.investment.create({
                      name,
                      kind,
                      principalCents: Math.round(principal * 100),
                      startMonth: start,
                      monthlyRate: Number(rate),
                      accountId:
                        accountId === '' ? undefined : Number(accountId),
                    }),
                  () => setCreating(false),
                )
              }
            >
              Salvar investimento
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={!!selected}
          onClose={() => !busy && setSelected(null)}
          fullWidth
          maxWidth="md"
          scroll="paper"
        >
          <DialogTitle>{selected?.name} · {money(selected ? balance(selected) : 0)} registrado</DialogTitle>
          <Tabs value={detailTab} onChange={(_, value) => setDetailTab(value)} variant="scrollable" scrollButtons="auto">
            <Tab value="summary" label="Resumo" /><Tab value="yields" label="Rendimentos" /><Tab value="simulation" label="Simulação" /><Tab value="events" label="Movimentações" /><Tab value="details" label="Detalhes" />
          </Tabs>
          <DialogContent dividers>
            <Stack spacing={3}>
              {error && <AppAlert severity="error">{error}</AppAlert>}
              {detailTab === 'summary' && <Stack gap={2}><Typography>Principal inicial: {money(selected?.principalCents ?? 0)}</Typography><Typography>Saldo registrado: {money(selected ? balance(selected) : 0)}</Typography><AppAlert severity="info">Posição calculada apenas com registros reais. Simulações não movimentam contas.</AppAlert><Button onClick={() => setDetailTab('yields')}>Registrar rendimento</Button><Button onClick={() => setDetailTab('events')}>Aportar ou resgatar</Button></Stack>}
              {detailTab === 'details' && <Stack gap={1}><Typography>Tipo: {selected?.kind}</Typography><Typography>Competência inicial: {selected?.startMonth}</Typography><Typography>Taxa hipotética cadastrada: {selected?.monthlyRate}% ao mês</Typography><Typography>Instituição, vencimento e liquidez: não informados neste cadastro.</Typography></Stack>}
              {detailTab === 'events' && <Stack spacing={3}>
              <Typography variant="h6">Movimentar investimento</Typography>
              <SelectInput
                label="Operação"
                required
                value={eventKind}
                items={[
                  { value: 'deposit', label: 'Aporte' },
                  { value: 'withdrawal', label: 'Resgate' },
                  { value: 'fee', label: 'Taxa descontada da posição' },
                  { value: 'tax', label: 'Imposto descontado da posição' },
                ]}
                onChange={(event) =>
                  setEventKind(
                    event.target.value as InvestmentEventInput['kind'],
                  )
                }
              />
              <CurrencyInput
                label="Valor da operação"
                required
                value={eventAmount}
                onChange={setEventAmount}
              />
              <DateStringField
                label="Data da operação"
                required
                value={eventDate}
                onChange={setEventDate}
              />
              {(eventKind === 'deposit' || eventKind === 'withdrawal') && (
                <SelectInput
                  label="Conta de caixa"
                  onCreate={() => setQuickAccount('event')}
                  createLabel="Cadastrar conta"
                  value={eventAccount}
                  items={[
                    { value: '', label: 'Selecione' },
                    ...accounts.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })),
                  ]}
                  onChange={(event) =>
                    setEventAccount(event.target.value as string | number)
                  }
                />
              )}
              <Button
                variant="contained"
                disabled={busy || eventAmount <= 0}
                onClick={() =>
                  selected &&
                  void run(
                    () =>
                      window.electronAPI.investment.event({
                        investmentId: selected.id,
                        kind: eventKind,
                        amountCents: Math.round(eventAmount * 100),
                        eventDate,
                        accountId:
                          eventKind === 'deposit' || eventKind === 'withdrawal'
                            ? Number(eventAccount)
                            : undefined,
                        requestId: crypto.randomUUID(),
                      }),
                    () => setEventAmount(0),
                  )
                }
              >
                Registrar movimentação
              </Button>
              <Typography variant="body2" color="text.secondary">
                Aportes e resgates transferem valores entre caixa e carteira.
                Taxas e impostos reduzem a posição e são informados manualmente.
              </Typography>
              <Typography variant="h6">Histórico de movimentações</Typography>
              {(portfolio.events ?? [])
                .filter((item) => item.investmentId === selected?.id)
                .map((item) => (
                  <Typography key={item.id} variant="body2">
                    {item.eventDate} ·{' '}
                    {
                      {
                        initial: 'Aplicação inicial',
                        deposit: 'Aporte',
                        withdrawal: 'Resgate',
                        fee: 'Taxa',
                        tax: 'Imposto',
                      }[item.kind]
                    }{' '}
                    · {money(item.amountCents)}
                  </Typography>
                ))}
              </Stack>}
              {detailTab === 'yields' && <Stack spacing={3}>
              <Typography variant="h6">
                Registrar rendimento observado
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={2}
                sx={{
                  '& > *': { flex: 1, minWidth: 0, width: { sm: '33.33%' } },
                }}
              >
                <MonthField
                  label="Competência"
                  value={month}
                  onChange={selectMonth}
                />
                <CurrencyInput
                  label="Rendimento do mês"
                  value={amount}
                  onChange={setAmount}
                />
                <SelectInput
                  label="Resultado"
                  fullWidth
                  value={loss ? 'loss' : 'gain'}
                  items={[
                    { value: 'gain', label: 'Ganho' },
                    { value: 'loss', label: 'Perda' },
                  ]}
                  onChange={(event) => setLoss(event.target.value === 'loss')}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Salvar substitui o valor já registrado para esta competência.
                Informe o resultado desejado; não há cálculo automático de
                impostos.
              </Typography>
              <Button
                disabled={busy}
                variant="contained"
                onClick={() =>
                  selected &&
                  void run(() =>
                    window.electronAPI.investment.recordYield(
                      selected.id,
                      month,
                      Math.round(amount * 100) * (loss ? -1 : 1),
                    ),
                  )
                }
              >
                Salvar rendimento
              </Button>
              <Typography variant="h6">Histórico registrado</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Competência</TableCell>
                    <TableCell align="right">Rendimento</TableCell><TableCell align="right">Acumulado registrado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio.yields
                    .filter((item) => item.investmentId === selected?.id)
                    .sort((a,b) => a.month.localeCompare(b.month))
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell align="right">
                          {money(item.amountCents)}
                        </TableCell><TableCell align="right">{money(portfolio.yields.filter((y) => y.investmentId === selected?.id && y.month <= item.month).reduce((sum,y) => sum+y.amountCents,0))}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              </Stack>}
              {detailTab === 'simulation' && <Stack spacing={3}>
              <Typography variant="h6">Projeção hipotética · bruta, sem estimativa tributária</Typography>
              <CurrencyInput label="Aporte mensal hipotético" value={contribution} onChange={setContribution} />
              <SelectInput label="Momento do aporte" value={timing} items={[{value:'start',label:'Início do mês'},{value:'end',label:'Fim do mês'}]} onChange={(event) => setTiming(event.target.value as 'start' | 'end')} />
              <Stack direction="row" gap={2}>
                <Input
                  label="Taxa mensal (%)"
                  type="number"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                />
                <Input
                  label="Prazo em meses"
                  type="number"
                  value={horizon}
                  onChange={(event) => { setHorizon(event.target.value); setProjectionPage(0); }}
                />
              </Stack>
              {projectionError ? (
                <AppAlert severity="warning">{projectionError}</AppAlert>
              ) : (
                <>
                  <AppAlert severity="info">
                    Saldo registrado: {money(selected ? balance(selected) : 0)}.
                    Saldo estimado em {horizon} meses:{' '}
                    {money(projection.at(-1)?.balanceCents ?? (selected ? balance(selected) : 0))}. Não é
                    garantia de rentabilidade.
                  </AppAlert>
                  <Stack direction="row" gap={2}><Button disabled={projectionPage === 0} onClick={() => setProjectionPage((p) => p-1)}>Anterior</Button><Typography>Página {projectionPage+1}</Typography><Button disabled={(projectionPage+1)*24 >= projection.length} onClick={() => setProjectionPage((p) => p+1)}>Próxima</Button></Stack>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Mês futuro</TableCell>
                          <TableCell align="right">
                            Rendimento estimado
                          </TableCell>
                          <TableCell align="right">Rendimento acumulado</TableCell><TableCell align="right">Aportes acumulados</TableCell><TableCell align="right">Saldo estimado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projection.slice(projectionPage * 24, (projectionPage + 1) * 24).map((item) => (
                          <TableRow key={item.month}>
                            <TableCell>{item.month}</TableCell>
                            <TableCell align="right">
                              {money(item.yieldCents)}
                            </TableCell><TableCell align="right">{money(item.accumulatedYieldCents)}</TableCell><TableCell align="right">{money(item.accumulatedContributionCents)}</TableCell>
                            <TableCell align="right">
                              {money(item.balanceCents)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </>
              )}
              </Stack>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setSelected(null)}>
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
          <DialogTitle>Excluir investimento?</DialogTitle>
          <DialogContent>
            O cadastro e seus rendimentos registrados serão removidos. Essa ação
            não altera suas contas.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button
              color="error"
              disabled={busy}
              onClick={() =>
                deleting &&
                void run(
                  () => window.electronAPI.investment.remove(deleting.id),
                  () => setDeleting(null),
                )
              }
            >
              Excluir
            </Button>
          </DialogActions>
        </Dialog>
        <InfiniteMore
          busy={listingBusy}
          error={error || undefined}
          hasMore={hasMore}
          onMore={more}
          onRetry={load}
        />
      </ContentLoading>
      {quickAccount && (
        <QuickCreate
          kind="account"
          allowedAccountTypes={['checking', 'savings', 'wallet']}
          onClose={() => setQuickAccount(null)}
          onAccount={(account) => {
            setAccounts((rows) => [...rows, account]);
            if (quickAccount === 'initial') setAccountId(account.id);
            else setEventAccount(account.id);
          }}
        />
      )}
    </PageContainer>
  );
}
