import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import styled from 'styled-components';
import { Box } from '@mui/material';

export const RecurringContainer = PageContainer;

export const RecurringCard = styled(ContentSurface)<{
  $type: 'income' | 'expense';
}>`
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
