import styled from 'styled-components';
import { Box, Paper } from '@mui/material';

export const ReportsContainer = styled(Box)`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

export const PageHeaderContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

export const ReportCard = styled(Paper)`
  padding: 1.5rem;
  border-radius: 12px;
  height: 100%;
`;

export const HealthScoreCircle = styled(Box)<{ $score: number }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $score }) =>
    $score >= 70
      ? 'linear-gradient(135deg, #4caf50, #81c784)'
      : $score >= 40
        ? 'linear-gradient(135deg, #ff9800, #ffb74d)'
        : 'linear-gradient(135deg, #f44336, #e57373)'};
  color: white;
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
