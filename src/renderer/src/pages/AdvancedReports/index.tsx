import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Chip,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp,
  TrendingDown,
  Assessment as AssessmentIcon,
  Favorite as HealthIcon,
  CompareArrows as CompareIcon,
  ShowChart as TrendIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@renderer/utils/currency';
import {
  ReportsContainer,
  PageHeaderContainer,
  ReportCard,
  HealthScoreCircle,
  TrendBadge,
} from './styles';

interface FinancialHealth {
  score: number;
  savingsRate: number;
  expenseToIncomeRatio: number;
  budgetAdherence: number;
  emergencyFundMonths: number;
  recommendations: string[];
}

interface YearComparison {
  category: string;
  categoryId: number;
  currentYear: number;
  previousYear: number;
  variation: number;
  variationPercent: number;
}

interface TrendAnalysis {
  categoryId: number;
  categoryName: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  averageMonthly: number;
  projectedNextMonth: number;
}

export function AdvancedReportsPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [yearComparison, setYearComparison] = useState<YearComparison[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, compRes, trendRes] = await Promise.all([
        window.electronAPI.advancedReport.financialHealth(),
        window.electronAPI.advancedReport.yearComparison(
          new Date().getFullYear(),
        ),
        window.electronAPI.advancedReport.trendAnalysis(12),
      ]);
      if (healthRes.success && healthRes.data) setHealth(healthRes.data);
      if (compRes.success && compRes.data) setYearComparison(compRes.data);
      if (trendRes.success && trendRes.data) setTrends(trendRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTrendLabel = (trend: string) => {
    if (trend === 'increasing') return 'Aumentando';
    if (trend === 'decreasing') return 'Diminuindo';
    return 'Estável';
  };

  if (loading) {
    return (
      <ReportsContainer>
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress />
        </Stack>
      </ReportsContainer>
    );
  }

  return (
    <ReportsContainer>
      <PageHeaderContainer>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Relatórios Avançados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análises detalhadas das suas finanças
          </Typography>
        </Box>
        <Tooltip title="Atualizar">
          <IconButton onClick={loadData}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </PageHeaderContainer>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<HealthIcon />} label="Saúde Financeira" />
        <Tab icon={<CompareIcon />} label="Comparativo Anual" />
        <Tab icon={<TrendIcon />} label="Tendências" />
      </Tabs>

      {tab === 0 && health && (
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ReportCard sx={{ flex: { md: '0 0 33%' } }}>
              <Stack alignItems="center" spacing={2}>
                <Typography variant="h6">Score de Saúde</Typography>
                <HealthScoreCircle $score={health.score}>
                  {health.score}
                </HealthScoreCircle>
                <Typography variant="body2" color="text.secondary">
                  {health.score >= 70
                    ? 'Excelente!'
                    : health.score >= 40
                      ? 'Pode melhorar'
                      : 'Atenção necessária'}
                </Typography>
              </Stack>
            </ReportCard>
            <ReportCard sx={{ flex: 1 }}>
              <Typography variant="h6" mb={2}>
                Indicadores
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={2}>
                <Box sx={{ flex: '1 1 45%', minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary">
                    Taxa de Poupança
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color={
                      health.savingsRate >= 10 ? 'success.main' : 'error.main'
                    }
                  >
                    {health.savingsRate.toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 45%', minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary">
                    Despesas/Receitas
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color={
                      health.expenseToIncomeRatio <= 80
                        ? 'success.main'
                        : 'error.main'
                    }
                  >
                    {health.expenseToIncomeRatio.toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 45%', minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aderência ao Orçamento
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {health.budgetAdherence.toFixed(0)}%
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 45%', minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary">
                    Reserva de Emergência
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {health.emergencyFundMonths.toFixed(1)} meses
                  </Typography>
                </Box>
              </Stack>
            </ReportCard>
          </Stack>
          <ReportCard>
            <Typography variant="h6" mb={2}>
              Recomendações
            </Typography>
            {health.recommendations.length === 0 ? (
              <Alert severity="success">
                Parabéns! Suas finanças estão em ótimo estado.
              </Alert>
            ) : (
              <Stack spacing={1}>
                {health.recommendations.map((rec, i) => (
                  <Alert key={i} severity="info">
                    {rec}
                  </Alert>
                ))}
              </Stack>
            )}
          </ReportCard>
        </Stack>
      )}

      {tab === 1 && (
        <ReportCard>
          <Typography variant="h6" mb={2}>
            Comparativo {new Date().getFullYear() - 1} vs{' '}
            {new Date().getFullYear()}
          </Typography>
          {yearComparison.length === 0 ? (
            <Typography color="text.secondary">
              Dados insuficientes para comparação.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {yearComparison.map((item) => (
                <Box
                  key={item.categoryId}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {item.category}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">
                          {new Date().getFullYear() - 1}
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(item.previousYear)}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">
                          {new Date().getFullYear()}
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(item.currentYear)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        icon={
                          item.variation > 0 ? <TrendingUp /> : <TrendingDown />
                        }
                        label={`${item.variation > 0 ? '+' : ''}${item.variationPercent.toFixed(0)}%`}
                        color={item.variation > 0 ? 'error' : 'success'}
                      />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </ReportCard>
      )}

      {tab === 2 && (
        <ReportCard>
          <Typography variant="h6" mb={2}>
            Tendências de Gastos (últimos 12 meses)
          </Typography>
          {trends.length === 0 ? (
            <Typography color="text.secondary">
              Dados insuficientes para análise de tendências.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {trends.map((trend) => (
                <Box
                  key={trend.categoryId}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {trend.categoryName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Média mensal: {formatCurrency(trend.averageMonthly)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">
                          Projeção próximo mês
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(trend.projectedNextMonth)}
                        </Typography>
                      </Box>
                      <TrendBadge $trend={trend.trend}>
                        {trend.trend === 'increasing' && (
                          <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} />
                        )}
                        {trend.trend === 'decreasing' && (
                          <TrendingDown sx={{ fontSize: 14, mr: 0.5 }} />
                        )}
                        {getTrendLabel(trend.trend)}
                      </TrendBadge>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </ReportCard>
      )}
    </ReportsContainer>
  );
}
