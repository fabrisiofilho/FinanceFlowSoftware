import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  PublicRounded,
  RefreshRounded,
  OpenInNewRounded,
  CurrencyExchangeRounded,
  PercentRounded,
  ShowChartRounded,
} from '@mui/icons-material';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import { PageHeader } from '@renderer/components/PageHeader';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { AppAlert } from '@renderer/components/Feedback';
import { Input } from '@renderer/components/Form/Input';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { formatCurrency } from '@renderer/utils/currency';
import { formatDateToShow } from '@renderer/utils/date';
import { ipcaTwelveMonths } from '@shared/external-data';
import {
  EXTERNAL_INDICATORS,
  indicatorSource,
  type ExternalIndicatorId,
  type ExternalDataSnapshot,
  type IndicatorPoint,
} from '@shared/interfaces/types/external-data.types';

function number(value: number, digits = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
function History({
  points,
  currency,
  unit,
}: {
  points: IndicatorPoint[];
  currency: boolean;
  unit: string;
}) {
  const [selected, setSelected] = useState<number | null>(null),
    [showValues, setShowValues] = useState(false);
  const values = points.slice(-20),
    low = Math.min(...values.map((p) => p.value)),
    high = Math.max(...values.map((p) => p.value)),
    range = high - low || Math.max(Math.abs(high) * 0.01, 0.01);
  const active = Math.min(selected ?? values.length - 1, values.length - 1),
    publication = values[active];
  const label = (point: IndicatorPoint): string =>
    `${currency ? 'R$ ' : ''}${number(point.value, 4)} ${unit}`;
  return (
    <Box component="figure" sx={{ m: 0, my: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        flexWrap="wrap"
        mb={1}
      >
        <Box aria-live="polite" data-chart-value>
          <Typography variant="caption" color="text.secondary">
            {formatDateToShow(publication.date)}
          </Typography>
          <Typography fontWeight={700} color="primary">
            {label(publication)}
          </Typography>
        </Box>
        <Button
          size="small"
          aria-pressed={showValues}
          onClick={() => setShowValues(!showValues)}
        >
          {showValues ? 'Ocultar valores' : 'Mostrar valores'}
        </Button>
      </Stack>
      <svg
        viewBox="0 0 600 170"
        role="group"
        aria-label="Histórico das últimas publicações"
        style={{ width: '100%', maxHeight: 200 }}
      >
        {[30, 85, 140].map((y) => (
          <line
            key={y}
            x1="12"
            x2="588"
            y1={y}
            y2={y}
            stroke="#30353f"
            strokeDasharray="4 6"
          />
        ))}
        <polyline
          fill="none"
          stroke="#9bd9b5"
          strokeWidth="2.5"
          points={values
            .map(
              (p, i) =>
                `${20 + (i / Math.max(1, values.length - 1)) * 560},${140 - ((p.value - low) / range) * 110}`,
            )
            .join(' ')}
        />
        {values.map((point, i) => (
          <g
            key={point.date}
            data-chart-point
            tabIndex={0}
            role="button"
            aria-label={`${formatDateToShow(point.date)}: ${label(point)}`}
            aria-pressed={active === i}
            onPointerEnter={() => setSelected(i)}
            onFocus={() => setSelected(i)}
            onClick={() => setSelected(i)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelected(i);
              }
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                const next = Math.max(
                  0,
                  Math.min(
                    values.length - 1,
                    i + (event.key === 'ArrowRight' ? 1 : -1),
                  ),
                );
                setSelected(next);
                event.currentTarget.parentElement
                  ?.querySelectorAll<SVGGElement>('[data-chart-point]')
                  [next]?.focus();
              }
            }}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            <circle
              cx={20 + (i / Math.max(1, values.length - 1)) * 560}
              cy={140 - ((point.value - low) / range) * 110}
              r="14"
              fill="transparent"
            />
            <circle
              cx={20 + (i / Math.max(1, values.length - 1)) * 560}
              cy={140 - ((point.value - low) / range) * 110}
              r={active === i ? 6 : 3}
              fill="#9bd9b5"
              stroke={active === i ? '#e6fff0' : 'none'}
              strokeWidth="2"
            >
              <title>
                {formatDateToShow(point.date)}: {label(point)}
              </title>
            </circle>
            {showValues && (
              <text
                x={20 + (i / Math.max(1, values.length - 1)) * 560}
                y={Math.max(
                  14,
                  128 - ((point.value - low) / range) * 110 - (i % 2) * 16,
                )}
                textAnchor={
                  i === 0 ? 'start' : i === values.length - 1 ? 'end' : 'middle'
                }
                fill="#e7edf2"
                fontSize="11"
                paintOrder="stroke"
                stroke="#191c22"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                {number(point.value, currency ? 4 : 3)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {formatDateToShow(values[0].date)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDateToShow(values.at(-1)!.date)}
        </Typography>
      </Stack>
      <Typography
        component="figcaption"
        variant="caption"
        color="text.secondary"
      >
        Passe o mouse, toque ou use Tab e as setas nos pontos para consultar
        data e valor. Até 20 publicações; dias sem publicação não são
        preenchidos.
      </Typography>
    </Box>
  );
}

export function ExternalDataPage() {
  const [snapshot, setSnapshot] = useState<ExternalDataSnapshot>(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [selected, setSelected] = useState<ExternalIndicatorId>('usd'),
    [group, setGroup] = useState('Todos');
  const [currency, setCurrency] = useState<'usd' | 'eur'>('usd'),
    [amount, setAmount] = useState('100'),
    [now, setNow] = useState(Date.now);
  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError('');
    try {
      const result = await window.electronAPI.externalData.snapshot(refresh);
      if (!result.success || !result.data)
        throw new Error(result.error || 'Não foi possível consultar os dados.');
      setSnapshot(result.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Não foi possível consultar os dados.',
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = snapshot?.nextRefreshAt
    ? Math.max(0, Math.ceil((Date.parse(snapshot.nextRefreshAt) - now) / 1000))
    : 0;
  const spec = EXTERNAL_INDICATORS.find((item) => item.id === selected)!;
  const current = snapshot?.indicators.find((item) => item.id === selected),
    points = current?.points ?? [];
  const quote = snapshot?.indicators.find((item) => item.id === currency),
    rate = quote?.points.at(-1);
  const amountValid = /^\d{1,9}(?:[.,]\d{1,2})?$/.test(amount),
    numeric = Number(amount.replace(',', '.'));
  const ipca = snapshot?.indicators.find((item) => item.id === 'ipca'),
    accumulated = ipcaTwelveMonths(ipca?.points ?? []);
  return (
    <PageContainer>
      <PageHeader
        title="Dados externos"
        description="Câmbio, juros e inflação para acompanhar o cenário das suas finanças."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshRounded />}
            disabled={loading || remaining > 0}
            onClick={() => void load(true)}
          >
            {loading
              ? 'Consultando…'
              : remaining
                ? `Atualizar em ${remaining}s`
                : 'Atualizar dados'}
          </Button>
        }
      />
      <AppAlert severity="info" sx={{ mb: 3 }}>
        Referências públicas do Banco Central (SGS). Cada indicador tem sua
        própria data de publicação. Cotações não são em tempo real e não incluem
        custos de câmbio. Esta consulta não altera suas contas ou investimentos.
      </AppAlert>
      {error && (
        <AppAlert
          severity="error"
          action={<Button onClick={() => void load()}>Tentar novamente</Button>}
          sx={{ mb: 2 }}
        >
          {error}
        </AppAlert>
      )}
      <Tabs
        value={group}
        onChange={(_, value) => {
          setGroup(value);
          const first = EXTERNAL_INDICATORS.find(
            (item) => value === 'Todos' || item.group === value,
          );
          if (first) setSelected(first.id);
        }}
        variant="scrollable"
        sx={{ mb: 3 }}
      >
        {['Todos', 'Câmbio', 'Juros', 'Inflação'].map((label) => (
          <Tab key={label} value={label} label={label} />
        ))}
      </Tabs>
      <ContentLoading loading={loading} initial="cards">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2,1fr)',
              lg: 'repeat(3,1fr)',
            },
            gap: 2,
            mb: 3,
          }}
        >
          {EXTERNAL_INDICATORS.filter(
            (item) => group === 'Todos' || item.group === group,
          ).map((item) => {
            const data = snapshot?.indicators.find(
                (data) => data.id === item.id,
              ),
              latest = data?.points.at(-1),
              isCurrency = item.group === 'Câmbio';
            return (
              <ContentSurface
                key={item.id}
                sx={{
                  borderColor:
                    selected === item.id ? 'primary.main' : 'divider',
                }}
              >
                <ButtonBase
                  onClick={() => setSelected(item.id)}
                  aria-pressed={selected === item.id}
                  aria-label={`Ver histórico de ${item.name}`}
                  sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    p: 3,
                    '&.Mui-focusVisible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: -4,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <Stack direction="row" gap={1} alignItems="center">
                      {isCurrency ? (
                        <CurrencyExchangeRounded color="primary" />
                      ) : item.id === 'ipca' ? (
                        <ShowChartRounded color="primary" />
                      ) : (
                        <PercentRounded color="primary" />
                      )}
                      <Typography fontWeight={600}>{item.name}</Typography>
                    </Stack>
                    <Chip
                      size="small"
                      label={
                        data?.status === 'fresh'
                          ? 'Consultado agora'
                          : data?.status === 'cached'
                            ? 'Em cache'
                            : 'Indisponível'
                      }
                      color={data?.error ? 'warning' : 'default'}
                    />
                  </Stack>
                  <Typography variant="h4" fontWeight={650}>
                    {latest
                      ? `${isCurrency ? 'R$ ' : ''}${number(latest.value, isCurrency ? 4 : item.id === 'cdi' ? 4 : 2)}${isCurrency ? '' : '%'}`
                      : '—'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {item.unit} ·{' '}
                    {latest
                      ? `Referência: ${item.frequency === 'monthly' ? latest.date.slice(0, 7).split('-').reverse().join('/') : formatDateToShow(latest.date)}`
                      : 'Sem publicação disponível'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 1.5 }}
                  >
                    Banco Central · SGS {item.series} · Ver histórico →
                  </Typography>
                </ButtonBase>
              </ContentSurface>
            );
          })}
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(0,1.5fr) minmax(0,1fr)',
            },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <ContentSurface sx={{ p: 3 }}>
            <Stack
              direction="row"
              gap={2}
              justifyContent="space-between"
              flexWrap="wrap"
            >
              <Box>
                <Typography variant="overline" color="text.secondary">
                  HISTÓRICO E CONTEXTO
                </Typography>
                <Typography variant="h6">{spec.name}</Typography>
              </Box>
              <Button
                size="small"
                startIcon={<OpenInNewRounded />}
                onClick={() =>
                  window.electronAPI.openExternalUrl(
                    indicatorSource(spec.series),
                  )
                }
              >
                Ver fonte
              </Button>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {spec.description}
            </Typography>
            {current?.error && (
              <AppAlert severity="warning" sx={{ mt: 2 }}>
                {current.error}
              </AppAlert>
            )}
            {current?.checkedAt && (
              <Typography variant="caption" color="text.secondary">
                Última consulta bem-sucedida:{' '}
                {new Date(current.checkedAt).toLocaleString('pt-BR')}
              </Typography>
            )}
            {points.length ? (
              <>
                <History
                  key={spec.id}
                  points={points}
                  currency={spec.group === 'Câmbio'}
                  unit={spec.unit}
                />
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <Table
                    size="small"
                    stickyHeader
                    aria-label={`Publicações de ${spec.name}`}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Referência</TableCell>
                        <TableCell align="right">Valor ({spec.unit})</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {points
                        .slice(-20)
                        .reverse()
                        .map((point) => (
                          <TableRow key={point.date}>
                            <TableCell>
                              {formatDateToShow(point.date)}
                            </TableCell>
                            <TableCell align="right">
                              {number(
                                point.value,
                                spec.group === 'Câmbio' ? 4 : 4,
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            ) : (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <PublicRounded
                  sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }}
                />
                <Typography>Sem dados para exibir.</Typography>
                <Typography variant="body2" color="text.secondary">
                  Conecte-se à internet e tente atualizar. Uma consulta salva
                  ficará disponível offline.
                </Typography>
              </Box>
            )}
          </ContentSurface>
          <Stack spacing={3}>
            <ContentSurface sx={{ p: 3 }}>
              <Stack spacing={2}>
                <CurrencyExchangeRounded color="primary" />
                <Typography variant="h6">Conversor de referência</Typography>
                <Typography variant="body2" color="text.secondary">
                  Uma estimativa simples usando a última cotação de venda
                  publicada.
                </Typography>
                <SelectInput
                  label="Moeda de origem"
                  value={currency}
                  items={[
                    { value: 'usd', label: 'Dólar americano (US$)' },
                    { value: 'eur', label: 'Euro (€)' },
                  ]}
                  onChange={(event) =>
                    setCurrency(event.target.value as 'usd' | 'eur')
                  }
                />
                <Input
                  label={`Valor em ${currency === 'usd' ? 'dólares' : 'euros'}`}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  error={!amountValid}
                  helperText={
                    !amountValid
                      ? 'Informe até duas casas decimais.'
                      : 'Use ponto ou vírgula como separador decimal.'
                  }
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                />
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Equivalente aproximado em reais
                  </Typography>
                  <Typography variant="h4">
                    {rate && amountValid
                      ? formatCurrency(
                          Math.round(numeric * 100 * rate.value) / 100,
                        )
                      : '—'}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {rate
                    ? `Cotação de ${formatDateToShow(rate.date)}${quote?.status === 'cached' ? ' · consulta salva' : ''}. `
                    : ''}
                  Não inclui IOF, spread ou tarifas e não registra movimentação.
                </Typography>
              </Stack>
            </ContentSurface>
            <ContentSurface sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">
                  PODER DE COMPRA
                </Typography>
                <Typography variant="h6">IPCA acumulado em 12 meses</Typography>
                <Typography variant="h4">
                  {accumulated === null ? '—' : number(accumulated) + '%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {accumulated === null
                    ? 'São necessárias 12 publicações mensais consecutivas.'
                    : 'Calculado pela composição das últimas 12 variações mensais publicadas, sem somar as taxas.'}
                </Typography>
                {ipca?.points.at(-1) && (
                  <Typography variant="caption" color="text.secondary">
                    Até{' '}
                    {ipca.points
                      .at(-1)!
                      .date.slice(0, 7)
                      .split('-')
                      .reverse()
                      .join('/')}
                    {ipca.status === 'cached' ? ' · em cache' : ''}
                  </Typography>
                )}
              </Stack>
            </ContentSurface>
            <Typography variant="caption" color="text.secondary">
              Atualização sob demanda, com cache de 30 minutos e intervalo
              mínimo de um minuto entre consultas. Nenhum dado financeiro do seu
              perfil é enviado à fonte.
            </Typography>
          </Stack>
        </Box>
      </ContentLoading>
    </PageContainer>
  );
}
