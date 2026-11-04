import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  CategoryOutlined,
  TrendingUpRounded,
  TrendingDownRounded,
  TrackChangesRounded,
  ShieldOutlined,
  CloseRounded,
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
  ArrowBackRounded,
  CheckCircleRounded,
  AutoAwesomeRounded,
} from '@mui/icons-material';
import { ONBOARDING_STEPS } from '@shared/interfaces/types/onboarding.types';
import { AppAlert } from '../Feedback';
import { tourPosition, type TourRect } from './tour-position';

const icons = [
  AccountBalanceWalletOutlined,
  CategoryOutlined,
  TrendingUpRounded,
  TrendingDownRounded,
  TrackChangesRounded,
  ShieldOutlined,
];
const selectors = [
  ['account-form', 'account-create'],
  ['category-form', 'categories-list'],
  ['transaction-form', 'income-create', 'transaction-create'],
  ['transaction-form', 'expense-create', 'transaction-create'],
  ['budget-form', 'budget-create'],
  ['backup-section'],
];
export function TourOverlay({
  index,
  ready,
  busy,
  error,
  onNext,
  onBack,
  onPause,
  onOpen,
  onRefresh,
  onSkip,
  replay,
  onRoute,
}: {
  index: number;
  ready: boolean;
  busy: boolean;
  error: string;
  onNext: () => void;
  onBack: () => void;
  onPause: () => void;
  onOpen: () => void;
  onRefresh: () => void;
  onSkip: () => void;
  replay: boolean;
  onRoute: boolean;
}) {
  const [rect, setRect] = useState<TourRect | null>(null),
    [viewport, setViewport] = useState({
      width: window.innerWidth,
      height: window.innerHeight,
    }),
    [panelHeight, setPanelHeight] = useState(390),
    [collapsed, setCollapsed] = useState(false),
    [inForm, setInForm] = useState(false);
  const panel = useRef<HTMLDivElement>(null),
    scrolled = useRef<HTMLElement | null>(null);
  const mask = useId().replace(/:/g, '');
  const step = ONBOARDING_STEPS[index],
    Icon = icons[index];
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, [index]);
  useEffect(() => {
    scrolled.current = null;
    setCollapsed(false);
  }, [index]);
  useEffect(() => {
    let frame = 0;
    const measure = (): void => {
      frame = 0;
      setViewport((old) =>
        old.width === window.innerWidth && old.height === window.innerHeight
          ? old
          : { width: window.innerWidth, height: window.innerHeight },
      );
      const modal = Array.from(
        document.querySelectorAll<HTMLElement>('[role=dialog]'),
      )
        .filter((element) => element.getClientRects().length > 0)
        .at(-1);
      const target = onRoute
        ? (modal ??
          selectors[index]
            .flatMap((key) =>
              Array.from(
                document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`),
              ),
            )
            .find((element) => element.getClientRects().length > 0))
        : null;
      setInForm(Boolean(target?.closest('[role=dialog]')));
      if (!target) {
        setRect((old) => (old === null ? old : null));
        return;
      }
      if (scrolled.current !== target) {
        scrolled.current = target;
        target.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'instant'
            : 'smooth',
        });
      }
      const bounds = target.getBoundingClientRect(),
        left = Math.max(8, bounds.left - 7),
        top = Math.max(44, bounds.top - 7),
        right = Math.min(window.innerWidth - 8, bounds.right + 7),
        bottom = Math.min(window.innerHeight - 8, bounds.bottom + 7);
      const next = {
        left,
        top,
        right,
        bottom,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
      };
      setRect((old) =>
        old &&
        Object.keys(next).every(
          (key) =>
            Math.abs(old[key as keyof TourRect] - next[key as keyof TourRect]) <
            1,
        )
          ? old
          : next,
      );
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'aria-hidden'],
    });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [index, onRoute]);
  useEffect(() => {
    if (!panel.current) return;
    const observer = new ResizeObserver(() => {
      const height = panel.current?.getBoundingClientRect().height ?? 390;
      setPanelHeight((old) => (Math.abs(old - height) < 1 ? old : height));
    });
    observer.observe(panel.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent): void => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !document.querySelector('[role=dialog]')
      ) {
        event.preventDefault();
        onPause();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onPause]);
  const position = tourPosition(
    rect,
    viewport.width,
    viewport.height,
    panelHeight,
  );
  const connector =
    rect && (position.side === 'right' || position.side === 'left')
      ? {
          x1:
            position.side === 'right'
              ? position.left - 3
              : position.left + position.width + 3,
          y1: Math.max(
            position.top + 24,
            Math.min(
              rect.top + rect.height / 2,
              position.top + panelHeight - 24,
            ),
          ),
          x2: position.side === 'right' ? rect.right + 5 : rect.left - 5,
          y2: rect.top + rect.height / 2,
        }
      : null;
  return createPortal(
    <Box
      data-guided-tour
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1450,
        pointerEvents: 'none',
        '& svg rect': {
          transition:
            'x 220ms ease-out, y 220ms ease-out, width 220ms ease-out, height 220ms ease-out',
        },
        '& [data-tour-connector]': { transition: 'd 220ms ease-out' },
        '@media (prefers-reduced-motion: reduce)': {
          '& svg rect, & [data-tour-connector], & [data-tour-label], & [data-tour-panel]':
            { transition: 'none' },
        },
      }}
    >
      <svg
        width="100%"
        height="100%"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <mask id={mask}>
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="14"
                fill="black"
              />
            )}
          </mask>
          <marker
            id={mask + 'arrow'}
            markerWidth="6"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="#9bd9b5" />
          </marker>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="#05070b"
          opacity=".76"
          mask={`url(#${mask})`}
        />
        {rect && (
          <rect
            data-tour-spotlight
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx="14"
            fill="none"
            stroke="#9bd9b5"
            strokeWidth="2"
          />
        )}
        {connector && (
          <path
            data-tour-connector
            d={`M${connector.x1},${connector.y1} L${connector.x2},${connector.y2}`}
            fill="none"
            stroke="#9bd9b5"
            strokeWidth="2"
            strokeLinecap="round"
            markerEnd={`url(#${mask}arrow)`}
          />
        )}
      </svg>
      {rect && (
        <Box
          data-tour-label
          sx={{
            transition: 'left 220ms ease-out, top 220ms ease-out',
            position: 'absolute',
            left: rect.left + 12,
            top: Math.max(44, rect.top - 14),
            bgcolor: 'primary.main',
            color: '#102219',
            px: 1.2,
            py: 0.3,
            borderRadius: 2,
            fontWeight: 800,
            fontSize: 12,
            boxShadow: '0 4px 20px #0008',
          }}
        >
          {String(index + 1).padStart(2, '0')} · {step.title}
        </Box>
      )}
      <Paper
        data-tour-panel
        ref={panel}
        tabIndex={-1}
        elevation={12}
        role="region"
        aria-label="Tour guiado"
        aria-live="polite"
        sx={{
          position: 'absolute',
          transition: 'left 220ms ease-out, top 220ms ease-out',
          left: position.left,
          top: position.top,
          width: position.width,
          maxHeight: 'calc(100vh - 72px)',
          overflowY: 'auto',
          pointerEvents: 'auto',
          border: '1px solid #52685d',
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 16px 70px #000a',
          p: 2.5,
          '&:focus': { outline: 'none' },
        }}
      >
        <Box
          key={index}
          sx={{
            '@keyframes tourStepFade': {
              from: { opacity: 0.65 },
              to: { opacity: 1 },
            },
            animation: 'tourStepFade 180ms ease-out',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <Stack
            direction="row"
            gap={1}
            alignItems="center"
            mb={collapsed ? 0 : 2}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: '#9bd9b515',
                border: '1px solid #9bd9b540',
                display: 'grid',
                placeItems: 'center',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              <Icon />
            </Box>
            <Box flex={1} minWidth={0}>
              <Typography
                variant="caption"
                color="primary"
                fontWeight={700}
                sx={{ display: 'block', lineHeight: 1.5 }}
              >
                SEU GUIA PESSOAL
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                Etapa {index + 1} de {ONBOARDING_STEPS.length}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label={collapsed ? 'Expandir dica' : 'Recolher dica'}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <KeyboardArrowUpRounded />
              ) : (
                <KeyboardArrowDownRounded />
              )}
            </IconButton>
            <IconButton size="small" aria-label="Pausar tour" onClick={onPause}>
              <CloseRounded />
            </IconButton>
          </Stack>
          {!collapsed && (
            <>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, lineHeight: 1.3, mb: 1 }}
              >
                {step.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.7 }}
              >
                {step.description}
              </Typography>
              {!onRoute && (
                <AppAlert severity="info" sx={{ mt: 2 }}>
                  Abra a tela desta etapa para ver o destaque.
                </AppAlert>
              )}
              {inForm && (
                <Typography variant="body2" sx={{ mt: 1.5 }}>
                  Preencha o formulário destacado e salve. Você pode recolher
                  esta dica enquanto cadastra.
                </Typography>
              )}
              <Stack
                direction="row"
                gap={1}
                alignItems="center"
                justifyContent="center"
                sx={{ mt: 2, mb: 2 }}
              >
                <Chip
                  size="small"
                  icon={ready ? <CheckCircleRounded /> : <AutoAwesomeRounded />}
                  color={ready ? 'success' : 'default'}
                  sx={{
                    height: 28,
                    '& .MuiChip-label': { lineHeight: 1.3 },
                    '& .MuiChip-icon': { display: 'block', ml: 1 },
                  }}
                  label={
                    replay
                      ? 'Modo de apresentação'
                      : ready
                        ? 'Tudo certo para avançar'
                        : 'Sua próxima ação'
                  }
                />
              </Stack>
              {error && (
                <AppAlert severity="error" sx={{ mb: 2 }}>
                  {error}
                </AppAlert>
              )}
              <LinearProgress
                variant="determinate"
                value={((index + 1) / ONBOARDING_STEPS.length) * 100}
                sx={{ height: 5, borderRadius: 3, mb: 2 }}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                  mb: 1,
                  '& .MuiButton-root': {
                    minHeight: 40,
                    justifyContent: 'center',
                    textAlign: 'center',
                    lineHeight: 1.35,
                  },
                }}
              >
                <Button
                  disabled={busy || index === 0 || inForm}
                  startIcon={<ArrowBackRounded />}
                  onClick={onBack}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  disabled={busy || !ready || inForm}
                  onClick={onNext}
                >
                  {replay
                    ? index === 5
                      ? 'Finalizar tour'
                      : 'Próxima etapa'
                    : index === 5
                      ? 'Concluir guia'
                      : 'Avançar'}
                </Button>
              </Box>
              <Stack
                spacing={0.5}
                sx={{
                  '& .MuiButton-root': {
                    minHeight: 40,
                    justifyContent: 'center',
                    textAlign: 'center',
                    lineHeight: 1.35,
                  },
                }}
              >
                <Button variant="outlined" disabled={busy} onClick={onOpen}>
                  {!onRoute
                    ? 'Abrir tela da etapa'
                    : inForm
                      ? 'Continuar no formulário'
                      : index === 5
                        ? 'Ver backup e preferências'
                        : index === 1
                          ? 'Conhecer categorias'
                          : 'Abrir cadastro'}
                </Button>
                {!ready && (
                  <Button size="small" disabled={busy} onClick={onRefresh}>
                    Verificar cadastro
                  </Button>
                )}
                {index === 4 && !replay && (
                  <Button size="small" disabled={busy} onClick={onSkip}>
                    Configurar orçamento depois
                  </Button>
                )}
                <Button size="small" color="inherit" onClick={onPause}>
                  Continuar depois
                </Button>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                sx={{ mt: 1 }}
              >
                Seu progresso fica salvo. Retome quando quiser.
              </Typography>
            </>
          )}
        </Box>
      </Paper>
    </Box>,
    document.body,
  );
}
