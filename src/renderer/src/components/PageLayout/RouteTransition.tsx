import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const enter = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const sweep = keyframes`
  from { transform: scaleX(0); opacity: 0; }
  35% { opacity: 0.8; }
  to { transform: scaleX(1); opacity: 0; }
`;
const Frame = styled.div`
  min-height: 100%;
  position: relative;
  animation: ${enter} 220ms ease-out both;
  &::before {
    content: '';
    pointer-events: none;
    position: absolute;
    inset: 0 0 auto;
    height: 2px;
    background: linear-gradient(90deg, transparent, #9bd9b5, transparent);
    transform-origin: left;
    animation: ${sweep} 700ms ease-out both;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    &::before {
      display: none;
    }
  }
`;

export function RouteTransition({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    frame.current?.parentElement?.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <Frame key={pathname} ref={frame}>
      {children}
    </Frame>
  );
}
