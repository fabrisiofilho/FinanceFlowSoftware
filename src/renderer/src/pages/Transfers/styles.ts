import styled from 'styled-components';
import { Box, Paper } from '@mui/material';

export const TransfersContainer = styled(Box)`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

export const PageHeaderContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

export const TransferCard = styled(Paper)`
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
