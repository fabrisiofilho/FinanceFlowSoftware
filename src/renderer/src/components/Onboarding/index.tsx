import { useCallback, useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { AppAlert } from '../Feedback';
import {
  ONBOARDING_STEPS,
  type OnboardingState,
} from '@shared/interfaces/types/onboarding.types';

export function Onboarding() {
  const revision = useRef(0);
  const [state, setState] = useState<OnboardingState>();
  const [active, setActive] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const location = useLocation(),
    navigate = useNavigate();
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    const result = await window.electronAPI.onboarding.state();
    if (current === revision.current && result.success && result.data)
      setState(result.data);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh, location.pathname]);
  useEffect(() => {
    const remove = window.electronAPI.onIpcResult((event) => {
      if (
        event.success &&
        !event.channel.startsWith('onboarding:') &&
        /:(create|update|delete|confirm|import)/.test(event.channel)
      )
        void refresh();
    });
    return remove;
  }, [refresh]);
  if (
    !state ||
    state.completed ||
    (!active && location.pathname !== '/panel/dashboard')
  )
    return null;
  const step = ONBOARDING_STEPS[state.step];
  if (!step) return null;
  async function next(skip = false) {
    setBusy(true);
    setError('');
    try {
      const result = await window.electronAPI.onboarding.advance(
        state!.step,
        skip,
      );
      if (!result.success || !result.data)
        throw new Error(result.error || 'Não foi possível salvar a etapa.');
      revision.current++;
      setState(result.data);
      if (!result.data.completed)
        navigate(ONBOARDING_STEPS[result.data.step].route);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao avançar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box
      sx={{
        mx: { xs: 2, md: 5 },
        mt: 3,
        p: 2,
        border: 1,
        borderColor: 'primary.main',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
      aria-label="Primeiros passos"
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Typography fontWeight={600}>
          Primeiros passos · {state.step + 1}/{ONBOARDING_STEPS.length}:{' '}
          {step.title}
        </Typography>
        <Button
          onClick={() => {
            setActive(!active);
            if (!active) navigate(step.route);
          }}
        >
          {active ? 'Continuar depois' : 'Retomar guia'}
        </Button>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={(state.step / ONBOARDING_STEPS.length) * 100}
        sx={{ mt: 1 }}
      />
      {active && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography>{step.description}</Typography>
          {error && <AppAlert severity="error">{error}</AppAlert>}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button onClick={() => navigate(step.route)}>
              Abrir tela da etapa
            </Button>
            <Button onClick={() => void refresh()} disabled={busy}>
              Verificar cadastro
            </Button>
            <Button
              variant="contained"
              disabled={busy || !state.ready}
              onClick={() => void next()}
            >
              {state.step === 5
                ? 'Concluir primeiros passos'
                : 'Concluir etapa e avançar'}
            </Button>
            {state.step === 4 && (
              <Button disabled={busy} onClick={() => void next(true)}>
                Configurar orçamento depois
              </Button>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
