import styled from 'styled-components';
import { Box, Paper } from '@mui/material';

export const CashFlowContainer = styled(Box)`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

export const PageHeaderContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

export const SummaryCard = styled(Paper)`
  padding: 1.5rem;
  border-radius: 12px;
`;

export const ProjectionCard = styled(Paper)`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

export const AlertCard = styled(Paper)<{ $severity: 'warning' | 'error' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border-left: 4px solid
    ${({ $severity }) => ($severity === 'error' ? '#d32f2f' : '#ed6c02')};
  background: ${({ $severity }) =>
    $severity === 'error' ? '#d32f2f10' : '#ed6c0210'};
`;
