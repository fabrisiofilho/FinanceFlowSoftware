import { net } from 'electron';
export async function fetchBcbSeries(
  series: number,
  monthly: boolean,
  now: Date,
): Promise<unknown> {
  const start = new Date(now);
  if (monthly) start.setMonth(start.getMonth() - 18, 1);
  else start.setDate(start.getDate() - 90);
  const format = (date: Date): string =>
    `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  const url = new URL(
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados`,
  );
  url.search = new URLSearchParams({
    formato: 'json',
    dataInicial: format(start),
    dataFinal: format(now),
  }).toString();
  const response = await net.fetch(url.toString(), {
    signal: AbortSignal.timeout(12000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error('Fonte temporariamente indisponível.');
  const text = await response.text();
  if (text.length > 300000) throw new Error('Resposta da fonte muito grande.');
  return JSON.parse(text);
}
