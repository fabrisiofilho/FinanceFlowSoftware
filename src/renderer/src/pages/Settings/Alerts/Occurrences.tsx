import { ListPagination } from '@renderer/components/ListPagination';
import { useCallback, useEffect, useState } from 'react';
import { Button, Stack, Tab, Tabs, Typography } from '@mui/material';
import { ContentSurface } from '@renderer/components/PageLayout';
import { AppAlert } from '@renderer/components/Feedback';
export function AlertOccurrences() {
  const [state, setState] = useState('active'),
    [page, setPage] = useState(0),
    [rows, setRows] = useState<
      {
        id: number;
        categoryName: string;
        severity: string;
        percentage: number;
        period: string;
      }[]
    >([]),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    const r = await window.electronAPI.alert.occurrences(state, page);
    if (!r.success) throw new Error(r.error);
    setRows(r.data ?? []);
  }, [state, page]);
  useEffect(() => {
    void load().catch((e) => setError(String(e)));
  }, [load]);
  return (
    <ContentSurface
      sx={{
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Stack gap={0.5}>
        <Typography variant="h6">Ocorrências de alerta</Typography>
        <Typography variant="body2" color="text.secondary">
          A condição financeira é independente da leitura da mensagem no
          sininho. A reavaliação resolve condições que deixaram de existir;
          dispensar silencia esta ocorrência.
        </Typography>
      </Stack>
      <Tabs
        value={state}
        onChange={(_, v) => {
          setState(v);
          setPage(0);
        }}
        variant="scrollable"
        aria-label="Situação das ocorrências"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="active" label="Críticos / Atenção" />
        <Tab value="resolved" label="Resolvidos" />
        <Tab value="dismissed" label="Dispensados" />
      </Tabs>
      {error && <AppAlert severity="error">{error}</AppAlert>}
      {!rows.length && (
        <Typography color="text.secondary" sx={{ py: 1 }}>
          Nenhuma ocorrência nesta seção.
        </Typography>
      )}
      {rows.map((r) => (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1.5}
          key={r.id}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <AppAlert
            sx={{ flex: 1 }}
            severity={r.severity === 'critical' ? 'error' : 'warning'}
          >
            {r.severity === 'critical' ? 'Crítico' : 'Atenção'} ·{' '}
            {r.categoryName} · {r.period} · {r.percentage.toFixed(0)}% do limite
          </AppAlert>
          {state === 'active' && (
            <Button
              onClick={() =>
                void window.electronAPI.alert
                  .dismissOccurrence(r.id)
                  .then((result) => {
                    if (!result.success) throw new Error(result.error);
                    return load();
                  })
                  .catch((e) => setError(String(e)))
              }
            >
              Dispensar
            </Button>
          )}
        </Stack>
      ))}
      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
        alignItems="center"
        justifyContent="space-between"
        sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}
      >
        <Button
          variant="outlined"
          onClick={() => void load().catch((e) => setError(String(e)))}
        >
          Reavaliar
        </Button>
        {(page > 0 || rows.length >= 24) && (
          <ListPagination
            count={-1}
            page={page}
            rowsPerPage={24}
            hasNext={rows.length >= 24}
            onPageChange={(_, next) => setPage(next)}
          />
        )}
      </Stack>
    </ContentSurface>
  );
}
