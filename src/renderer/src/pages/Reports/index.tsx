import { useRequestSequence } from '@renderer/hooks/requestSequence';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { FilterPanel, MonthRangeFields } from '@renderer/components/Filters';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { AppAlert as Alert } from '@renderer/components/Feedback';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  RefreshOutlined as RefreshIcon,
  TrendingUpOutlined as IncomeIcon,
  TrendingDownOutlined as ExpenseIcon,
  AccountBalanceOutlined as BalanceIcon,
  PictureAsPdfOutlined as PdfIcon,
  TableChartOutlined as CsvIcon,
} from '@mui/icons-material';
import { CategoryChart } from '@renderer/components/Charts/CategoryChart';
import { IncomeExpenseChart } from '@renderer/components/Charts/IncomeExpenseChart';
import {
  ReportsContainer,
  SummaryContainer,
  SummaryCard,
  SummaryIcon,
  SummaryValue,
  SummaryLabel,
  ChartsContainer,
  ChartCard,
  ChartHeader,
  ExportButtonsContainer,
} from './styles';
import type { ReportFilters } from '@shared/interfaces/types/report.types';
import type { Category } from '@shared/interfaces/types/category.types';
import type { Account } from '@shared/interfaces/types/account.types';
import type { CategoryExpense } from '@shared/interfaces/types/transaction.types';
import type { IncomeVsExpense } from '@shared/interfaces/types/report.types';
import type { TransactionType } from '@shared/interfaces/types/transaction.types';
import { formatCurrency } from '@renderer/utils/currency';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
interface FilterState {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  categoryId: number | '';
  accountId: number | '';
  type: TransactionType | '';
}
interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}
export function ReportsPage() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const [filters, setFilters] = useState<FilterState>({
    startMonth: currentMonth,
    startYear: currentYear,
    endMonth: currentMonth,
    endYear: currentYear,
    categoryId: '',
    accountId: '',
    type: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<
    CategoryExpense[]
  >([]);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState<IncomeVsExpense[]>(
    [],
  );
  const [summary, setSummary] = useState<ReportSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await window.electronAPI.category.findAll();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);
  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const response = await window.electronAPI.account.findAll();
      if (response.success && response.data) {
        setAccounts(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);
  const buildReportFilters = (): ReportFilters => {
    const startDate = new Date(filters.startYear, filters.startMonth - 1, 1);
    const endDate = new Date(filters.endYear, filters.endMonth, 0);
    return {
      startDate,
      endDate,
      categoryId: filters.categoryId !== '' ? filters.categoryId : undefined,
      accountId: filters.accountId !== '' ? filters.accountId : undefined,
      type: filters.type !== '' ? filters.type : undefined,
    };
  };
  const { begin, isCurrent } = useRequestSequence();
  const loadReportData = useCallback(async () => {
    const requestId = begin();
    setLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.report.generateReport({
        startDate: new Date(filters.startYear, filters.startMonth - 1, 1),
        endDate: new Date(filters.endYear, filters.endMonth, 0),
        categoryId: filters.categoryId || undefined,
        accountId: filters.accountId || undefined,
        type: filters.type || undefined,
      });
      if (!isCurrent(requestId)) return;
      if (!response.success || !response.data)
        throw new Error(response.error || 'Erro ao carregar relatório.');
      setExpensesByCategory(response.data.summary.expensesByCategory);
      setIncomeVsExpenses(response.data.incomeVsExpenses);
      setSummary(response.data.summary);
    } catch (err) {
      if (!isCurrent(requestId)) return;
      console.error('Erro ao carregar dados do relatório:', err);
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar relatório.',
      );
    } finally {
      if (isCurrent(requestId)) setLoading(false);
    }
  }, [filters, begin, isCurrent]);
  useEffect(() => {
    loadCategories();
    loadAccounts();
  }, [loadCategories, loadAccounts]);
  useEffect(() => {
    if (!loadingCategories && !loadingAccounts) {
      loadReportData();
    }
  }, [loadReportData, loadingCategories, loadingAccounts]);
  const handleFilterChange = (
    field: keyof FilterState,
    value: string | number,
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      const startDate = new Date(
        newFilters.startYear,
        newFilters.startMonth - 1,
      );
      const endDate = new Date(newFilters.endYear, newFilters.endMonth - 1);
      if (endDate < startDate) {
        if (field === 'startMonth' || field === 'startYear') {
          newFilters.endMonth = newFilters.startMonth;
          newFilters.endYear = newFilters.startYear;
        } else {
          newFilters.startMonth = newFilters.endMonth;
          newFilters.startYear = newFilters.endYear;
        }
      }
      return newFilters;
    });
  };
  const handleClearFilters = () => {
    setFilters({
      startMonth: currentMonth,
      startYear: currentYear,
      endMonth: currentMonth,
      endYear: currentYear,
      categoryId: '',
      accountId: '',
      type: '',
    });
  };
  const handleExportPdf = async () => {
    setExportingPdf(true);
    setExportSuccess(null);
    try {
      const reportFilters = buildReportFilters();
      const response =
        await window.electronAPI.report.generatePDF(reportFilters);
      if (response.success && response.data) {
        setExportSuccess(
          `PDF exportado com sucesso: ${response.data.filePath}`,
        );
      } else {
        setError(response.error ?? 'Erro ao exportar PDF');
      }
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      setError('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setExportingPdf(false);
    }
  };
  const handleExportCsv = async () => {
    setExportingCsv(true);
    setExportSuccess(null);
    try {
      const reportFilters = buildReportFilters();
      const response =
        await window.electronAPI.report.generateCSV(reportFilters);
      if (response.success && response.data) {
        setExportSuccess(
          `CSV exportado com sucesso: ${response.data.filePath}`,
        );
      } else {
        setError(response.error ?? 'Erro ao exportar CSV');
      }
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      setError('Erro ao exportar CSV. Tente novamente.');
    } finally {
      setExportingCsv(false);
    }
  };
  const formatPeriod = (): string => {
    const startMonthName = MONTH_NAMES[filters.startMonth - 1];
    const endMonthName = MONTH_NAMES[filters.endMonth - 1];
    if (
      filters.startMonth === filters.endMonth &&
      filters.startYear === filters.endYear
    ) {
      return `${startMonthName}/${filters.startYear}`;
    }
    return `${startMonthName}/${filters.startYear} - ${endMonthName}/${filters.endYear}`;
  };
  const hasData =
    expensesByCategory.length > 0 ||
    incomeVsExpenses.length > 0 ||
    summary.totalIncome > 0 ||
    summary.totalExpenses > 0;

  return (
    <ReportsContainer>
      <PageHeader
        title="Relatórios"
        description={formatPeriod()}
        actions={
          <>
            <ExportButtonsContainer>
              <Tooltip title="Atualizar dados">
                <IconButton onClick={loadReportData} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={
                  exportingCsv ? <CircularProgress size={16} /> : <CsvIcon />
                }
                onClick={handleExportCsv}
                disabled={exportingCsv || !hasData}
              >
                Exportar CSV
              </Button>
              <Button
                variant="contained"
                startIcon={
                  exportingPdf ? <CircularProgress size={16} /> : <PdfIcon />
                }
                onClick={handleExportPdf}
                disabled={exportingPdf || !hasData}
              >
                Exportar PDF
              </Button>
            </ExportButtonsContainer>
          </>
        }
      />

      {exportSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setExportSuccess(null)}
        >
          {exportSuccess}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <FilterPanel onClear={handleClearFilters}>
        <MonthRangeFields
          value={filters}
          onChange={(range) => setFilters((prev) => ({ ...prev, ...range }))}
        />
        <SelectInput
          label="Categoria"
          fullWidth
          value={filters.categoryId}
          items={[
            { value: '', label: 'Todas' },
            ...categories.map((item) => ({ value: item.id, label: item.name })),
          ]}
          onChange={(e) =>
            handleFilterChange('categoryId', e.target.value as string | number)
          }
        />
        <SelectInput
          label="Conta"
          fullWidth
          value={filters.accountId}
          items={[
            { value: '', label: 'Todas' },
            ...accounts.map((item) => ({ value: item.id, label: item.name })),
          ]}
          onChange={(e) =>
            handleFilterChange('accountId', e.target.value as string | number)
          }
        />
        <SelectInput
          label="Tipo"
          fullWidth
          value={filters.type}
          items={[
            { value: '', label: 'Todos' },
            { value: 'income', label: 'Receitas' },
            { value: 'expense', label: 'Despesas' },
          ]}
          onChange={(e) => handleFilterChange('type', e.target.value as string)}
        />
      </FilterPanel>
      <ContentLoading
        loading={loading || loadingCategories || loadingAccounts}
        initial="inline"
      >
        {
          <>
            <SummaryContainer>
              <SummaryCard $variant="income">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <SummaryIcon $variant="income">
                    <IncomeIcon />
                  </SummaryIcon>
                  <Box>
                    <SummaryLabel>Total de Receitas</SummaryLabel>
                    <SummaryValue $variant="income">
                      {formatCurrency(summary.totalIncome)}
                    </SummaryValue>
                  </Box>
                </Stack>
              </SummaryCard>
              <SummaryCard $variant="expense">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <SummaryIcon $variant="expense">
                    <ExpenseIcon />
                  </SummaryIcon>
                  <Box>
                    <SummaryLabel>Total de Despesas</SummaryLabel>
                    <SummaryValue $variant="expense">
                      {formatCurrency(summary.totalExpenses)}
                    </SummaryValue>
                  </Box>
                </Stack>
              </SummaryCard>
              <SummaryCard $variant="balance">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <SummaryIcon $variant="balance">
                    <BalanceIcon />
                  </SummaryIcon>
                  <Box>
                    <SummaryLabel>Saldo do Período</SummaryLabel>
                    <SummaryValue $variant="balance">
                      {formatCurrency(summary.balance)}
                    </SummaryValue>
                  </Box>
                </Stack>
              </SummaryCard>
            </SummaryContainer>

            <ChartsContainer>
              <ChartCard>
                <ChartHeader>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Despesas por Categoria
                  </Typography>
                </ChartHeader>
                <CategoryChart data={expensesByCategory} />
              </ChartCard>

              <ChartCard>
                <ChartHeader>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Receitas vs Despesas
                  </Typography>
                </ChartHeader>
                <IncomeExpenseChart data={incomeVsExpenses} />
              </ChartCard>
            </ChartsContainer>
          </>
        }
      </ContentLoading>
    </ReportsContainer>
  );
}
