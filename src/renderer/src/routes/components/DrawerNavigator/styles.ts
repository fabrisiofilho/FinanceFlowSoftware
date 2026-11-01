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
    width: min(34vw, 420px);
    height: min(32vh, 280px);
    background-image: radial-gradient(#9bd9b5 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.1;
    mask-image: radial-gradient(
      ellipse at bottom right,
      black,
      transparent 72%
    );
    pointer-events: none;
    z-index: -1;
  }
`;

export const MainContent = styled.main`
  height: calc(var(--app-height) - 3.5rem);
  overflow-y: auto;

  background-color: transparent;
`;
