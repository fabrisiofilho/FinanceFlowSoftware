import { DateStringField } from '@renderer/components/Form/DatePicker/DateStringField';
import type { Account } from '@shared/interfaces/types/account.types';
import type { InvestmentEventInput } from '@shared/interfaces/types/investment.types';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
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
  const [month, setMonth] = useState(today),
    [amount, setAmount] = useState(0),
    [loss, setLoss] = useState(false),
    [horizon, setHorizon] = useState('12');
  const [accounts, setAccounts] = useState<Account[]>([]);
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
  const load = useCallback(async () => {
    try {
      const result = await window.electronAPI.investment.list();
      if (!result.success || !result.data)
        throw new Error(result.error || 'Falha ao carregar investimentos');
      setPortfolio(result.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
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
      );
    } catch (reason) {
      projectionError =
        reason instanceof Error ? reason.message : 'Parâmetros inválidos';
    }
  const totalPrincipal = portfolio.investments.reduce(
    (sum, item) => sum + item.principalCents,
    0,
  );
  const totalYield = portfolio.yields.reduce(
    (sum, item) => sum + item.amountCents,
    0,
  );
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
                [
                  'Saldo acompanhado',
                  money(
                    portfolio.investments.reduce(
                      (sum, item) => sum + balance(item),
                      0,
                    ),
                  ),
                ],
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
              Os registros desta carteira não movimentam automaticamente as
              contas. A projeção usa a taxa mensal informada, com juros
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
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                label="Tipo (CDB, Tesouro, fundo…)"
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              />
              <CurrencyInput
                label="Valor aplicado"
                value={principal}
                onChange={setPrincipal}
              />
              <SelectInput
                label="Conta de origem"
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
          <DialogTitle>{selected?.name} · Rendimentos e simulação</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              {error && <AppAlert severity="error">{error}</AppAlert>}
              <Typography variant="h6">Movimentar investimento</Typography>
              <SelectInput
                label="Operação"
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
                value={eventAmount}
                onChange={setEventAmount}
              />
              <DateStringField
                label="Data da operação"
                value={eventDate}
                onChange={setEventDate}
              />
              {(eventKind === 'deposit' || eventKind === 'withdrawal') && (
                <SelectInput
                  label="Conta de caixa"
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
                    <TableCell align="right">Rendimento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio.yields
                    .filter((item) => item.investmentId === selected?.id)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell align="right">
                          {money(item.amountCents)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <Typography variant="h6">Projeção hipotética</Typography>
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
                  onChange={(event) => setHorizon(event.target.value)}
                />
              </Stack>
              {projectionError ? (
                <AppAlert severity="warning">{projectionError}</AppAlert>
              ) : (
                <>
                  <AppAlert severity="info">
                    Saldo registrado: {money(selected ? balance(selected) : 0)}.
                    Saldo estimado em {horizon} meses:{' '}
                    {money(projection.at(-1)?.balanceCents || 0)}. Não é
                    garantia de rentabilidade.
                  </AppAlert>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Mês futuro</TableCell>
                          <TableCell align="right">
                            Rendimento estimado
                          </TableCell>
                          <TableCell align="right">Saldo estimado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projection.map((item) => (
                          <TableRow key={item.month}>
                            <TableCell>{item.month}</TableCell>
                            <TableCell align="right">
                              {money(item.yieldCents)}
                            </TableCell>
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
      </ContentLoading>
    </PageContainer>
  );
}
