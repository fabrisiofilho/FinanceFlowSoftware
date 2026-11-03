import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import { PageHeader } from '@renderer/components/PageHeader';
import { AppAlert } from '@renderer/components/Feedback';
import type { DiagnosticSnapshot } from '@shared/interfaces/types/diagnostics.types';
const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MiB';
export function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticSnapshot | null>(null),
    [error, setError] = useState(''),
    [copied, setCopied] = useState(false);
  const load = useCallback(async () => {
    const r = await window.electronAPI.diagnostics.snapshot();
    if (!r.success || !r.data)
      throw new Error(r.error || 'Diagnóstico indisponível');
    return r.data;
  }, []);
  useEffect(() => {
    let active = true,
      timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const next = await load();
        if (active) {
          setData(next);
          setError('');
        }
      } catch (e) {
        if (active) setError(String(e));
      } finally {
        if (active) timer = setTimeout(refresh, 5000);
      }
    };
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [load]);
  return (
    <PageContainer>
      <PageHeader
        title="Diagnóstico local"
        description="Métricas coletadas somente enquanto esta tela estiver aberta"
        actions={
          <Button
            disabled={!data}
            onClick={() => {
              if (data) {
                const anonymous = { ...data, dataDirectory: undefined };
                void navigator.clipboard
                  .writeText(JSON.stringify(anonymous, null, 2))
                  .then(() => setCopied(true))
                  .catch((e) => setError(String(e)));
              }
            }}
          >
            Copiar relatório sem caminhos pessoais
          </Button>
        }
      />
      {error && <AppAlert severity="error">{error}</AppAlert>}
      {copied && <AppAlert severity="info">Relatório copiado.</AppAlert>}
      {data && (
        <ContentSurface sx={{ p: 3 }}>
          <Stack useFlexGap gap={3}>
            <Box
              component="dl"
              sx={{
                m: 0,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              {[
                ['Contabily', data.version],
                ['Electron', data.electron],
                ['Chromium', data.chromium],
                [
                  'Inicialização do main',
                  data.initializationMs == null
                    ? 'Não medida'
                    : data.initializationMs + ' ms',
                ],
                ['Tempo ativo', Math.round(data.uptimeSeconds) + ' s'],
                ['Consulta SELECT 1', data.queryMs.toFixed(2) + ' ms'],
                ['Heap main', mb(data.mainHeapBytes)],
                ['SQLite', mb(data.sqliteBytes)],
                ['WAL', mb(data.walBytes)],
                ['SHM', mb(data.shmBytes)],
                ['Anexos', mb(data.attachmentBytes)],
                ['Cache', mb(data.cacheBytes)],
                ['Diretório local', data.dataDirectory],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    minWidth: 0,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflowWrap: 'anywhere',
                  }}
                >
                  <Typography
                    component="dt"
                    variant="body2"
                    color="text.secondary"
                  >
                    {label}
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, mt: 0.5 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Stack useFlexGap gap={1.5}>
              <Typography variant="subtitle1">Memória por processo</Typography>
              {data.processes.map((process, index) => (
                <Stack
                  key={index}
                  direction={{ xs: 'column', sm: 'row' }}
                  useFlexGap
                  gap={{ xs: 0.5, sm: 2 }}
                  sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}
                >
                  <Typography>{process.type}</Typography>
                  <Typography color="text.secondary">
                    Working set {mb(process.workingSetKb * 1024)}
                  </Typography>
                  <Typography color="text.secondary">
                    Privado{' '}
                    {process.privateBytesKb === null
                      ? 'indisponível'
                      : mb(process.privateBytesKb * 1024)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            <AppAlert severity="info">
              Working set inclui páginas compartilhadas; somar processos não
              representa memória exclusiva. Tempo de inicialização do main não
              mede cold start até janela utilizável. Nenhum dado é enviado.
            </AppAlert>
          </Stack>
        </ContentSurface>
      )}
    </PageContainer>
  );
}
