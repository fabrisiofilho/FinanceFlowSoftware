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
    ${({ $severity }) => ($severity === 'error' ? '#d32f2f' : '#ed6c02')};
  background: ${({ $severity }) =>
    $severity === 'error' ? '#d32f2f10' : '#ed6c0210'};
`;
