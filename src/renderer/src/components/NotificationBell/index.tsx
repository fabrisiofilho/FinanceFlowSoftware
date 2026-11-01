import { AppAlert as Alert } from '@renderer/components/Feedback';
import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  NotificationsNoneRounded,
  DoneAllRounded,
  CloseRounded,
  MarkEmailReadOutlined,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import type { Notification } from '@shared/interfaces/types/notification.types';
import { formatDateToShow } from '@renderer/utils/date';
import { NotificationPreferences } from './Preferences';

export function NotificationBell() {
  const [preferences, setPreferences] = useState(false);
  const { pathname } = useLocation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [syncError, setSyncError] = useState('');
  useEffect(() => {
    setAnchor(null);
  }, [pathname]);
  const loadSummary = useCallback(async () => {
    try {
      const refreshed = await window.electronAPI.notification.refresh();
      if (!refreshed.success)
        throw new Error('Não foi possível avaliar os avisos agora.');
      setSyncError('');
      const response = await window.electronAPI.notification.getSummary();
      if (response.success && response.data)
        setUnread(response.data.unread ?? 0);
    } catch {
      setSyncError('Não foi possível atualizar os avisos. Tente novamente.');
    }
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await window.electronAPI.notification.findAll({
        page: 0,
        size: 20,
      });
      if (!response.success || !Array.isArray(response.data))
        throw new Error(
          response.error || 'Não foi possível carregar as notificações.',
        );
      setItems(response.data.filter((item) => !item.isDismissed));
      await loadSummary();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Falha ao carregar notificações.',
      );
    } finally {
      setLoading(false);
    }
  }, [loadSummary]);
  useEffect(() => {
    void loadSummary();
    const timer = window.setInterval(() => void loadSummary(), 60000);
    const refresh = (): void => {
      void loadSummary();
    };
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [loadSummary]);
  useEffect(() => {
    if (anchor) void load();
  }, [anchor, load]);
  const markRead = async (id?: number): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const response =
        id === undefined
          ? await window.electronAPI.notification.markAllAsRead()
          : await window.electronAPI.notification.markAsRead(id);
      if (!response.success)
        throw new Error(response.error || 'Não foi possível marcar como lida.');
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Falha ao atualizar notificações.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {preferences && (
        <NotificationPreferences onClose={() => setPreferences(false)} />
      )}
      <Tooltip title="Notificações">
        <IconButton
          aria-label={`Notificações: ${unread} não lidas`}
          aria-haspopup="dialog"
          aria-expanded={Boolean(anchor)}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          <Badge badgeContent={unread} color="error" max={99}>
            <NotificationsNoneRounded />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 400,
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: 3,
              mt: 1,
            },
          },
        }}
      >
        <Box role="dialog" aria-label="Central de notificações">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: 2 }}
          >
            <Typography variant="h6">Notificações</Typography>
            <Stack direction="row">
              <Tooltip title="Marcar todas como lidas">
                <span>
                  <IconButton
                    aria-label="Marcar todas como lidas"
                    disabled={busy || loading || unread === 0}
                    onClick={() => void markRead()}
                  >
                    <DoneAllRounded />
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton
                aria-label="Fechar notificações"
                onClick={() => setAnchor(null)}
              >
                <CloseRounded />
              </IconButton>
            </Stack>
          </Stack>
          <Divider />
          <Button
            fullWidth
            onClick={() => {
              setAnchor(null);
              setPreferences(true);
            }}
          >
            Preferências de avisos
          </Button>
          <Stack
            spacing={1}
            sx={{ p: 2, maxHeight: 420, overflowY: 'auto' }}
            aria-busy={loading}
          >
            {syncError && <Alert severity="warning">{syncError}</Alert>}
            {error && (
              <Alert
                severity="error"
                action={
                  <Button onClick={() => void load()}>Tentar novamente</Button>
                }
              >
                {error}
              </Alert>
            )}
            {loading
              ? Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} variant="rounded" height={90} />
                ))
              : items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: item.isRead
                        ? 'background.paper'
                        : 'action.selected',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="start"
                      gap={1}
                    >
                      <Typography
                        fontWeight={item.isRead ? 500 : 700}
                        variant="body2"
                      >
                        {item.title}
                      </Typography>
                      {!item.isRead && (
                        <Tooltip title="Marcar como lida">
                          <IconButton
                            size="small"
                            aria-label={`Marcar como lida: ${item.title}`}
                            disabled={busy}
                            onClick={() => void markRead(item.id)}
                          >
                            <MarkEmailReadOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {item.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateToShow(item.createdAt)}
                    </Typography>
                    <Button
                      size="small"
                      component={Link}
                      to={
                        item.referenceType?.startsWith('auto:yield:')
                          ? '/panel/investments'
                          : {
                              bill_due: '/panel/transactions',
                              budget_exceeded: '/panel/budget',
                              goal_reached: '/panel/goals',
                              recurring_generated: '/panel/recurring',
                              low_balance: '/panel/accounts',
                              invoice_closing: '/panel/credit-cards',
                              custom: '/panel/alerts',
                            }[item.type]
                      }
                      onClick={() => {
                        if (!item.isRead) void markRead(item.id);
                        setAnchor(null);
                      }}
                    >
                      Ver origem
                    </Button>
                  </Box>
                ))}
            {!loading && !error && items.length === 0 && (
              <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                <NotificationsNoneRounded
                  sx={{ fontSize: 40, color: 'text.secondary' }}
                />
                <Typography fontWeight={600}>Tudo em dia</Typography>
                <Typography variant="body2" color="text.secondary">
                  Nenhuma notificação por aqui.
                </Typography>
              </Stack>
            )}
          </Stack>
          <Divider />
          <Button
            component={Link}
            to="/panel/alerts"
            fullWidth
            onClick={() => setAnchor(null)}
            sx={{ py: 1.5 }}
          >
            Gerenciar alertas
          </Button>
        </Box>
      </Popover>
    </>
  );
}
