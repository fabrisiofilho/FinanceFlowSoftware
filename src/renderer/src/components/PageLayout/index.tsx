import { ExpandableCard as Paper } from '@renderer/components/ExpandableCard';
import { Box, Skeleton, Stack } from '@mui/material';
import styled, { css } from 'styled-components';

export const metricCardStyles = css`
  min-height: 112px;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid ${({ theme }) => theme.COLORS.border};
  background: ${({ theme }) => theme.COLORS.surface};
  box-shadow: none;
`;

export const PageContainer = styled(Box)`
  width: 100%;
  max-width: 1600px;
  min-height: 100%;
  margin: 0 auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
`;

export const PageHeading = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
  & > :first-child {
    min-width: 0;
  }
  @media (max-width: 700px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const ContentSurface = styled(Paper).attrs({ elevation: 0 })`
  border: 1px solid ${({ theme }) => theme.COLORS.border};
  border-radius: 1.5rem;
  background: ${({ theme }) => theme.COLORS.surface};
  box-shadow: none;
  overflow: hidden;
`;

/** Reserva a estrutura do conteúdo enquanto os dados são carregados. */
export function PageSkeleton({
  variant = 'table',
}: {
  variant?: 'table' | 'dashboard';
}) {
  return (
    <Stack
      role="status"
      aria-label="Carregando conteúdo"
      aria-busy="true"
      spacing={3}
      width="100%"
      sx={{ py: 1 }}
    >
      <span className="sr-only">Carregando conteúdo…</span>
      <Box
        aria-hidden="true"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={112} />
        ))}
      </Box>
      {variant === 'dashboard' ? (
        <Box
          aria-hidden="true"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={260} />
          ))}
        </Box>
      ) : (
        <ContentSurface aria-hidden="true" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Skeleton width="100%" height={40} />
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} width="100%" height={36} />
            ))}
          </Stack>
        </ContentSurface>
      )}
    </Stack>
  );
}
