import styled from 'styled-components';
import { Box, Paper } from '@mui/material';

export const ImportContainer = styled(Box)`
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

export const UploadArea = styled(Paper)`
  padding: 3rem;
  border-radius: 12px;
  border: 2px dashed ${({ theme }) => theme.COLORS.border};
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.COLORS.primary};
    background: ${({ theme }) => theme.COLORS.primary}08;
  }
`;

export const TransactionRow = styled(Box)<{ $status: string }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: ${({ $status, theme }) =>
    $status === 'duplicate'
      ? `${theme.COLORS.warn}20`
      : $status === 'imported'
        ? `${theme.COLORS.success}20`
        : $status === 'ignored'
          ? `${theme.COLORS.grey_500}20`
          : theme.COLORS.surface};
  border: 1px solid
    ${({ $status, theme }) =>
      $status === 'duplicate'
        ? theme.COLORS.warn
        : $status === 'imported'
          ? theme.COLORS.success
          : $status === 'ignored'
            ? theme.COLORS.grey_500
            : theme.COLORS.border};
`;
