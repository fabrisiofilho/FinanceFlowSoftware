import { metricCardStyles } from '@renderer/components/PageLayout';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import styled from 'styled-components';

export const CashFlowContainer = PageContainer;

export const SummaryCard = styled(ContentSurface)`
  padding: 1.5rem;
  border-radius: 1.5rem;
  ${metricCardStyles};
`;

export const ProjectionCard = styled(ContentSurface)`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

export const AlertCard = styled(ContentSurface)<{
  $severity: 'warning' | 'error';
}>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border-left: 4px solid
    ${({ theme, $severity }) =>
      $severity === 'error' ? theme.COLORS.error : theme.COLORS.warn};
  background: ${({ theme, $severity }) =>
    $severity === 'error' ? theme.COLORS.error_100 : theme.COLORS.warn_100};
`;
