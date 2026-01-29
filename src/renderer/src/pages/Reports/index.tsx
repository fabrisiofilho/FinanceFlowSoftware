import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import {
  AssessmentOutlined as ReportsIcon,
  Refresh as RefreshIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  DateRange as DateRangeIcon,
  Category as CategoryIcon,
  AccountBalanceWallet as AccountIcon,
} from '@mui/icons-material';
import { CategoryChart } from '@renderer/components/Charts/CategoryChart';
import { IncomeExpenseChart } from '@renderer/components/Charts/IncomeExpenseChart';
import {
  ReportsContainer,
  PageHeaderContainer,
  FiltersContainer,
  FiltersGrid,
  FilterActionsContainer,
  SummaryContainer,
  SummaryCard,
  SummaryIcon,
  SummaryValue,
  SummaryLabel,
  ChartsContainer,
  ChartCard,
  ChartHeader,
  ExportButtonsContainer,
  EmptyStateContainer,
  LoadingContainer,
  PeriodInfo,
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
const getAvailableYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear - 5; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years;
};
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
  const availableYears = useMemo(() => getAvailableYears(), []);
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
  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startMonth, startYear, endMonth, endYear } = filters;
      const monthsDiff = Math.max(
        1,
        (endYear - startYear) * 12 + (endMonth - startMonth) + 1,
      );
      const categoryResponse =
        await window.electronAPI.report.getExpensesByCategory(
          startYear,
          startMonth,
        );
      if (categoryResponse.success && categoryResponse.data) {
        setExpensesByCategory(categoryResponse.data);
      } else {
        setExpensesByCategory([]);
      }
      const monthsToFetch = Math.max(monthsDiff + 12, 24);
      const incomeExpenseResponse =
        await window.electronAPI.report.getIncomeVsExpenses(monthsToFetch);
      if (incomeExpenseResponse.success && incomeExpenseResponse.data) {
        const filteredData = incomeExpenseResponse.data.filter((item) => {
          const itemYear = item.year;
          const itemMonth = item.month;
          if (itemYear < startYear || itemYear > endYear) return false;
          if (itemYear === startYear && itemMonth < startMonth) return false;
          if (itemYear === endYear && itemMonth > endMonth) return false;
          return true;
        });
        setIncomeVsExpenses(filteredData);
        const totalIncome = filteredData.reduce(
          (sum, item) => sum + item.income,
          0,
        );
        const totalExpenses = filteredData.reduce(
          (sum, item) => sum + item.expense,
          0,
        );
        setSummary({
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
        });
      } else {
        setIncomeVsExpenses([]);
        setSummary({ totalIncome: 0, totalExpenses: 0, balance: 0 });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do relatório:', err);
      setError('Erro ao carregar dados do relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [filters]);
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
  if (loadingCategories || loadingAccounts) {
    return (
      <ReportsContainer>
        <LoadingContainer>
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" mt={2}>
            Carregando...
          </Typography>
        </LoadingContainer>
      </ReportsContainer>
    );
  }
  return (
    <ReportsContainer>
      {}
      <PageHeaderContainer>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReportsIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Relatórios
            </Typography>
          </Stack>
          <PeriodInfo>
            <DateRangeIcon />
            <span>{formatPeriod()}</span>
          </PeriodInfo>
        </Box>
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
      </PageHeaderContainer>
      {}
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
      {}
      <FiltersContainer>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <FilterIcon color="action" />
          <Typography variant="subtitle1" fontWeight={600}>
            Filtros
          </Typography>
        </Stack>
        <FiltersGrid>
          {}
          <FormControl size="small" fullWidth>
            <InputLabel>Mês Inicial</InputLabel>
            <Select
              value={filters.startMonth}
              label="Mês Inicial"
              onChange={(e) =>
                handleFilterChange('startMonth', e.target.value as number)
              }
            >
              {MONTH_NAMES.map((month, index) => (
                <MenuItem key={index} value={index + 1}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {}
          <FormControl size="small" fullWidth>
            <InputLabel>Ano Inicial</InputLabel>
            <Select
              value={filters.startYear}
              label="Ano Inicial"
              onChange={(e) =>
                handleFilterChange('startYear', e.target.value as number)
              }
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {}
          <FormControl size="small" fullWidth>
            <InputLabel>Mês Final</InputLabel>
            <Select
              value={filters.endMonth}
              label="Mês Final"
              onChange={(e) =>
                handleFilterChange('endMonth', e.target.value as number)
              }
            >
              {MONTH_NAMES.map((month, index) => (
                <MenuItem key={index} value={index + 1}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {}
          <FormControl size="small" fullWidth>
            <InputLabel>Ano Final</InputLabel>
            <Select
              value={filters.endYear}
              label="Ano Final"
              onChange={(e) =>
                handleFilterChange('endYear', e.target.value as number)
              }
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {}
          <FormControl size="small" fullWidth>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={filters.categoryId}
              label="Categoria"
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              startAdornment={
                <CategoryIcon sx={{ mr: 1, color: 'action.active' }} />
              }
            >
              <MenuItem value="">Todas</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {}
          <FormControl size="small" fullWidth>
            <InputLabel>Conta</InputLabel>
            <Select
              value={filters.accountId}
              label="Conta"
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
              startAdornment={
                <AccountIcon sx={{ mr: 1, color: 'action.active' }} />
              }
            >
              <MenuItem value="">Todas</MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {}
          <FormControl size="small" fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filters.type}
              label="Tipo"
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="INCOME">Receitas</MenuItem>
              <MenuItem value="EXPENSE">Despesas</MenuItem>
            </Select>
          </FormControl>
        </FiltersGrid>
        <FilterActionsContainer>
          <Button
            variant="text"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            size="small"
          >
            Limpar Filtros
          </Button>
        </FilterActionsContainer>
      </FiltersContainer>
      {}
      {loading ? (
        <LoadingContainer>
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" mt={2}>
            Carregando relatório...
          </Typography>
        </LoadingContainer>
      ) : !hasData ? (
        <EmptyStateContainer>
          <ReportsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum dado encontrado
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Não há transações no período selecionado. Tente ajustar os filtros.
          </Typography>
        </EmptyStateContainer>
      ) : (
        <>
          {}
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
          {}
          <ChartsContainer>
            {}
            <ChartCard>
              <ChartHeader>
                <Typography variant="subtitle1" fontWeight={600}>
                  Despesas por Categoria
                </Typography>
              </ChartHeader>
              <CategoryChart data={expensesByCategory} />
            </ChartCard>
            {}
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
      )}
    </ReportsContainer>
  );
}
