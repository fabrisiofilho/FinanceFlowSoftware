import { useRequestSequence } from '@renderer/hooks/requestSequence';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { AppAlert } from '@renderer/components/Feedback';
import { ExpandableCard as Card } from '@renderer/components/ExpandableCard';
import { MonthField } from '@renderer/components/Form/MonthField';
import { InvestmentOverview } from './InvestmentOverview';

import { useEffect, useState, useCallback } from 'react';
import {
  Grid,
  CardContent,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined as WalletIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  CalendarMonthOutlined as CalendarIcon,
  RefreshOutlined as RefreshIcon,
  ReceiptOutlined as ReceiptIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@renderer/hooks/redux';
import { formatDateToShow, parseDateSafe } from '@renderer/utils/date';
import {
  DashboardContainer,
  SummaryCard,
  SummaryCardIcon,
  SummaryCardContent,
  SummaryCardValue,
  SummaryCardLabel,
  SectionTitle,
  TransactionItem,
  TransactionIcon,
  TransactionInfo,
  TransactionAmount,
  BillItem,
  BillInfo,
  BillAmount,
  BillDueDate,
  EmptyState,
} from './styles';
import { CategoryChart, IncomeExpenseChart } from '@renderer/components/Charts';
import type {
  MonthSummary,
  CategoryExpense,
  Transaction,
} from '@shared/interfaces/types/transaction.types';
import type { IncomeVsExpense } from '@shared/interfaces/types/report.types';
interface UpcomingBill {
  id: number;
  description: string;
  amount: number;
  dueDate: Date;
  categoryName: string;
  accountName: string;
  isOverdue: boolean;
  daysUntilDue: number;
}
import { formatCurrency } from '@renderer/utils/currency';

export function DashboardPage() {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [projectedBalance, setProjectedBalance] = useState(0);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<
    CategoryExpense[]
  >([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState<IncomeVsExpense[]>(
    [],
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  const { begin, isCurrent } = useRequestSequence();
  const loadDashboardData = useCallback(async () => {
    const requestId = begin();
    setLoading(true);
    setError(null);
    try {
      const [currentYear, currentMonth] = period.split('-').map(Number);
      const [
        totalBalanceResponse,
        monthSummaryResponse,
        expensesByCategoryResponse,
        incomeVsExpensesResponse,
        upcomingResponse,
      ] = await Promise.all([
        window.electronAPI.account.getTotalBalance(),
        window.electronAPI.transaction.getMonthSummary(
          currentYear,
          currentMonth,
        ),
        window.electronAPI.report.getExpensesByCategory(
          currentYear,
          currentMonth,
        ),
        window.electronAPI.report.getIncomeVsExpenses(6),
        window.electronAPI.transaction.findUpcomingBills(7),
      ]);
      const transactionsResponse = await window.electronAPI.transaction.findAll(
        {
          page: 0,
          size: 10,
          sort: { field: 'transactionDate', direction: 'DESC' },
        },
      );
      if (!isCurrent(requestId)) return;
      if (
        !totalBalanceResponse.success ||
        !monthSummaryResponse.success ||
        !expensesByCategoryResponse.success ||
        !incomeVsExpensesResponse.success ||
        !transactionsResponse.success ||
        !upcomingResponse.success
      ) {
        throw new Error(
          'Não foi possível carregar todos os dados financeiros.',
        );
      }
      if (totalBalanceResponse.success) {
        setTotalBalance(totalBalanceResponse.data ?? 0);
      }
      if (monthSummaryResponse.success && monthSummaryResponse.data) {
        setMonthSummary(monthSummaryResponse.data);
        const projected =
          monthSummaryResponse.data.totalIncome -
          monthSummaryResponse.data.totalExpenses;
        setProjectedBalance(projected);
      }
      if (
        expensesByCategoryResponse.success &&
        expensesByCategoryResponse.data
      ) {
        setExpensesByCategory(expensesByCategoryResponse.data);
      }
      if (incomeVsExpensesResponse.success && incomeVsExpensesResponse.data) {
        setIncomeVsExpenses(incomeVsExpensesResponse.data);
      }
      if (transactionsResponse.success && transactionsResponse.data) {
        const sortedTransactions = transactionsResponse.data.content
          .sort(
            (a, b) =>
              (parseDateSafe(b.transactionDate)?.getTime() ?? 0) -
              (parseDateSafe(a.transactionDate)?.getTime() ?? 0),
          )
          .slice(0, 5);
        setRecentTransactions(sortedTransactions);
        const now = new Date();
        const sevenDaysFromNow = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        const bills = (upcomingResponse.data ?? [])
          .filter((t) => {
            if (t.type !== 'expense' || t.status !== 'pending' || !t.dueDate)
              return false;
            const dueDate = parseDateSafe(t.dueDate);
            return dueDate && dueDate >= now && dueDate <= sevenDaysFromNow;
          })
          .map((t) => {
            const dueDate = parseDateSafe(t.dueDate!) ?? new Date();
            const diffTime = dueDate.getTime() - now.getTime();
            const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
              id: t.id,
              description: t.description,
              amount: t.amount,
              dueDate: dueDate,
              categoryName: 'Categoria',
              accountName: 'Conta',
              isOverdue: daysUntilDue < 0,
              daysUntilDue,
            };
          })
          .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
          .slice(0, 5);
        setUpcomingBills(bills);
      }
      setLastUpdated(new Date());
    } catch (err) {
      if (!isCurrent(requestId)) return;
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      if (isCurrent(requestId)) setLoading(false);
    }
  }, [period, begin, isCurrent]);
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <DashboardContainer>
      <PageHeader
        title="Visão geral"
        description={
          user
            ? `Olá, ${user.name}! Acompanhe suas finanças e o período selecionado.`
            : 'Acompanhe suas finanças e o período selecionado.'
        }
        actions={
          <>
            <Stack direction="row" alignItems="center" spacing={1}>
              <MonthField
                label="Mês de referência"
                value={period}
                onChange={setPeriod}
                fullWidth={false}
              />
              {lastUpdated && (
                <Typography variant="caption" color="text.secondary">
                  Atualizado em {formatDateToShow(lastUpdated)}
                </Typography>
              )}
              <Tooltip title="Atualizar dados">
                <IconButton onClick={loadDashboardData} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </>
        }
      />
      <ContentLoading loading={loading} initial="inline">
        {error && (
          <AppAlert severity="error" sx={{ mb: 3 }}>
            {error}
          </AppAlert>
        )}

        <AppAlert severity="info" sx={{ mb: 3 }}>
          Por competência: receitas{' '}
          {formatCurrency(monthSummary?.totalIncome ?? 0)} · despesas{' '}
          {formatCurrency(monthSummary?.totalExpenses ?? 0)} · resultado{' '}
          {formatCurrency(projectedBalance)}. Pendentes: receitas{' '}
          {formatCurrency(monthSummary?.pendingIncome ?? 0)} · despesas{' '}
          {formatCurrency(monthSummary?.pendingExpenses ?? 0)}.
        </AppAlert>
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard $variant="primary">
              <SummaryCardIcon $variant="primary">
                <WalletIcon />
              </SummaryCardIcon>
              <SummaryCardContent>
                <SummaryCardLabel>Saldo atual das contas</SummaryCardLabel>
                <SummaryCardValue $negative={totalBalance < 0}>
                  {formatCurrency(totalBalance)}
                </SummaryCardValue>
              </SummaryCardContent>
            </SummaryCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard $variant="info">
              <SummaryCardIcon $variant="info">
                <CalendarIcon />
              </SummaryCardIcon>
              <SummaryCardContent>
                <SummaryCardLabel>Resultado realizado</SummaryCardLabel>
                <SummaryCardValue
                  $negative={
                    (monthSummary?.received ?? 0) - (monthSummary?.paid ?? 0) <
                    0
                  }
                >
                  {formatCurrency(
                    (monthSummary?.received ?? 0) - (monthSummary?.paid ?? 0),
                  )}
                </SummaryCardValue>
              </SummaryCardContent>
            </SummaryCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard $variant="success">
              <SummaryCardIcon $variant="success">
                <TrendingUpIcon />
              </SummaryCardIcon>
              <SummaryCardContent>
                <SummaryCardLabel>Recebido no mês</SummaryCardLabel>
                <SummaryCardValue>
                  {formatCurrency(monthSummary?.received ?? 0)}
                </SummaryCardValue>
              </SummaryCardContent>
            </SummaryCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard $variant="error">
              <SummaryCardIcon $variant="error">
                <TrendingDownIcon />
              </SummaryCardIcon>
              <SummaryCardContent>
                <SummaryCardLabel>Pago no mês</SummaryCardLabel>
                <SummaryCardValue>
                  {formatCurrency(monthSummary?.paid ?? 0)}
                </SummaryCardValue>
              </SummaryCardContent>
            </SummaryCard>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <SectionTitle>
                  <Typography variant="h6" fontWeight={600}>
                    Gastos por Categoria
                  </Typography>
                </SectionTitle>
                <CategoryChart
                  data={expensesByCategory}
                  emptyMessage="Nenhuma despesa registrada este mês"
                  formatCurrency={formatCurrency}
                  showColorIndicator
                  showTooltip
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <SectionTitle>
                  <Typography variant="h6" fontWeight={600}>
                    Transações Recentes
                  </Typography>
                </SectionTitle>
                {recentTransactions.length > 0 ? (
                  <Stack spacing={1}>
                    {recentTransactions.map((transaction) => (
                      <TransactionItem key={transaction.id}>
                        <TransactionIcon $type={transaction.type}>
                          {transaction.type === 'income' ? (
                            <TrendingUpIcon fontSize="small" />
                          ) : (
                            <TrendingDownIcon fontSize="small" />
                          )}
                        </TransactionIcon>
                        <TransactionInfo>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {transaction.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateToShow(transaction.transactionDate)}
                          </Typography>
                        </TransactionInfo>
                        <TransactionAmount $type={transaction.type}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </TransactionAmount>
                      </TransactionItem>
                    ))}
                  </Stack>
                ) : (
                  <EmptyState>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma transação registrada
                    </Typography>
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <SectionTitle>
                  <Typography variant="h6" fontWeight={600}>
                    Contas a Pagar
                  </Typography>
                  <Chip
                    label="Próximos 7 dias"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                </SectionTitle>
                {upcomingBills.length > 0 ? (
                  <Stack spacing={1}>
                    {upcomingBills.map((bill) => (
                      <BillItem key={bill.id} $isOverdue={bill.isOverdue}>
                        <ReceiptIcon
                          fontSize="small"
                          color={bill.isOverdue ? 'error' : 'action'}
                        />
                        <BillInfo>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {bill.description}
                          </Typography>
                          <BillDueDate $isOverdue={bill.isOverdue}>
                            {bill.isOverdue
                              ? `Vencida há ${Math.abs(bill.daysUntilDue)} dia(s)`
                              : bill.daysUntilDue === 0
                                ? 'Vence hoje'
                                : `Vence em ${bill.daysUntilDue} dia(s)`}
                          </BillDueDate>
                        </BillInfo>
                        <BillAmount>{formatCurrency(bill.amount)}</BillAmount>
                      </BillItem>
                    ))}
                  </Stack>
                ) : (
                  <EmptyState>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma conta a pagar nos próximos 7 dias
                    </Typography>
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <SectionTitle>
                  <Typography variant="h6" fontWeight={600}>
                    Receitas x Despesas
                  </Typography>
                  <Chip
                    label="Últimos 6 meses"
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </SectionTitle>
                <IncomeExpenseChart
                  data={incomeVsExpenses}
                  emptyMessage="Nenhum dado disponível"
                  formatCurrency={formatCurrency}
                  showLegend
                  showBalance
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <InvestmentOverview period={period} />
      </ContentLoading>
    </DashboardContainer>
  );
}
