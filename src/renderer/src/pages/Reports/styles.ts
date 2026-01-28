import styled from 'styled-components';
import { Box, Stack, Paper, Card } from '@mui/material';
export const ReportsContainer = styled(Box)`
  padding: 1.5rem;
  min-height: 100%;
  background-color: ${({ theme }) => theme.COLORS.background};
  @media ${({ theme }) => theme.SIZES.xs} {
    padding: 1rem;
  }
`;
export const PageHeaderContainer = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  margin-bottom: 1.5rem;
  @media ${({ theme }) => theme.SIZES.xs} {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;
export const FiltersContainer = styled(Paper)`
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
`;
export const FiltersGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  align-items: end;
  @media ${({ theme }) => theme.SIZES.lg} {
    grid-template-columns: repeat(3, 1fr);
  }
  @media ${({ theme }) => theme.SIZES.sm} {
    grid-template-columns: repeat(2, 1fr);
  }
  @media ${({ theme }) => theme.SIZES.xs} {
    grid-template-columns: 1fr;
  }
`;
export const FilterActionsContainer = styled(Stack).attrs({
  direction: 'row',
  spacing: 1,
  justifyContent: 'flex-end',
  alignItems: 'center',
})`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.COLORS.border};
  @media ${({ theme }) => theme.SIZES.xs} {
    flex-direction: column;
    button {
      width: 100%;
    }
  }
`;
export const SummaryContainer = styled(Box)`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  @media ${({ theme }) => theme.SIZES.sm} {
    flex-direction: column;
  }
`;
export const SummaryCard = styled(Card)<{
  $variant?: 'income' | 'expense' | 'balance';
}>`
  flex: 1;
  min-width: 200px;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
  border-left: 3px solid
    ${({ theme, $variant }) => {
      switch ($variant) {
        case 'income':
          return theme.COLORS.success;
        case 'expense':
          return theme.COLORS.error;
        case 'balance':
          return theme.COLORS.primary;
        default:
          return theme.COLORS.grey_400;
      }
    }};
`;
export const SummaryIcon = styled(Box)<{
  $variant?: 'income' | 'expense' | 'balance';
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'income':
        return theme.COLORS.success_100;
      case 'expense':
        return theme.COLORS.error_100;
      case 'balance':
        return theme.COLORS.primary_100;
      default:
        return theme.COLORS.surfaceAlt;
    }
  }};
  svg {
    font-size: 1.25rem;
    color: ${({ theme, $variant }) => {
      switch ($variant) {
        case 'income':
          return theme.COLORS.success;
        case 'expense':
          return theme.COLORS.error;
        case 'balance':
          return theme.COLORS.primary;
        default:
          return theme.COLORS.textSecondary;
      }
    }};
  }
`;
export const SummaryValue = styled.span<{
  $variant?: 'income' | 'expense' | 'balance';
}>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'income':
        return theme.COLORS.success;
      case 'expense':
        return theme.COLORS.error;
      case 'balance':
        return theme.COLORS.primary;
      default:
        return theme.COLORS.text;
    }
  }};
`;
export const SummaryLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.textSecondary};
  display: block;
  margin-bottom: 0.25rem;
`;
export const ChartsContainer = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media ${({ theme }) => theme.SIZES.md} {
    grid-template-columns: 1fr;
  }
`;
export const ChartCard = styled(Card)`
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
`;
export const ChartHeader = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  margin-bottom: 0.75rem;
`;
export const ExportButtonsContainer = styled(Stack).attrs({
  direction: 'row',
  spacing: 1,
})`
  @media ${({ theme }) => theme.SIZES.xs} {
    flex-direction: column;
    width: 100%;
    button {
      width: 100%;
    }
  }
`;
export const EmptyStateContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background-color: ${({ theme }) => theme.COLORS.surface};
  border-radius: 0.75rem;
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
`;
export const LoadingContainer = styled(Stack).attrs({
  alignItems: 'center',
  justifyContent: 'center',
})`
  min-height: 60vh;
`;
export const TypeToggleContainer = styled(Box)`
  display: flex;
  gap: 0.25rem;
`;
export const TypeToggleButton = styled.button<{ $active?: boolean }>`
  padding: 0.375rem 0.625rem;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.COLORS.primary : theme.COLORS.border};
  border-radius: 0.375rem;
  background-color: ${({ theme, $active }) =>
    $active ? theme.COLORS.primary_100 : theme.COLORS.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.COLORS.primary : theme.COLORS.textSecondary};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    border-color: ${({ theme }) => theme.COLORS.primary};
    background-color: ${({ theme }) => theme.COLORS.primary_100};
  }
`;
export const PeriodInfo = styled(Box)`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  background-color: ${({ theme }) => theme.COLORS.info_100};
  color: ${({ theme }) => theme.COLORS.info_300};
  font-size: 0.75rem;
  font-weight: 500;
  svg {
    font-size: 0.875rem;
  }
`;
