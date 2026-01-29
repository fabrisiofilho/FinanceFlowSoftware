import styled from 'styled-components';
import { Box, Stack } from '@mui/material';

export const CategoriesContainer = styled(Box)`
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
