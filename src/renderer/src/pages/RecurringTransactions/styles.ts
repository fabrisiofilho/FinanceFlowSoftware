import styled from 'styled-components';
import { Box, Paper } from '@mui/material';

export const RecurringContainer = styled(Box)`
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

export const RecurringCard = styled(Paper)<{ $type: 'income' | 'expense' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border-left: 4px solid
    ${({ $type }) => ($type === 'income' ? '#2e7d32' : '#d32f2f')};
`;

export const FrequencyBadge = styled(Box)`
  background: ${({ theme }) => theme.COLORS.primary}20;
  color: ${({ theme }) => theme.COLORS.primary};
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
`;
