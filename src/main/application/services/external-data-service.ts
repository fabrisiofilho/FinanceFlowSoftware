import {
  EXTERNAL_INDICATORS,
  type ExternalDataSnapshot,
  type ExternalIndicator,
} from '@shared/interfaces/types/external-data.types';
import { parseBcbSeries } from '@shared/external-data';
import { fetchBcbSeries } from '@main/infrastructure/external-data/bcb-client';
import {
  DiskMarketCache,
  type MarketCache,
} from '@main/infrastructure/external-data/market-cache';

const TTL = 30 * 60 * 1000,
  COOLDOWN = 60 * 1000;
export class ExternalDataService {
  private pending?: Promise<ExternalDataSnapshot>;
  private lastAttempt?: number;
  private memory?: unknown;
  constructor(
    private cache: MarketCache = new DiskMarketCache(),
    private fetcher = fetchBcbSeries,
    private clock: () => number = Date.now,
  ) {}
  snapshot(refresh = false): Promise<ExternalDataSnapshot> {
    if (typeof refresh !== 'boolean')
      return Promise.reject(new Error('Solicitação de atualização inválida.'));
    if (this.pending) return this.pending;
    this.pending = this.load(refresh).finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }
  private async load(refresh: boolean): Promise<ExternalDataSnapshot> {
    const now = this.clock(),
      stored = this.memory ?? (await this.cache.read());
    const records = Array.isArray(stored) ? stored : [];
    const previous = new Map<string, ExternalIndicator>();
    for (const item of records) {
      try {
        const spec = EXTERNAL_INDICATORS.find((spec) => spec.id === item?.id);
        const checked = Date.parse(item.checkedAt);
        if (
          !spec ||
          !Number.isFinite(checked) ||
          checked > now + 300000 ||
          !Array.isArray(item.points)
        )
          continue;
        const points = parseBcbSeries(
          item.points.map((point: { date: string; value: number }) => ({
            data: point.date.split('-').reverse().join('/'),
            valor: String(point.value),
          })),
          new Date(now),
        );
        if (
          points.some((point) =>
            spec.id === 'ipca' ? point.value <= -100 : point.value <= 0,
          )
        )
          continue;
        previous.set(spec.id, {
          id: spec.id,
          checkedAt: item.checkedAt,
          points,
          status: 'cached',
        });
      } catch {
        /* Cache inválido não substitui a fonte. */
      }
    }
    const cooldown =
      this.lastAttempt !== undefined && now - this.lastAttempt < COOLDOWN;
    let attempted = false;
    const indicators = await Promise.all(
      EXTERNAL_INDICATORS.map(
        async (
          spec: (typeof EXTERNAL_INDICATORS)[number],
        ): Promise<ExternalIndicator> => {
          const old = previous.get(spec.id),
            fresh = old && now - Date.parse(old.checkedAt!) < TTL;
          if ((!refresh && fresh) || cooldown)
            return (
              old ?? {
                id: spec.id,
                points: [],
                checkedAt: null,
                status: 'unavailable',
                error: 'Aguarde um minuto para tentar novamente.',
              }
            );
          attempted = true;
          try {
            const points = parseBcbSeries(
              await this.fetcher(
                spec.series,
                spec.frequency === 'monthly',
                new Date(now),
              ),
              new Date(now),
            );
            if (spec.id !== 'ipca' && points.some((point) => point.value <= 0))
              throw new Error('Taxa inválida.');
            if (
              spec.id === 'ipca' &&
              points.some((point) => point.value <= -100)
            )
              throw new Error('Índice inválido.');
            if (old && points.at(-1)!.date < old.points.at(-1)!.date)
              throw new Error('Resposta anterior ao cache.');
            return {
              id: spec.id,
              points,
              checkedAt: new Date(now).toISOString(),
              status: 'fresh',
            };
          } catch {
            return old
              ? {
                  ...old,
                  status: 'cached',
                  error:
                    'Não foi possível atualizar. Exibindo a última consulta salva.',
                }
              : {
                  id: spec.id,
                  points: [],
                  checkedAt: null,
                  status: 'unavailable',
                  error:
                    'Não foi possível consultar a fonte. Tente novamente com internet.',
                };
          }
        },
      ),
    );
    if (attempted) {
      this.lastAttempt = now;
      this.memory = indicators.filter((item) => item.points.length);
      try {
        await this.cache.write(indicators.filter((item) => item.points.length));
      } catch {
        /* Dados da sessão permanecem disponíveis mesmo se o cache não puder ser gravado. */
      }
    }
    return {
      indicators,
      nextRefreshAt:
        this.lastAttempt !== undefined
          ? new Date(this.lastAttempt + COOLDOWN).toISOString()
          : null,
    };
  }
}
