import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import styled from 'styled-components';
import { Box } from '@mui/material';

export const TransfersContainer = PageContainer;

export const TransferCard = styled(ContentSurface)`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const AccountBadge = styled(Box)`
  background: ${({ theme }) => theme.COLORS.primary}20;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-align: center;
  min-width: 120px;
`;

export const ArrowContainer = styled(Box)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.COLORS.textSecondary};
`;
