import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
} from '@mui/material';
import {
  RefreshOutlined as RefreshIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  WarningAmberRounded as WarningIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@renderer/utils/currency';
import { formatDateToShow } from '@renderer/utils/date';
import { useTheme } from '@renderer/hooks/theme';
import {
  CashFlowContainer,
  SummaryCard,
  ProjectionCard,
  AlertCard,
} from './styles';
import type {
  CashFlowSummary,
  MonthlyProjection,
} from '@shared/interfaces/types/cash-flow.types';

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function CashFlowPage() {
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [monthlyProjections, setMonthlyProjections] = useState<
    MonthlyProjection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();

  const getChipStyles = (isHighConfidence: boolean) => {
    if (isDarkMode) {
      return isHighConfidence
        ? {
            backgroundColor: 'rgba(129, 199, 132, 0.2)',
            color: 'rgb(200, 230, 201)',
            borderColor: 'rgba(129, 199, 132, 0.4)',
          }
        : {
            backgroundColor: 'rgba(255, 152, 0, 0.15)',
            color: 'rgb(255, 183, 77)',
            borderColor: 'rgba(255, 152, 0, 0.4)',
          };
    }
    return isHighConfidence
      ? {
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          color: 'rgb(46, 125, 50)',
          borderColor: 'rgba(46, 125, 50, 0.3)',
        }
      : {
          backgroundColor: 'rgba(237, 108, 2, 0.1)',
          color: 'rgb(180, 83, 9)',
          borderColor: 'rgba(237, 108, 2, 0.3)',
        };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 3);

      const [summaryRes, projectionsRes] = await Promise.all([
        window.electronAPI.cashFlow.getProjection({
          startDate: today,
          endDate,
          includeRecurring: true,
          includePendingBills: true,
        }),
        window.electronAPI.cashFlow.getMonthlyProjections(6),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (projectionsRes.success && projectionsRes.data)
        setMonthlyProjections(projectionsRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <CashFlowContainer>
      <PageHeader
        title="Fluxo de caixa"
        description={
          <>
            Visualize seu saldo futuro baseado em transações recorrentes e
            contas a pagar
          </>
        }
        actions={
          <>
            <Tooltip title="Atualizar">
              <IconButton onClick={loadData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </>
        }
      />
      <ContentLoading loading={loading} initial="cards">
        {summary && (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
              <SummaryCard sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Saldo Atual
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {formatCurrency(summary.currentBalance)}
                </Typography>
              </SummaryCard>
              <SummaryCard sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Saldo Projetado (3 meses)
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={
                    summary.projectedBalance < 0 ? 'error.main' : 'success.main'
                  }
                >
                  {formatCurrency(summary.projectedBalance)}
                </Typography>
              </SummaryCard>
              <SummaryCard sx={{ flex: 1 }}>
                <Stack direction="row" spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Receitas Previstas
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="success.main"
                    >
                      <TrendingUpIcon
                        sx={{ verticalAlign: 'middle', mr: 0.5 }}
                      />
                      {formatCurrency(summary.totalIncome)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Despesas Previstas
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="error.main"
                    >
                      <TrendingDownIcon
                        sx={{ verticalAlign: 'middle', mr: 0.5 }}
                      />
                      {formatCurrency(summary.totalExpenses)}
                    </Typography>
                  </Box>
                </Stack>
              </SummaryCard>
            </Stack>

            {summary.alerts.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" mb={1}>
                  <WarningIcon
                    sx={{
                      verticalAlign: 'middle',
                      mr: 1,
                      color: 'warning.main',
                    }}
                  />
                  Alertas
                </Typography>
                {summary.alerts.slice(0, 5).map((alert, i) => (
                  <AlertCard
                    key={i}
                    $severity={
                      alert.type === 'negative_balance' ? 'error' : 'warning'
                    }
                  >
                    <Typography variant="body2">{alert.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateToShow(alert.date)}
                    </Typography>
                  </AlertCard>
                ))}
              </Box>
            )}
          </>
        )}

        <Typography variant="h6" mb={2}>
          Projeção Mensal
        </Typography>
        <Stack spacing={1}>
          {monthlyProjections.map((proj) => (
            <ProjectionCard key={`${proj.year}-${proj.month}`}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {MONTH_NAMES[proj.month - 1]} {proj.year}
                  </Typography>
                  <Chip
                    size="small"
                    label={`Confiança: ${(proj.confidence * 100).toFixed(0)}%`}
                    sx={{
                      mt: 0.5,
                      fontWeight: 600,
                      border: '1px solid',
                      ...getChipStyles(proj.confidence > 0.7),
                    }}
                  />
                </Box>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Receitas
                    </Typography>
                    <Typography
                      variant="body1"
                      color="success.main"
                      fontWeight={600}
                    >
                      +{formatCurrency(proj.projectedIncome)}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Despesas
                    </Typography>
                    <Typography
                      variant="body1"
                      color="error.main"
                      fontWeight={600}
                    >
                      -{formatCurrency(proj.projectedExpenses)}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Saldo Final
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={
                        proj.projectedBalance < 0
                          ? 'error.main'
                          : 'text.primary'
                      }
                    >
                      {formatCurrency(proj.projectedBalance)}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </ProjectionCard>
          ))}
        </Stack>
      </ContentLoading>
    </CashFlowContainer>
  );
}
