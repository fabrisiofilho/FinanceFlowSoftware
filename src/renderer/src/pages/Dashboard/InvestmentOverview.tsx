import { useEffect, useState } from 'react';
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import { ShowChartRounded } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ContentSurface } from '@renderer/components/PageLayout';
import { AppAlert } from '@renderer/components/Feedback';
import { formatCurrency } from '@renderer/utils/currency';
import type { InvestmentPortfolio } from '@shared/interfaces/types/investment.types';
export function InvestmentOverview({ period }: { period: string }) {
  const [data, setData] = useState<InvestmentPortfolio | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void window.electronAPI.investment
      .list()
      .then((result) => {
        if (!active) return;
        if (result.success && result.data) setData(result.data);
        else setError(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const principal =
    data?.investments.reduce((sum, item) => sum + item.principalCents, 0) || 0;
  const totalYield =
    data?.yields.reduce((sum, item) => sum + item.amountCents, 0) || 0;
  const monthYield =
    data?.yields
      .filter((item) => item.month === period)
      .reduce((sum, item) => sum + item.amountCents, 0) || 0;
  return (
    <ContentSurface sx={{ p: 3, mt: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
      >
        <Stack direction="row" gap={1} alignItems="center">
          <ShowChartRounded color="secondary" />
          <Typography variant="h6">Carteira de investimentos</Typography>
        </Stack>
        <Button component={Link} to="/panel/investments">
          Abrir carteira
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Acompanhamento separado das contas. Projeções não entram nos ganhos
        realizados.
      </Typography>
      {error ? (
        <AppAlert severity="warning">
          Não foi possível consultar a carteira.
        </AppAlert>
      ) : !data ? (
        <Skeleton height={64} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' },
            gap: 3,
          }}
        >
          {[
            ['Valor aplicado', principal],
            ['Rendimento no mês selecionado', monthYield],
            ['Saldo registrado da carteira', principal + totalYield],
          ].map(([label, value]) => (
            <Box key={String(label)}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h5">
                {formatCurrency(Number(value) / 100)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </ContentSurface>
  );
}
