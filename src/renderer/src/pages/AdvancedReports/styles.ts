import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import styled from 'styled-components';
import { Box } from '@mui/material';

export const ReportsContainer = PageContainer;

export const ReportCard = styled(ContentSurface)`
  padding: 1.5rem;
  border-radius: 1.5rem;
  height: 100%;
`;

export const HealthScoreCircle = styled(Box)<{ $score: number }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $score }) =>
    $score >= 70
      ? theme.COLORS.success_100
      : $score >= 40
        ? theme.COLORS.warn_100
        : theme.COLORS.error_100};
  color: ${({ theme, $score }) =>
    $score >= 70
      ? theme.COLORS.success
      : $score >= 40
        ? theme.COLORS.warn
        : theme.COLORS.error};
  font-size: 2rem;
  font-weight: 700;
`;

export const TrendBadge = styled(Box)<{
  $trend: 'increasing' | 'decreasing' | 'stable';
}>`
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $trend, theme }) =>
    $trend === 'increasing'
      ? `${theme.COLORS.error}20`
      : $trend === 'decreasing'
        ? `${theme.COLORS.success}20`
        : `${theme.COLORS.grey_500}20`};
  color: ${({ $trend, theme }) =>
    $trend === 'increasing'
      ? theme.COLORS.error
      : $trend === 'decreasing'
        ? theme.COLORS.success
        : theme.COLORS.textSecondary};
`;
