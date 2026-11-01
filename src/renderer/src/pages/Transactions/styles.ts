import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import styled from 'styled-components';
import { Box, Stack } from '@mui/material';
export const TransactionsContainer = PageContainer;

export const TableContainer = styled(ContentSurface)`
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
  overflow: hidden;
`;
export const AmountCell = styled.span<{ $type: 'income' | 'expense' }>`
  font-weight: 600;
  color: ${({ theme, $type }) =>
    $type === 'income' ? theme.COLORS.success : theme.COLORS.error};
`;
export const TypeBadge = styled(Box)<{ $type: 'income' | 'expense' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${({ theme, $type }) =>
    $type === 'income' ? theme.COLORS.success_100 : theme.COLORS.error_100};
  color: ${({ theme, $type }) =>
    $type === 'income' ? theme.COLORS.success_300 : theme.COLORS.error_300};
  svg {
    font-size: 0.875rem;
  }
`;
export const ActionsContainer = styled(Stack).attrs({
  direction: 'row',
  spacing: 0.5,
})`
  justify-content: flex-end;
`;
export const CategoryChip = styled(Box)`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
  color: ${({ theme }) => theme.COLORS.text};
`;
export const TransactionInfoContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;
export const TransactionDescription = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.text};
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const TransactionSecondaryInfo = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.COLORS.textSecondary};
`;
export const EmptyStateContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
  border-radius: 0.5rem;
  margin: 1rem;
`;
export const FilterChip = styled(Box)<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${({ theme, $active }) =>
    $active ? theme.COLORS.primary_100 : theme.COLORS.surfaceAlt};
  color: ${({ theme, $active }) =>
    $active ? theme.COLORS.primary : theme.COLORS.textSecondary};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.COLORS.primary : 'transparent')};
  &:hover {
    background-color: ${({ theme, $active }) =>
      $active ? theme.COLORS.primary_200 : theme.COLORS.grey_300};
  }
`;
export const FiltersSummary = styled(Stack).attrs({
  direction: 'row',
  spacing: 1,
  flexWrap: 'wrap',
})`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.COLORS.border};
`;
