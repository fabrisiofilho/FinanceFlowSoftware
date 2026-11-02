import { useCallback, useEffect, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import { PageHeader } from '@renderer/components/PageHeader';
import { AppAlert } from '@renderer/components/Feedback';
import type { DiagnosticSnapshot } from '@shared/interfaces/types/diagnostics.types';
const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MiB';
export function DiagnosticsPage() {
  const [data,setData] = useState<DiagnosticSnapshot | null>(null), [error,setError] = useState(''), [copied,setCopied] = useState(false);
  const load = useCallback(async () => { const r = await window.electronAPI.diagnostics.snapshot(); if (!r.success || !r.data) throw new Error(r.error || 'Diagnóstico indisponível'); return r.data; },[]);
  useEffect(() => {
    let active = true, timer: ReturnType<typeof setTimeout>;
    const refresh = async () => { try { const next = await load(); if (active) {setData(next);setError('');} } catch(e) {if (active) setError(String(e));} finally {if (active) timer=setTimeout(refresh,5000);} };
    void refresh(); return () => {active=false;clearTimeout(timer);};
  },[load]);
  return <PageContainer><PageHeader title="Diagnóstico local" description="Métricas coletadas somente enquanto esta tela estiver aberta" actions={<Button disabled={!data} onClick={() => {if(data) {const {dataDirectory: _path,...anonymous}=data;void navigator.clipboard.writeText(JSON.stringify(anonymous,null,2)).then(() => setCopied(true)).catch((e) => setError(String(e)));}}}>Copiar relatório sem caminhos pessoais</Button>} />
    {error && <AppAlert severity="error">{error}</AppAlert>}{copied && <AppAlert severity="info">Relatório copiado.</AppAlert>}
    {data && <ContentSurface sx={{p:3}}><Stack gap={1}>
      <Typography>Contabily {data.version} · Electron {data.electron} · Chromium {data.chromium}</Typography>
      <Typography>Inicialização do main: {data.initializationMs ?? 'não medida'} ms · Ativo: {Math.round(data.uptimeSeconds)} s</Typography>
      <Typography>Consulta de controle SELECT 1: {data.queryMs.toFixed(2)} ms · Heap main: {mb(data.mainHeapBytes)}</Typography>
      {data.processes.map((p,i) => <Typography key={i}>{p.type}: working set {mb(p.workingSetKb*1024)} · privado {mb(p.privateBytesKb*1024)}</Typography>)}
      <Typography>SQLite {mb(data.sqliteBytes)} · WAL {mb(data.walBytes)} · SHM {mb(data.shmBytes)}</Typography>
      <Typography>Anexos {mb(data.attachmentBytes)} · cache {mb(data.cacheBytes)}</Typography>
      <Typography sx={{overflowWrap:'anywhere'}}>Diretório local: {data.dataDirectory}</Typography>
      <AppAlert severity="info">Working set inclui páginas compartilhadas; somar processos não representa memória exclusiva. Tempo de inicialização do main não mede cold start até janela utilizável. Nenhum dado é enviado.</AppAlert>
    </Stack></ContentSurface>}
  </PageContainer>;
}
