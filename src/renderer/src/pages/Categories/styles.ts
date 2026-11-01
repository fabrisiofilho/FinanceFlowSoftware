import { PageContainer } from '@renderer/components/PageLayout';
import styled from 'styled-components';
import { Box, Stack } from '@mui/material';

export const CategoriesContainer = PageContainer;

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
