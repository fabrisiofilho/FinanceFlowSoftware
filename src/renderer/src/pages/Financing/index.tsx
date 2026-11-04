import { ListPagination } from '@renderer/components/ListPagination';
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import { PageHeader } from '@renderer/components/PageHeader';
import { AppAlert } from '@renderer/components/Feedback';
import { Input } from '@renderer/components/Form/Input';
import { CurrencyInput } from '@renderer/components/Form/CurrencyInput';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { DateStringField } from '@renderer/components/Form/DatePicker/DateStringField';
import { financingSchedule } from '@shared/finance/financing';
import type { FinancingInput } from '@shared/finance/financing';
import type {
  FinancingContract,
  FinancingDetail,
} from '@shared/interfaces/types/financing.types';
import { formatCurrency } from '@renderer/utils/currency';
const money = (n: number) => formatCurrency(n / 100);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const defaults = (): FinancingInput => ({
  name: '',
  creditor: '',
  accountId: 0,
  categoryId: 0,
  method: 'MANUAL',
  principalCents: 0,
  monthlyRatePercent: 0,
  termMonths: 12,
  firstDueDate: today(),
  manualInstallmentCents: 0,
  monthlyFeesCents: 0,
});
export function FinancingPage() {
  const [contracts, setContracts] = useState<FinancingContract[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0),
    [search, setSearch] = useState('');
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [creating, setCreating] = useState(false),
    [input, setInput] = useState(defaults);
  const [detail, setDetail] = useState<FinancingDetail | null>(null),
    [detailPage, setDetailPage] = useState(0);
  const [accounts, setAccounts] = useState<{ value: number; label: string }[]>(
      [],
    ),
    [categories, setCategories] = useState<{ value: number; label: string }[]>(
      [],
    );
  const [payment, setPayment] = useState<number | null>(null),
    [amount, setAmount] = useState(0),
    [principal, setPrincipal] = useState(0),
    [date, setDate] = useState(today),
    [requestId, setRequestId] = useState('');
  const [adjusting, setAdjusting] = useState<number | null>(null),
    [reason, setReason] = useState('');
  const load = useCallback(async () => {
    const r = await window.electronAPI.financing.list(search, page);
    if (!r.success || !r.data)
      throw new Error(r.error || 'Falha ao consultar contratos');
    setContracts(r.data.contracts);
    setTotal(r.data.total);
  }, [search, page]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) void load().catch((e) => setError(String(e)));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [load]);
  useEffect(() => {
    void Promise.all([
      window.electronAPI.account.findAll(),
      window.electronAPI.category.findAll(),
    ])
      .then(([a, c]) => {
        if (a.success)
          setAccounts(
            (a.data ?? [])
              .filter((r) => r.type !== 'credit_card')
              .map((r) => ({ value: r.id, label: r.name })),
          );
        if (c.success)
          setCategories(
            (c.data ?? [])
              .filter((r) => r.type === 'expense')
              .map((r) => ({ value: r.id, label: r.name })),
          );
      })
      .catch((e) => setError(String(e)));
  }, []);
  async function open(id: number, p = 0) {
    const r = await window.electronAPI.financing.detail(id, p);
    if (!r.success || !r.data) throw new Error(r.error || 'Falha ao abrir');
    setDetail(r.data);
    setDetailPage(p);
  }
  async function run(
    action: () => Promise<{ success: boolean; error?: string }>,
    done?: () => void,
  ) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await action();
      if (!r.success) throw new Error(r.error || 'Falha ao salvar');
      await load();
      if (detail) await open(detail.contract.id, detailPage);
      window.dispatchEvent(new Event('finance-data-changed'));
      done?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na operação');
    } finally {
      setBusy(false);
    }
  }
  const change = <K extends keyof FinancingInput>(
    key: K,
    value: FinancingInput[K],
  ) => setInput((old) => ({ ...old, [key]: value }));
  let preview: ReturnType<typeof financingSchedule> = [],
    previewError = '';
  if (creating)
    try {
      preview = financingSchedule(input);
    } catch (e) {
      previewError = e instanceof Error ? e.message : 'Parâmetros inválidos';
    }
  return (
    <PageContainer>
      <PageHeader
        title="Financiamentos"
        description="Parcelas previstas, pagamentos e passivos separados de consumo"
        actions={
          <Button
            onClick={() => {
              setInput(defaults());
              setCreating(true);
              setError('');
            }}
          >
            Novo financiamento
          </Button>
        }
      />
      {error && <AppAlert severity="error">{error}</AppAlert>}
      <Input
        label="Buscar contratos"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
      />
      <Stack gap={2} mt={2}>
        {contracts.map((c) => (
          <ContentSurface key={c.id} sx={{ p: 2 }}>
            <Typography variant="h6">
              {c.name} · {c.creditor}
            </Typography>
            <Typography>
              {c.method} · Próxima parcela: {c.nextDueDate ?? 'sem pendências'}{' '}
              · Saldo devedor:{' '}
              {c.outstandingCents === null
                ? 'não informado'
                : money(c.outstandingCents)}
            </Typography>
            <Button
              onClick={() => void open(c.id).catch((e) => setError(String(e)))}
            >
              Parcelas e histórico
            </Button>
          </ContentSurface>
        ))}
      </Stack>
      {!contracts.length && (
        <AppAlert severity="info">Nenhum contrato para esta busca.</AppAlert>
      )}
      <ListPagination
        count={total}
        page={page}
        rowsPerPage={24}
        onPageChange={(_, next) => setPage(next)}
      />
      <Dialog
        open={creating}
        onClose={() => !busy && setCreating(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Novo financiamento</DialogTitle>
        <DialogContent dividers>
          <Stack gap={2}>
            {error && <AppAlert severity="error">{error}</AppAlert>}
            <Input
              label="Nome"
              required
              value={input.name}
              onChange={(e) => change('name', e.target.value)}
            />
            <Input
              label="Credor"
              required
              value={input.creditor}
              onChange={(e) => change('creditor', e.target.value)}
            />
            <SelectInput
              label="Conta pagadora"
              required
              value={input.accountId}
              items={[{ value: 0, label: 'Selecione' }, ...accounts]}
              onChange={(e) => change('accountId', Number(e.target.value))}
            />
            <SelectInput
              label="Categoria dos juros e encargos"
              required
              value={input.categoryId}
              items={[{ value: 0, label: 'Selecione' }, ...categories]}
              onChange={(e) => change('categoryId', Number(e.target.value))}
            />
            <SelectInput
              label="Método"
              value={input.method}
              items={['MANUAL', 'SAC', 'PRICE'].map((value) => ({
                value,
                label: value,
              }))}
              onChange={(e) =>
                change('method', e.target.value as FinancingInput['method'])
              }
            />
            <CurrencyInput
              label="Principal / saldo na data de corte (opcional no manual)"
              value={input.principalCents / 100}
              onChange={(n) => change('principalCents', Math.round(n * 100))}
            />
            {input.method === 'MANUAL' ? (
              <CurrencyInput
                label="Parcela mensal prevista"
                value={input.manualInstallmentCents / 100}
                onChange={(n) =>
                  change('manualInstallmentCents', Math.round(n * 100))
                }
              />
            ) : (
              <>
                <Input
                  label="Taxa efetiva mensal (%)"
                  type="number"
                  value={input.monthlyRatePercent}
                  onChange={(e) =>
                    change('monthlyRatePercent', Number(e.target.value))
                  }
                />
                <CurrencyInput
                  label="Seguro e taxas por mês"
                  value={input.monthlyFeesCents / 100}
                  onChange={(n) =>
                    change('monthlyFeesCents', Math.round(n * 100))
                  }
                />
              </>
            )}
            <Input
              label="Parcelas remanescentes"
              type="number"
              value={input.termMonths}
              onChange={(e) => change('termMonths', Number(e.target.value))}
            />
            <DateStringField
              label="Primeiro vencimento futuro"
              value={input.firstDueDate}
              onChange={(n) => change('firstDueDate', n)}
            />
            <AppAlert severity="info">
              Projeção sem indexador automático. Taxa mensal efetiva, precisão
              de 0,0001 ponto percentual, juros arredondados por mês e ajuste do
              principal na última parcela. Não cria despesas passadas. Confira o
              contrato do credor antes de confirmar.
            </AppAlert>
            {previewError ? (
              <AppAlert severity="warning">{previewError}</AppAlert>
            ) : (
              <Typography>
                Prévia: primeira parcela {money(preview[0]?.totalCents ?? 0)} ·
                última {money(preview.at(-1)?.totalCents ?? 0)} · total{' '}
                {money(preview.reduce((s, r) => s + r.totalCents, 0))}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setCreating(false)}>
            Cancelar
          </Button>
          <Button
            disabled={
              busy || !!previewError || !input.accountId || !input.categoryId
            }
            onClick={() =>
              void run(
                () => window.electronAPI.financing.create(input),
                () => setCreating(false),
              )
            }
          >
            Confirmar contrato
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!detail}
        onClose={() => !busy && setDetail(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          {detail?.contract.name} · Parcelas e histórico
        </DialogTitle>
        <DialogContent dividers>
          {error && <AppAlert severity="error">{error}</AppAlert>}
          <AppAlert severity="info">
            Pagamento total sai da conta. Principal reduz passivo; somente
            juros/encargos compõem despesa nos relatórios. Informe a divisão
            real do comprovante. Valores previstos podem ser ajustados antes de
            qualquer pagamento.
          </AppAlert>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  'Parcela',
                  'Vencimento',
                  'Principal',
                  'Juros',
                  'Taxas',
                  'Previsto',
                  'Pago',
                  'Ações',
                ].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {detail?.installments.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.number}</TableCell>
                  <TableCell>{i.dueDate}</TableCell>
                  <TableCell>{money(i.principalCents)}</TableCell>
                  <TableCell>{money(i.interestCents)}</TableCell>
                  <TableCell>{money(i.feesCents)}</TableCell>
                  <TableCell>{money(i.totalCents)}</TableCell>
                  <TableCell>{money(i.paidCents)}</TableCell>
                  <TableCell>
                    <Button
                      disabled={busy || i.paidCents >= i.totalCents}
                      onClick={() => {
                        setPayment(i.id);
                        setAdjusting(null);
                        setAmount((i.totalCents - i.paidCents) / 100);
                        setPrincipal(0);
                        setDate(today());
                        setRequestId(crypto.randomUUID());
                      }}
                    >
                      Pagar
                    </Button>
                    <Button
                      disabled={busy || i.paidCents > 0}
                      onClick={() => {
                        setAdjusting(i.id);
                        setPayment(null);
                        setAmount(i.totalCents / 100);
                        setReason('');
                      }}
                    >
                      Ajustar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(payment || adjusting) && (
            <Stack gap={2} mt={2}>
              <CurrencyInput
                label={
                  payment ? 'Valor efetivamente pago' : 'Novo total previsto'
                }
                value={amount}
                onChange={setAmount}
              />
              {payment ? (
                <>
                  <CurrencyInput
                    label="Principal amortizado neste pagamento"
                    value={principal}
                    onChange={setPrincipal}
                  />
                  <DateStringField
                    label="Data do pagamento"
                    value={date}
                    onChange={setDate}
                  />
                  <Typography>
                    Juros/encargos:{' '}
                    {money(Math.round((amount - principal) * 100))}
                  </Typography>
                </>
              ) : (
                <Input
                  label="Justificativa"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
              <Button
                disabled={busy}
                onClick={() =>
                  void run(
                    () =>
                      payment
                        ? window.electronAPI.financing.pay({
                            installmentId: payment,
                            amountCents: Math.round(amount * 100),
                            principalCents: Math.round(principal * 100),
                            paidAt: date,
                            requestId,
                          })
                        : window.electronAPI.financing.adjust(
                            adjusting!,
                            Math.round(amount * 100),
                            reason,
                          ),
                    () => {
                      setPayment(null);
                      setAdjusting(null);
                    },
                  )
                }
              >
                Confirmar
              </Button>
            </Stack>
          )}
          <Typography variant="h6" mt={3}>
            Pagamentos recentes
          </Typography>
          {detail?.payments.map((p) => (
            <Stack key={p.id} direction="row" gap={2}>
              <Typography>
                {p.paidAt} · {money(p.amountCents)} · principal{' '}
                {money(p.principalCents)} {p.reversed ? '· estornado' : ''}
              </Typography>
              <Button
                disabled={busy || !!p.reversed}
                onClick={() =>
                  window.confirm(
                    'Estornar este pagamento e devolver o valor à conta?',
                  ) &&
                  void run(() => window.electronAPI.financing.reverse(p.id))
                }
              >
                Estornar
              </Button>
            </Stack>
          ))}
          {detail && (
            <ListPagination
              count={detail.total}
              page={detailPage}
              rowsPerPage={24}
              disabled={busy}
              onPageChange={(_, next) => void open(detail.contract.id, next)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={busy}
            onClick={() => {
              setDetail(null);
              setPayment(null);
              setAdjusting(null);
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
