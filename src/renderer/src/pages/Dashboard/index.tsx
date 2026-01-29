import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@renderer/hooks/redux';
import { formatDateToShow } from '@renderer/utils/date';
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
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const [
        totalBalanceResponse,
        monthSummaryResponse,
        expensesByCategoryResponse,
        incomeVsExpensesResponse,
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
      ]);
      const transactionsResponse = await window.electronAPI.transaction.findAll(
        {
          page: 0,
          size: 10,
        },
      );
      if (totalBalanceResponse.success) {
        setTotalBalance(totalBalanceResponse.data ?? 0);
      }
      if (monthSummaryResponse.success && monthSummaryResponse.data) {
        setMonthSummary(monthSummaryResponse.data);
        const projected =
          (totalBalanceResponse.data ?? 0) +
          (monthSummaryResponse.data.totalIncome -
            monthSummaryResponse.data.totalExpenses);
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
              new Date(b.transactionDate).getTime() -
              new Date(a.transactionDate).getTime(),
          )
          .slice(0, 5);
        setRecentTransactions(sortedTransactions);
        const now = new Date();
        const sevenDaysFromNow = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        const bills = transactionsResponse.data.content
          .filter((t) => {
            if (t.type !== 'expense' || !t.dueDate) return false;
            const dueDate = new Date(t.dueDate);
            return dueDate >= now && dueDate <= sevenDaysFromNow;
          })
          .map((t) => {
            const dueDate = new Date(t.dueDate!);
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
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  if (loading) {
    return (
      <DashboardContainer>
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" mt={2}>
            Carregando dados...
          </Typography>
        </Stack>
      </DashboardContainer>
    );
  }
  if (error) {
    return (
      <DashboardContainer>
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <WarningIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <IconButton onClick={loadDashboardData} sx={{ mt: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </DashboardContainer>
    );
  }
  return (
    <DashboardContainer>
      {}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Visão Geral Financeira
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary">
              Olá, {user.name}! Aqui está o resumo das suas finanças.
            </Typography>
          )}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
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
      </Stack>
      {}
      <Grid container spacing={3} mb={4}>
        {}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard $variant="primary">
            <SummaryCardIcon $variant="primary">
              <WalletIcon />
            </SummaryCardIcon>
            <SummaryCardContent>
              <SummaryCardLabel>Saldo Total</SummaryCardLabel>
              <SummaryCardValue $negative={totalBalance < 0}>
                {formatCurrency(totalBalance)}
              </SummaryCardValue>
            </SummaryCardContent>
          </SummaryCard>
        </Grid>
        {}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard $variant="info">
            <SummaryCardIcon $variant="info">
              <CalendarIcon />
            </SummaryCardIcon>
            <SummaryCardContent>
              <SummaryCardLabel>Saldo Previsto</SummaryCardLabel>
              <SummaryCardValue $negative={projectedBalance < 0}>
                {formatCurrency(projectedBalance)}
              </SummaryCardValue>
            </SummaryCardContent>
          </SummaryCard>
        </Grid>
        {}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard $variant="success">
            <SummaryCardIcon $variant="success">
              <TrendingUpIcon />
            </SummaryCardIcon>
            <SummaryCardContent>
              <SummaryCardLabel>Receitas do Mês</SummaryCardLabel>
              <SummaryCardValue>
                {formatCurrency(monthSummary?.totalIncome ?? 0)}
              </SummaryCardValue>
            </SummaryCardContent>
          </SummaryCard>
        </Grid>
        {}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard $variant="error">
            <SummaryCardIcon $variant="error">
              <TrendingDownIcon />
            </SummaryCardIcon>
            <SummaryCardContent>
              <SummaryCardLabel>Despesas do Mês</SummaryCardLabel>
              <SummaryCardValue>
                {formatCurrency(monthSummary?.totalExpenses ?? 0)}
              </SummaryCardValue>
            </SummaryCardContent>
          </SummaryCard>
        </Grid>
      </Grid>
      {}
      <Grid container spacing={3}>
        {}
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
        {}
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
        {}
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
        {}
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
    </DashboardContainer>
  );
}
