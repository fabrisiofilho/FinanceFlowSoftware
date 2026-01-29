import styled from 'styled-components';
import { Box, Paper } from '@mui/material';

export const BudgetContainer = styled(Box)`
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
  height: 100%;
`;

export const BudgetCard = styled(Paper)`
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
