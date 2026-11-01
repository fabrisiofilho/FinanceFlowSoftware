import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
} from '@mui/material';
import { Input } from '../Form/Input';
import { AppAlert } from '../Feedback';
import type { NotificationSettings } from '@shared/interfaces/types/notification.types';
export function NotificationPreferences({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    void window.electronAPI.notification
      .getSettings()
      .then((result) => {
        if (result.success && result.data) setSettings(result.data);
        else setError(result.error || 'Falha ao carregar preferências');
      })
      .catch(() => setError('Falha ao carregar preferências'));
  }, []);
  const save = async (): Promise<void> => {
    if (!settings) return;
    setBusy(true);
    try {
      const {
        investmentYieldEnabled,
        billDueEnabled,
        billDueDaysBefore,
        budgetExceededEnabled,
        budgetThresholdPercent,
        goalReachedEnabled,
        recurringGeneratedEnabled,
        lowBalanceEnabled,
        lowBalanceThreshold,
        invoiceClosingEnabled,
        invoiceClosingDaysBefore,
        soundEnabled,
      } = settings;
      const result = await window.electronAPI.notification.updateSettings({
        investmentYieldEnabled,
        billDueEnabled,
        billDueDaysBefore,
        budgetExceededEnabled,
        budgetThresholdPercent,
        goalReachedEnabled,
        recurringGeneratedEnabled,
        lowBalanceEnabled,
        lowBalanceThreshold,
        invoiceClosingEnabled,
        invoiceClosingDaysBefore,
        soundEnabled,
      });
      if (!result.success) throw new Error(result.error);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={() => !busy && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>Preferências de notificações</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <AppAlert severity="error">{error}</AppAlert>}
          {settings && (
            <>
              {(
                [
                  ['investmentYieldEnabled', 'Rendimentos mensais pendentes'],
                  ['billDueEnabled', 'Vencimentos cadastrados'],
                  ['budgetExceededEnabled', 'Limites do orçamento'],
                  ['goalReachedEnabled', 'Metas alcançadas'],
                  ['recurringGeneratedEnabled', 'Recorrências geradas'],
                  ['lowBalanceEnabled', 'Saldo baixo'],
                  ['invoiceClosingEnabled', 'Fechamento de faturas'],
                  ['soundEnabled', 'Som em avisos do sistema operacional'],
                ] as const
              ).map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  label={label}
                  control={
                    <Switch
                      checked={settings[key]}
                      onChange={(_, checked) =>
                        setSettings({ ...settings, [key]: checked })
                      }
                    />
                  }
                />
              ))}
              {(
                [
                  [
                    'billDueDaysBefore',
                    'Antecedência de vencimentos (dias)',
                    0,
                    90,
                  ],
                  [
                    'invoiceClosingDaysBefore',
                    'Antecedência de fechamento (dias)',
                    0,
                    31,
                  ],
                  [
                    'budgetThresholdPercent',
                    'Avisar orçamento a partir de (%)',
                    1,
                    100,
                  ],
                  [
                    'lowBalanceThreshold',
                    'Limite de saldo baixo (R$)',
                    0,
                    100000000,
                  ],
                ] as const
              ).map(([key, label, min, max]) => (
                <Input
                  key={key}
                  label={label}
                  type="number"
                  value={settings[key]}
                  slotProps={{ htmlInput: { min, max } }}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      [key]: Number(event.target.value),
                    })
                  }
                />
              ))}
              <AppAlert severity="info">
                A avaliação ocorre com o aplicativo aberto, ao entrar, ao focar
                a janela e periodicamente. Alertas por categoria seguem as
                regras da tela Alertas.
              </AppAlert>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={busy || !settings}
          onClick={() => void save()}
        >
          Salvar preferências
        </Button>
      </DialogActions>
    </Dialog>
  );
}
