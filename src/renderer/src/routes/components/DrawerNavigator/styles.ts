import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  overflow: hidden;

  flex: 1;
  display: flex;
`;

export const DrawerContent = styled.aside``;

export const MainContainer = styled.div`
  position: relative;
  isolation: isolate;
  min-width: 0;
  width: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.COLORS.background};
  &::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    width: min(85vw, 1200px);
    height: 85%;
    background-image: radial-gradient(#9bd9b5 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.16;
    mask-image: radial-gradient(ellipse at 75% 75%, black 15%, transparent 85%);
    pointer-events: none;
    z-index: -1;
  }
`;

export const MainContent = styled.main`
  height: calc(var(--app-height) - 3.5rem);
  overflow-y: auto;

  background-color: transparent;
`;
