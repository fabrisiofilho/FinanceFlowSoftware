import styled from 'styled-components';
import { Box, Stack, LinearProgress } from '@mui/material';
export const CreditCardsContainer = styled(Box)`
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
export const CreditCardsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
  @media ${({ theme }) => theme.SIZES.xs} {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;
export const CreditCardCard = styled(Box)`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
  border-left: 4px solid ${({ theme }) => theme.COLORS.secondary_200};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.SHADOWS.z_12};
  }
`;
export const CardHeader = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
})`
  margin-bottom: 1rem;
`;
export const CardIcon = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background-color: ${({ theme }) => theme.COLORS.secondary_100};
  svg {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.COLORS.secondary};
  }
`;
export const CardInfo = styled(Box)`
  flex: 1;
  margin-left: 0.75rem;
`;
export const CardName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.COLORS.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const CardSubtitle = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.textSecondary};
`;
export const LimitSection = styled(Box)`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
`;
export const LimitProgressBar = styled(LinearProgress)<{ $percentage: number }>`
  height: 8px;
  border-radius: 4px;
  margin: 0.75rem 0;
  background-color: ${({ theme }) => theme.COLORS.grey_300};
  .MuiLinearProgress-bar {
    border-radius: 4px;
    background-color: ${({ theme, $percentage }) =>
      $percentage >= 100
        ? theme.COLORS.error
        : $percentage >= 80
          ? theme.COLORS.warn
          : theme.COLORS.success};
  }
`;
export const LimitValues = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  margin-top: 0.5rem;
`;
export const LimitValueItem = styled(Box)<{
  $variant?: 'used' | 'available' | 'total';
}>`
  text-align: ${({ $variant }) =>
    $variant === 'available' ? 'right' : 'left'};
`;
export const LimitLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.textSecondary};
  display: block;
`;
export const LimitValue = styled.span<{
  $variant?: 'used' | 'available' | 'total';
}>`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme, $variant }) =>
    $variant === 'used'
      ? theme.COLORS.error
      : $variant === 'available'
        ? theme.COLORS.success
        : theme.COLORS.text};
`;
export const InvoiceSection = styled(Box)`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
`;
export const InvoiceHeader = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  margin-bottom: 0.75rem;
`;
export const InvoiceTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.COLORS.text};
`;
export const InvoiceStatusBadge = styled.span<{
  $status: 'open' | 'closed' | 'paid' | 'overdue';
}>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  background-color: ${({ theme, $status }) =>
    $status === 'paid'
      ? theme.COLORS.success_100
      : $status === 'closed'
        ? theme.COLORS.warn_100
        : $status === 'overdue'
          ? theme.COLORS.error_100
          : theme.COLORS.info_100};
  color: ${({ theme, $status }) =>
    $status === 'paid'
      ? theme.COLORS.success_300
      : $status === 'closed'
        ? theme.COLORS.warn_300
        : $status === 'overdue'
          ? theme.COLORS.error_300
          : theme.COLORS.info_300};
`;
export const InvoiceInfo = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
})`
  margin-top: 0.5rem;
`;
export const InvoiceAmount = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.COLORS.text};
`;
export const InvoiceDueDate = styled.span<{ $isOverdue?: boolean }>`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme, $isOverdue }) =>
    $isOverdue ? theme.COLORS.error : theme.COLORS.textSecondary};
`;
export const EmptyStateContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background-color: ${({ theme }) => theme.COLORS.surface};
  border-radius: 1rem;
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
`;
export const TransactionsList = styled(Box)`
  margin-top: 1rem;
  max-height: 200px;
  overflow-y: auto;
`;
export const TransactionItem = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.COLORS.border};
  &:last-child {
    border-bottom: none;
  }
`;
export const TransactionInfo = styled(Box)`
  flex: 1;
  min-width: 0;
`;
export const TransactionDescription = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.text};
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const TransactionDate = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.COLORS.textSecondary};
`;
export const TransactionAmount = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.COLORS.error};
  margin-left: 1rem;
  white-space: nowrap;
`;
export const CardActions = styled(Stack).attrs({
  direction: 'row',
  spacing: 1,
  justifyContent: 'flex-end',
})`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.COLORS.border};
`;
export const LimitAlertIndicator = styled(Box)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background-color: ${({ theme }) => theme.COLORS.warn_100};
  color: ${({ theme }) => theme.COLORS.warn_300};
  font-size: 0.75rem;
  font-weight: 500;
`;
export const PaymentFormContainer = styled(Stack).attrs({
  spacing: 2,
})`
  padding: 0.5rem 0;
`;
