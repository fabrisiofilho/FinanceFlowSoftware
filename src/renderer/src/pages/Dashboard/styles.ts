import styled from 'styled-components';
import { Box, Stack } from '@mui/material';
type CardVariant = 'primary' | 'success' | 'error' | 'info' | 'warning';
const getVariantColors = (theme: any, variant: CardVariant) => {
  const variants = {
    primary: {
      bg: theme.COLORS.primary_100,
      icon: theme.COLORS.primary,
      text: theme.COLORS.primary_400,
    },
    success: {
      bg: theme.COLORS.success_100,
      icon: theme.COLORS.success,
      text: theme.COLORS.success_400,
    },
    error: {
      bg: theme.COLORS.error_100,
      icon: theme.COLORS.error,
      text: theme.COLORS.error_400,
    },
    info: {
      bg: theme.COLORS.info_100,
      icon: theme.COLORS.info,
      text: theme.COLORS.info_400,
    },
    warning: {
      bg: theme.COLORS.warn_100,
      icon: theme.COLORS.warn,
      text: theme.COLORS.warn_400,
    },
  };
  return variants[variant];
};
export const DashboardContainer = styled(Box)`
  padding: 1.5rem;
  min-height: 100%;
  background-color: ${({ theme }) => theme.COLORS.background};
  @media ${({ theme }) => theme.SIZES.xs} {
    padding: 1rem;
  }
`;
export const SummaryCard = styled(Box)<{ $variant: CardVariant }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.SHADOWS.z_12};
  }
  @media ${({ theme }) => theme.SIZES.xs} {
    padding: 1rem;
    gap: 0.75rem;
  }
`;
export const SummaryCardIcon = styled(Box)<{ $variant: CardVariant }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background-color: ${({ theme, $variant }) =>
    getVariantColors(theme, $variant).bg};
  svg {
    font-size: 1.5rem;
    color: ${({ theme, $variant }) => getVariantColors(theme, $variant).icon};
  }
  @media ${({ theme }) => theme.SIZES.xs} {
    width: 2.5rem;
    height: 2.5rem;
    svg {
      font-size: 1.25rem;
    }
  }
`;
export const SummaryCardContent = styled(Box)`
  flex: 1;
  min-width: 0;
`;
export const SummaryCardValue = styled.p<{ $negative?: boolean }>`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: ${({ theme, $negative }) =>
    $negative ? theme.COLORS.error : theme.COLORS.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media ${({ theme }) => theme.SIZES.xs} {
    font-size: 1rem;
  }
`;
export const SummaryCardLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
export const SectionTitle = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  margin-bottom: 1rem;
`;
export const TransactionItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
  transition: background-color 0.2s ease;
  &:hover {
    background-color: ${({ theme }) => theme.COLORS.grey_300};
  }
`;
export const TransactionIcon = styled(Box)<{ $type: 'income' | 'expense' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${({ theme, $type }) =>
    $type === 'income' ? theme.COLORS.success_100 : theme.COLORS.error_100};
  svg {
    color: ${({ theme, $type }) =>
      $type === 'income' ? theme.COLORS.success : theme.COLORS.error};
  }
`;
export const TransactionInfo = styled(Box)`
  flex: 1;
  min-width: 0;
`;
export const TransactionAmount = styled.span<{ $type: 'income' | 'expense' }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme, $type }) =>
    $type === 'income' ? theme.COLORS.success : theme.COLORS.error};
  white-space: nowrap;
`;
export const BillItem = styled(Box)<{ $isOverdue?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ theme, $isOverdue }) =>
    $isOverdue ? theme.COLORS.error_100 : theme.COLORS.surfaceAlt};
  border-left: 3px solid
    ${({ theme, $isOverdue }) =>
      $isOverdue ? theme.COLORS.error : theme.COLORS.warn};
  transition: background-color 0.2s ease;
  &:hover {
    background-color: ${({ theme, $isOverdue }) =>
      $isOverdue ? theme.COLORS.error_200 : theme.COLORS.grey_300};
  }
`;
export const BillInfo = styled(Box)`
  flex: 1;
  min-width: 0;
`;
export const BillAmount = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.COLORS.text};
  white-space: nowrap;
`;
export const BillDueDate = styled.span<{ $isOverdue?: boolean }>`
  font-size: 0.75rem;
  color: ${({ theme, $isOverdue }) =>
    $isOverdue ? theme.COLORS.error : theme.COLORS.warn_300};
`;
export const ChartContainer = styled(Box)`
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.COLORS.surfaceAlt};
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.COLORS.grey_400};
    border-radius: 2px;
  }
`;
export const CategoryItem = styled(Box)`
  margin-bottom: 1rem;
  &:last-child {
    margin-bottom: 0;
  }
`;
export const CategoryBar = styled(Box)<{ $percentage: number }>`
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
  overflow: hidden;
  margin-top: 0.5rem;
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $percentage }) => Math.min($percentage, 100)}%;
    background: ${({ theme }) => theme.COLORS.primary_gradient};
    border-radius: 4px;
    transition: width 0.3s ease;
  }
`;
export const CategoryInfo = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})``;
export const EmptyState = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
  border-radius: 0.5rem;
`;
