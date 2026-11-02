import { useCallback, useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  AutoAwesomeRounded,
  CheckCircleRounded,
  ArrowForwardRounded,
  ExploreOutlined,
} from '@mui/icons-material';
import {
  ONBOARDING_STEPS,
  type OnboardingState,
} from '@shared/interfaces/types/onboarding.types';
import { TourOverlay } from './TourOverlay';

export function Onboarding() {
  const revision = useRef(0),
    startFocus = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<OnboardingState>(),
    [active, setActive] = useState(false),
    [index, setIndex] = useState(0),
    [replay, setReplay] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [finished, setFinished] = useState(false);
  const location = useLocation(),
    navigate = useNavigate();
  const refresh = useCallback(async () => {
    const token = ++revision.current;
    try {
      const result = await window.electronAPI.onboarding.state();
      if (token !== revision.current) return;
      if (result.success && result.data) setState(result.data);
      else setError(result.error || 'Não foi possível verificar a etapa.');
    } catch {
      if (token === revision.current)
        setError('Não foi possível verificar a etapa. Tente novamente.');
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh, location.pathname]);
  useEffect(
    () =>
      window.electronAPI.onIpcResult((event) => {
        if (
          event.success &&
          !event.channel.startsWith('onboarding:') &&
          /:(create|update|delete|confirm|import)/.test(event.channel)
        )
          void refresh();
      }),
    [refresh],
  );
  const start = useCallback(
    (beginning = false) => {
      if (!state) return;
      startFocus.current = document.activeElement as HTMLElement;
      setReplay(state.completed);
      const step = beginning ? 0 : state.step;
      setIndex(step);
      setActive(true);
      setError('');
      navigate(ONBOARDING_STEPS[step].route);
    },
    [state, navigate],
  );
  useEffect(() => {
    const listener = () => start(true);
    window.addEventListener('contabily:start-tour', listener);
    return () => window.removeEventListener('contabily:start-tour', listener);
  }, [start]);
  const pause = useCallback(() => {
    setActive(false);
    requestAnimationFrame(() => {
      if (startFocus.current?.isConnected) startFocus.current.focus();
      else
        document
          .querySelector<HTMLButtonElement>('[data-page-header] button')
          ?.focus();
    });
  }, []);
  const change = (step: number) => {
    setIndex(step);
    setError('');
    navigate(ONBOARDING_STEPS[step].route);
  };
  async function next(skip = false) {
    if (!state) return;
    if (replay || index < state.step) {
      if (index === 5) {
        setActive(false);
        setFinished(true);
      } else change(index + 1);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await window.electronAPI.onboarding.advance(index, skip);
      if (!result.success || !result.data)
        throw new Error(result.error || 'Não foi possível salvar a etapa.');
      revision.current++;
      setState(result.data);
      if (result.data.completed) {
        setActive(false);
        setFinished(true);
        navigate('/panel/dashboard');
      } else change(result.data.step);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Não foi possível avançar.',
      );
    } finally {
      setBusy(false);
    }
  }
  const open = () => {
    const route = ONBOARDING_STEPS[index].route;
    if (location.pathname !== route) {
      navigate(route);
      return;
    }
    const dialog = Array.from(
      document.querySelectorAll<HTMLElement>('[role=dialog]'),
    ).at(-1);
    if (dialog) {
      dialog.querySelector<HTMLInputElement>('input')?.focus();
      return;
    }
    if (index === 2 || index === 3) {
      navigate(
        '/panel/transactions?new=' + (index === 2 ? 'income' : 'expense'),
      );
      return;
    }
    const key =
      index === 0
        ? 'account-create'
        : index === 1
          ? 'categories-list'
          : index === 4
            ? 'budget-create'
            : 'backup-section';
    const element = Array.from(
      document.querySelectorAll<HTMLElement>('[data-tour="' + key + '"]'),
    ).find((element) => element.getClientRects().length > 0);
    element?.scrollIntoView({ block: 'nearest' });
    if (element?.tagName === 'BUTTON') element.click();
    else element?.querySelector<HTMLInputElement>('input')?.focus();
  };
  if (!state) return null;
  return (
    <>
      {!active &&
        !state.completed &&
        location.pathname === '/panel/dashboard' && (
          <Box
            aria-label="Primeiros passos"
            sx={{
              mx: { xs: 2, md: 5 },
              mt: 3,
              p: { xs: 2, md: 3 },
              border: '1px solid #9bd9b540',
              borderRadius: 3,
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                right: -40,
                top: -55,
                width: 190,
                height: 190,
                border: '1px solid #9bd9b510',
                borderRadius: '50%',
              }}
            />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems={{ sm: 'center' }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'grid',
                  placeItems: 'center',
                  width: 68,
                  height: 68,
                  flexShrink: 0,
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={68}
                  thickness={3}
                  sx={{ color: 'divider', position: 'absolute' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={(state.step / 6) * 100}
                  size={68}
                  thickness={3}
                  sx={{ position: 'absolute' }}
                />
                <ExploreOutlined color="primary" sx={{ fontSize: 30 }} />
              </Box>
              <Box flex={1}>
                <Chip
                  size="small"
                  icon={<AutoAwesomeRounded />}
                  label="SEU GUIA PESSOAL"
                  sx={{ mb: 1, bgcolor: '#9bd9b512', color: 'primary.main' }}
                />
                <Typography variant="h6" fontWeight={700}>
                  Vamos organizar suas finanças?
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Etapa {state.step + 1} de 6 ·{' '}
                  {ONBOARDING_STEPS[state.step].title}. Um tour pelas telas, no
                  seu ritmo.
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(state.step / 6) * 100}
                  sx={{ mt: 2, height: 4, borderRadius: 2, maxWidth: 360 }}
                />
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowForwardRounded />}
                onClick={() => start()}
              >
                Retomar guia
              </Button>
            </Stack>
          </Box>
        )}
      {active && (
        <TourOverlay
          index={index}
          ready={replay || index < state.step || state.ready}
          replay={replay}
          busy={busy}
          error={error}
          onRoute={location.pathname === ONBOARDING_STEPS[index].route}
          onNext={() => void next()}
          onBack={() => change(Math.max(0, index - 1))}
          onPause={pause}
          onOpen={open}
          onRefresh={() => void refresh()}
          onSkip={() => void next(true)}
        />
      )}
      <Dialog
        open={finished}
        onClose={() => setFinished(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <CheckCircleRounded
            color="primary"
            sx={{ display: 'block', mx: 'auto', mb: 2, fontSize: 54 }}
          />
          {replay ? 'Tour revisado!' : 'Seu financeiro ganhou um começo!'}
        </DialogTitle>
        <DialogContent>
          <Typography textAlign="center" color="text.secondary">
            Continue registrando receitas e despesas, confira o orçamento e
            mantenha seu backup em dia. Você pode rever o tour nas
            configurações.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}
        >
          <Button onClick={() => setFinished(false)}>
            Continuar no sistema
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setFinished(false);
              navigate('/panel/external-data');
            }}
          >
            Conhecer dados externos
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
