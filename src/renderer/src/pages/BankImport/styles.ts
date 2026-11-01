import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import styled from 'styled-components';
import { Box } from '@mui/material';

export const ImportContainer = PageContainer;

export const UploadArea = styled(ContentSurface)`
  padding: 3rem;
  border-radius: 1.5rem;
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
