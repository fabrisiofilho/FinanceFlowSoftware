import { ExpandableCard } from '@renderer/components/ExpandableCard';
import { PageContainer } from '@renderer/components/PageLayout';
import styled from 'styled-components';
import { Box, Stack, LinearProgress } from '@mui/material';
export const GoalsContainer = PageContainer;
export const GoalsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  @media ${({ theme }) => theme.SIZES.xs} {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;
export const GoalCard = styled(ExpandableCard)<{ $completed?: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: ${({ theme }) => theme.COLORS.surface};
  box-shadow: ${({ theme }) => theme.SHADOWS.cards};
  border: 1px solid ${({ theme }) => theme.COLORS.border};
  border-left: 4px solid
    ${({ theme, $completed }) =>
      $completed ? theme.COLORS.success : theme.COLORS.primary_200};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    filter: brightness(1.04);
    box-shadow: ${({ theme }) => theme.SHADOWS.z_12};
  }
`;
export const GoalCardHeader = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
})`
  margin-bottom: 1rem;
`;
export const GoalIcon = styled(Box)<{ $completed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1.25rem;
  background-color: ${({ theme, $completed }) =>
    $completed ? theme.COLORS.success_100 : theme.COLORS.primary_100};
  svg {
    font-size: 1.5rem;
    color: ${({ theme, $completed }) =>
      $completed ? theme.COLORS.success : theme.COLORS.primary};
  }
`;
export const GoalInfo = styled(Box)`
  flex: 1;
  margin-left: 0.75rem;
`;
export const GoalName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.COLORS.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const GoalDeadline = styled.span<{ $expired?: boolean }>`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme, $expired }) =>
    $expired ? theme.COLORS.error : theme.COLORS.textSecondary};
`;
export const GoalActions = styled(Stack).attrs({
  direction: 'row',
  spacing: 0.5,
})`
  opacity: 0.7;
  transition: opacity 0.2s ease;
  ${GoalCard}:hover & {
    opacity: 1;
  }
`;
export const ProgressSection = styled(Box)`
  margin-top: 1rem;
`;
export const ProgressBar = styled(LinearProgress)<{ $percentage: number }>`
  height: 10px;
  border-radius: 5px;
  margin: 0.75rem 0;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
  .MuiLinearProgress-bar {
    border-radius: 5px;
    background-color: ${({ theme, $percentage }) =>
      $percentage >= 100
        ? theme.COLORS.success
        : $percentage >= 75
          ? theme.COLORS.primary
          : $percentage >= 50
            ? theme.COLORS.info
            : theme.COLORS.warn};
  }
`;
export const ProgressValues = styled(Stack).attrs({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})`
  margin-top: 0.5rem;
`;
export const ProgressValueItem = styled(Box)<{
  $variant?: 'current' | 'target' | 'remaining';
}>`
  text-align: ${({ $variant }) => ($variant === 'target' ? 'right' : 'left')};
`;
export const ProgressLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.COLORS.textSecondary};
  display: block;
`;
export const ProgressValue = styled.span<{
  $variant?: 'current' | 'target' | 'remaining';
}>`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme, $variant }) =>
    $variant === 'current'
      ? theme.COLORS.primary
      : $variant === 'remaining'
        ? theme.COLORS.warn
        : theme.COLORS.text};
`;
export const ProgressPercentage = styled.span<{ $percentage: number }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme, $percentage }) =>
    $percentage >= 100
      ? theme.COLORS.success
      : $percentage >= 75
        ? theme.COLORS.primary
        : $percentage >= 50
          ? theme.COLORS.info
          : theme.COLORS.warn};
`;
export const CompletedBadge = styled(Box)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.COLORS.success_100};
  color: ${({ theme }) => theme.COLORS.success_300};
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
export const ContributionFormContainer = styled(Stack).attrs({
  spacing: 2,
})`
  padding: 0.5rem 0;
`;
export const GoalSummaryBox = styled(Box)`
  padding: 1rem;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.COLORS.surfaceAlt};
  margin-bottom: 1rem;
`;
export const RemainingDaysInfo = styled(Box)<{ $urgent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background-color: ${({ theme, $urgent }) =>
    $urgent ? theme.COLORS.warn_100 : theme.COLORS.info_100};
  color: ${({ theme, $urgent }) =>
    $urgent ? theme.COLORS.warn_300 : theme.COLORS.info_300};
  font-size: 0.75rem;
  font-weight: 500;
  width: fit-content;
  svg {
    font-size: 0.875rem;
  }
`;
