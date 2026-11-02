import type { ApiResponse } from './common.types';

export const EXTERNAL_INDICATORS = [
  {
    id: 'usd',
    series: 1,
    name: 'Dólar americano',
    symbol: 'US$',
    unit: 'BRL/USD',
    group: 'Câmbio',
    frequency: 'daily',
    description:
      'Câmbio de referência de venda. Ajuda a acompanhar compras internacionais e despesas em dólar; não inclui spread, tarifas ou tributos.',
  },
  {
    id: 'eur',
    series: 21619,
    name: 'Euro',
    symbol: '€',
    unit: 'BRL/EUR',
    group: 'Câmbio',
    frequency: 'daily',
    description:
      'Câmbio de referência de venda para acompanhar despesas em euro. A cotação aplicada pelo banco ou cartão pode ser diferente.',
  },
  {
    id: 'selic',
    series: 432,
    name: 'Meta Selic',
    symbol: '%',
    unit: '% a.a.',
    group: 'Juros',
    frequency: 'daily',
    description:
      'Meta da taxa básica de juros definida pelo Copom, divulgada ao ano. É uma referência para o custo do crédito e investimentos.',
  },
  {
    id: 'cdi',
    series: 12,
    name: 'CDI diário',
    symbol: '%',
    unit: '% a.d.',
    group: 'Juros',
    frequency: 'daily',
    description:
      'Taxa diária de referência do CDI. A unidade é ao dia útil, não ao ano; não representa uma rentabilidade garantida de uma aplicação.',
  },
  {
    id: 'ipca',
    series: 433,
    name: 'IPCA mensal',
    symbol: '%',
    unit: '% no mês',
    group: 'Inflação',
    frequency: 'monthly',
    description:
      'Variação mensal do índice de preços apurado pelo IBGE e divulgado no SGS. Ajuda a observar a inflação; os gastos da sua família podem variar de outra forma.',
  },
] as const;
export type ExternalIndicatorId = (typeof EXTERNAL_INDICATORS)[number]['id'];
export interface IndicatorPoint {
  date: string;
  value: number;
}
export interface ExternalIndicator {
  id: ExternalIndicatorId;
  points: IndicatorPoint[];
  checkedAt: string | null;
  status: 'fresh' | 'cached' | 'unavailable';
  error?: string;
}
export interface ExternalDataSnapshot {
  indicators: ExternalIndicator[];
  nextRefreshAt: string | null;
}
export interface ExternalDataAPI {
  snapshot(refresh?: boolean): Promise<ApiResponse<ExternalDataSnapshot>>;
}
export function indicatorSource(series: number): string {
  return `https://www3.bcb.gov.br/sgspub/consultarmetadados/consultarMetadadosSeries.do?method=consultarMetadadosSeriesInternet&hdOidSerieSelecionada=${series}`;
}
