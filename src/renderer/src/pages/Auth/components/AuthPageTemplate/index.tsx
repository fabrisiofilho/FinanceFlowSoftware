import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
  SpaOutlined,
  AccountBalanceWalletOutlined,
  InsightsOutlined,
  VerifiedUserOutlined,
} from '@mui/icons-material';
import { FinancialTrace } from '@renderer/components/FinancialTrace';
import { Container, BrandPanel, FormPanel } from './styles';
type Props = { children: ReactNode };
export function AuthPageTemplate({ children }: Props) {
  return (
    <Container>
      <BrandPanel>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              bgcolor: '#a9dfbf',
              color: '#17251e',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <SpaOutlined />
          </Box>
          <Typography
            sx={{
              color: 'inherit',
              fontSize: 24,
              lineHeight: 1.3,
              overflow: 'visible',
              fontWeight: 700,
              letterSpacing: '-.04em',
            }}
          >
            Contabily<span style={{ color: '#a9dfbf' }}>.</span>
          </Typography>
        </Stack>
        <Box className="brand-story">
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#a9dfbf',
              }}
            />
            <Typography
              sx={{
                color: '#b3c9bb',
                fontSize: 11,
                letterSpacing: '.16em',
                fontWeight: 600,
              }}
            >
              MENOS RUÍDO. MAIS CLAREZA.
            </Typography>
          </Stack>
          <Typography
            component="h2"
            sx={{
              fontSize: 'clamp(36px,3.5vw,56px)',
              fontWeight: 600,
              letterSpacing: '-.055em',
              lineHeight: 1.14,
              color: 'inherit',
              overflow: 'visible',
            }}
          >
            Seu dinheiro.
            <br />
            Uma visão <span style={{ color: '#a9dfbf' }}>mais clara.</span>
          </Typography>
          <Typography
            sx={{
              color: '#b3c9bb',
              fontSize: 15,
              lineHeight: 1.8,
              maxWidth: 380,
              mt: 3,
            }}
          >
            Transforme seus registros em uma rotina financeira mais leve,
            organizada e consciente.
          </Typography>
          <div className="brand-plot">
            <FinancialTrace />
          </div>
          <Stack direction="row" gap={1.5} flexWrap="wrap" sx={{ mt: 2 }}>
            {[
              { Icon: AccountBalanceWalletOutlined, label: 'Ganhos e gastos' },
              { Icon: InsightsOutlined, label: 'Visão mensal' },
            ].map(({ Icon, label }) => (
              <Stack
                key={label}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  px: 1.5,
                  py: 1,
                  border: '1px solid #a9dfbf30',
                  borderRadius: 2,
                  color: '#cce0d3',
                  bgcolor: '#14251b80',
                }}
              >
                <Icon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: 12, color: 'inherit' }}>
                  {label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Stack
          className="brand-footer"
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <VerifiedUserOutlined sx={{ fontSize: 16, color: '#9ab6a4' }} />
          <Typography sx={{ fontSize: 12, color: '#9ab6a4' }}>
            Suas finanças, no seu computador.
          </Typography>
        </Stack>
      </BrandPanel>
      <FormPanel>
        <div className="auth-fields">{children}</div>
      </FormPanel>
    </Container>
  );
}
