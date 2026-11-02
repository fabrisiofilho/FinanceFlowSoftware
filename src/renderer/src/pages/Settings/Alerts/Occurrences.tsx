import { useCallback, useEffect, useState } from 'react';
import { Button, Stack, Tab, Tabs, Typography } from '@mui/material';
import { ContentSurface } from '@renderer/components/PageLayout';
import { AppAlert } from '@renderer/components/Feedback';
export function AlertOccurrences() {
  const [state,setState] = useState('active'), [page,setPage] = useState(0), [rows,setRows] = useState<{id:number;categoryName:string;severity:string;percentage:number;period:string}[]>([]), [error,setError] = useState('');
  const load = useCallback(async () => { const r = await window.electronAPI.alert.occurrences(state,page); if (!r.success) throw new Error(r.error); setRows(r.data ?? []); },[state,page]);
  useEffect(() => { void load().catch((e) => setError(String(e))); },[load]);
  return <ContentSurface sx={{p:2,mb:3}}><Typography variant="h6">Ocorrências de alerta</Typography><Typography variant="body2">A condição financeira é independente da leitura da mensagem no sininho. A reavaliação resolve condições que deixaram de existir; dispensar silencia esta ocorrência.</Typography>
    <Tabs value={state} onChange={(_,v) => {setState(v);setPage(0);}} variant="scrollable"><Tab value="active" label="Críticos / Atenção" /><Tab value="resolved" label="Resolvidos" /><Tab value="dismissed" label="Dispensados" /></Tabs>
    {error && <AppAlert severity="error">{error}</AppAlert>}
    {!rows.length && <Typography>Nenhuma ocorrência nesta seção.</Typography>}
    {rows.map((r) => <Stack direction="row" gap={2} key={r.id} alignItems="center"><AppAlert severity={r.severity === 'critical' ? 'error' : 'warning'}>{r.severity === 'critical' ? 'Crítico' : 'Atenção'} · {r.categoryName} · {r.period} · {r.percentage.toFixed(0)}% do limite</AppAlert>{state==='active' && <Button onClick={() => void window.electronAPI.alert.dismissOccurrence(r.id).then((result) => {if(!result.success)throw new Error(result.error);return load();}).catch((e) => setError(String(e)))}>Dispensar</Button>}</Stack>)}
    <Stack direction="row"><Button onClick={() => void load().catch((e) => setError(String(e)))}>Reavaliar</Button><Button disabled={!page} onClick={() => setPage(page-1)}>Anterior</Button><Button disabled={rows.length<24} onClick={() => setPage(page+1)}>Próxima</Button></Stack>
  </ContentSurface>;
}
