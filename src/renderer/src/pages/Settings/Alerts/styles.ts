import styled from 'styled-components';
import { Box, Stack, LinearProgress } from '@mui/material';
import type { AlertStatus } from '@shared/interfaces/types/alert.types';
const getStatusColor = (theme: any, status: AlertStatus): string => {
  switch (status) {
    case 'ok':
      return theme.COLORS.success;
    case 'warning':
      return theme.COLORS.warn;
    case 'critical':
      return theme.COLORS.error;
    default:
      return theme.COLORS.grey_500;
  }
};
const getStatusBgColor = (theme: any, status: AlertStatus): string => {
  switch (status) {
    case 'ok':
      return theme.COLORS.success_100;
    case 'warning':
      return theme.COLORS.warn_100;
    case 'critical':
      return theme.COLORS.error_100;
    default:
      return theme.COLORS.surfaceAlt;
  }
};
export const AlertsContainer = styled(Box)`
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
export const AlertsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  @media ${({ theme }) => theme.SIZES.xs} {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;
export const AlertCard = styled(Box)<{ $status: AlertStatus }>`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
  border-left: 4px solid
    ${({ theme, $status }) => getStatusColor(theme, $status)};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.SHADOWS.z_12};
  }
`;
export const AlertCardHeader = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
})`
  margin-bottom: 1rem;
`;
export const AlertIcon = styled(Box)<{ $status: AlertStatus }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background-color: ${({ theme, $status }) => getStatusBgColor(theme, $status)};
  svg {
    font-size: 1.5rem;
    color: ${({ theme, $status }) => getStatusColor(theme, $status)};
  }
`;
export const AlertInfo = styled(Box)`
  flex: 1;
  margin-left: 0.75rem;
`;
export const AlertCategoryName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.COLORS.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const AlertLimit = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.textSecondary};
`;
export const AlertActions = styled(Stack).attrs({
  direction: 'row',
  spacing: 0.5,
})`
  opacity: 0.7;
  transition: opacity 0.2s ease;
  ${AlertCard}:hover & {
    opacity: 1;
  }
`;
export const StatusSection = styled(Box)`
  margin-top: 1rem;
`;
export const AlertProgressBar = styled(LinearProgress)<{
  $status: AlertStatus;
}>`
  height: 10px;
  border-radius: 5px;
  margin: 0.75rem 0;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
  .MuiLinearProgress-bar {
    border-radius: 5px;
    background-color: ${({ theme, $status }) => getStatusColor(theme, $status)};
  }
`;
export const ValuesContainer = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  margin-top: 0.5rem;
`;
export const ValueItem = styled(Box)<{ $align?: 'left' | 'right' }>`
  text-align: ${({ $align }) => $align || 'left'};
`;
export const ValueLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.textSecondary};
  display: block;
`;
export const ValueAmount = styled.span<{ $variant?: 'current' | 'limit' }>`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme, $variant }) =>
    $variant === 'current' ? theme.COLORS.primary : theme.COLORS.text};
`;
export const PercentageDisplay = styled.span<{ $status: AlertStatus }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme, $status }) => getStatusColor(theme, $status)};
`;
export const StatusBadge = styled(Box)<{ $status: AlertStatus }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ theme, $status }) => getStatusBgColor(theme, $status)};
  color: ${({ theme, $status }) => {
    switch ($status) {
      case 'ok':
        return theme.COLORS.success_300;
      case 'warning':
        return theme.COLORS.warn_300;
      case 'critical':
        return theme.COLORS.error_300;
      default:
        return theme.COLORS.textSecondary;
    }
  }};
  font-size: 0.875rem;
  font-weight: 600;
  svg {
    font-size: 1rem;
  }
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
export const FormContainer = styled(Stack).attrs({
  spacing: 2,
})`
  padding: 0.5rem 0;
`;
export const FormRow = styled(Stack).attrs({
  direction: 'row',
  spacing: 2,
})`
  @media ${({ theme }) => theme.SIZES.xs} {
    flex-direction: column;
  }
`;
