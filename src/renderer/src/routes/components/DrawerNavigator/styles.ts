import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  overflow: hidden;

  flex: 1;
  display: flex;
`;

export const DrawerContent = styled.aside``;

export const MainContainer = styled.div`
  min-width: 0;
  width: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.COLORS.surface};
`;

export const MainContent = styled.main`
  background-image: radial-gradient(#ffffff07 1px, transparent 1px);
  background-size: 24px 24px;
  height: calc(var(--app-height) - 3.5rem);
  overflow-y: auto;

  background-color: ${({ theme }) => theme.COLORS.background};
`;
