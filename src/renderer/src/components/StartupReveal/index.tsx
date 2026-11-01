import { useEffect, useState, type PropsWithChildren } from 'react';
import { Button, Stack, Typography, useMediaQuery } from '@mui/material';
import { SpaOutlined } from '@mui/icons-material';
import styled, { keyframes } from 'styled-components';
import { FinancialTrace } from '../FinancialTrace';

const reveal = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }`;
const dissolve = keyframes`0%, 78% { opacity: 1; } 100% { opacity: 0; }`;
const Curtain = styled.div`
  position: fixed;
  inset: 40px 0 0;
  z-index: 1400;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: radial-gradient(ellipse at center, #222831 0%, #101216 65%);
  color: #edf9f1;
  animation: ${dissolve} 2400ms ease both;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(#a9dfbf35 1px, transparent 1px);
    background-size: 24px 24px;
    mask-image: linear-gradient(transparent, black 25%, black 75%, transparent);
  }
  .opening-trace {
    position: absolute;
    left: -4%;
    right: -4%;
    top: 42%;
  }
`;
const Content = styled.div<{ $ready: boolean }>`
  height: 100%;
  overflow: hidden;
  visibility: ${({ $ready }) => ($ready ? 'visible' : 'hidden')};
  animation: ${({ $ready }) => ($ready ? reveal : 'none')} 600ms ease both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export function StartupReveal({ children }: PropsWithChildren) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [finished, setFinished] = useState(false);
  const ready = finished || reducedMotion;
  useEffect(() => {
    const timer = window.setTimeout(() => setFinished(true), 2400);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <>
      <Content $ready={ready} inert={!ready} aria-hidden={!ready}>
        {children}
      </Content>
      {!ready && (
        <Curtain>
          <Stack
            alignItems="center"
            spacing={2}
            sx={{ position: 'relative', zIndex: 1, mt: '-16vh' }}
            role="status"
            aria-label="Abrindo Contabily"
          >
            <SpaOutlined sx={{ fontSize: 42, color: '#a9dfbf' }} />
            <Typography
              sx={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: '-.04em',
                color: 'inherit',
              }}
            >
              Contabily
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#b3c9bb', letterSpacing: '.06em' }}
            >
              Uma nova perspectiva para suas finanças.
            </Typography>
          </Stack>
          <div className="opening-trace">
            <FinancialTrace animated />
          </div>
          <Button
            onClick={() => setFinished(true)}
            sx={{
              position: 'absolute',
              right: 24,
              bottom: 24,
              color: '#ccecd8',
            }}
          >
            Pular abertura
          </Button>
        </Curtain>
      )}
    </>
  );
}
