import { metricCardStyles } from '@renderer/components/PageLayout';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import styled from 'styled-components';
import { Box } from '@mui/material';

export const BudgetContainer = PageContainer;

export const SummaryCard = styled(ContentSurface)`
  padding: 1.5rem;
  border-radius: 1.5rem;
  height: 100%;
  ${metricCardStyles};
`;

export const BudgetCard = styled(ContentSurface)`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
`;

export const ProgressContainer = styled(Box)`
  margin-top: 0.5rem;
`;

export const BudgetGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;
