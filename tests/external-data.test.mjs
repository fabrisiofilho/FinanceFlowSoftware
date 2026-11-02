import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, deps = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: 1, target: 9 },
    }).outputText,
    {
      exports,
      Date,
      Map,
      Promise,
      require: (name) => {
        if (!(name in deps)) throw new Error('Import inesperado ' + name);
        return deps[name];
      },
    },
  );
  return exports;
}
const catalog = load('src/shared/interfaces/types/external-data.types.ts');
const domain = load('src/shared/external-data.ts', {
  './finance/calendar-date': load('src/shared/finance/calendar-date.ts'),
});
const { ExternalDataService } = load(
  'src/main/application/services/external-data-service.ts',
  {
    '@shared/interfaces/types/external-data.types': catalog,
    '@shared/external-data': domain,
    '@main/infrastructure/external-data/bcb-client': {
      fetchBcbSeries: () => {
        throw new Error('Rede real não permitida no teste');
      },
    },
    '@main/infrastructure/external-data/market-cache': {
      DiskMarketCache: class {},
    },
  },
);
const today = new Date(2026, 10, 2);
test('série externa valida calendário, decimais, ordem e conflitos sem inventar publicações', () => {
  const points = domain.parseBcbSeries(
    [
      { data: '30/10/2026', valor: '5.1234' },
      { data: '29/10/2026', valor: '5,12' },
    ],
    today,
  );
  assert.equal(points[0].date, '2026-10-29');
  assert.equal(points[1].value, 5.1234);
  for (const payload of [
    {},
    [],
    [{ data: '30/02/2026', valor: '5' }],
    [{ data: '03/11/2026', valor: '5' }],
    [{ data: '30/10/2026', valor: 'NaN' }],
    [
      { data: '30/10/2026', valor: '5' },
      { data: '30/10/2026', valor: '6' },
    ],
  ])
    assert.throws(() => domain.parseBcbSeries(payload, today));
});
test('IPCA de 12 meses compõe taxas e rejeita lacunas mensais', () => {
  const points = Array.from({ length: 12 }, (_, i) => ({
    date: `2025-${String(i + 1).padStart(2, '0')}-01`,
    value: 0.5,
  }));
  assert.ok(
    Math.abs(domain.ipcaTwelveMonths(points) - (1.005 ** 12 - 1) * 100) < 1e-9,
  );
  assert.equal(domain.ipcaTwelveMonths(points.slice(1)), null);
  assert.equal(
    domain.ipcaTwelveMonths([
      ...points.slice(0, 11),
      { date: '2026-01-01', value: 0.5 },
    ]),
    null,
  );
});
test('consulta usa catálogo fixo, deduplica chamadas, limita atualização e recupera cache offline', async () => {
  let time = today.getTime(),
    calls = 0,
    offline = false,
    stored = null;
  const cache = {
    read: async () => stored,
    write: async (value) => {
      stored = value;
    },
  };
  const fetcher = async (series) => {
    calls++;
    assert.ok([1, 21619, 432, 12, 433].includes(series));
    if (offline) throw new Error('offline');
    return [{ data: '30/10/2026', valor: series === 433 ? '-0.1' : '5.1234' }];
  };
  const service = new ExternalDataService(cache, fetcher, () => time);
  const first = service.snapshot();
  assert.equal(first, service.snapshot());
  const result = await first;
  assert.equal(calls, 5);
  assert.ok(result.indicators.every((item) => item.status === 'fresh'));
  await service.snapshot();
  await service.snapshot(true);
  assert.equal(calls, 5);
  time += 61000;
  offline = true;
  const fallback = await service.snapshot(true);
  assert.equal(calls, 10);
  assert.ok(
    fallback.indicators.every(
      (item) =>
        item.status === 'cached' && item.error && item.points.length === 1,
    ),
  );
  assert.equal(
    fallback.indicators[0].checkedAt,
    result.indicators[0].checkedAt,
  );
  const reopened = await new ExternalDataService(
    cache,
    fetcher,
    () => time,
  ).snapshot();
  assert.ok(reopened.indicators.every((item) => item.status === 'cached'));
  assert.equal(calls, 10);
  await assert.rejects(() => service.snapshot('arbitrary-url'), /inválida/);
});
test('falha de rede sem cache não vira cotação zero; falha de disco preserva sessão', async () => {
  const service = new ExternalDataService(
    { read: async () => null, write: async () => {} },
    async () => {
      throw new Error('offline');
    },
    () => today.getTime(),
  );
  assert.ok(
    (await service.snapshot()).indicators.every(
      (item) => item.status === 'unavailable' && item.points.length === 0,
    ),
  );
  let calls = 0;
  const memory = new ExternalDataService(
    {
      read: async () => null,
      write: async () => {
        throw new Error('disk');
      },
    },
    async () => {
      calls++;
      return [{ data: '30/10/2026', valor: '5' }];
    },
    () => today.getTime(),
  );
  await memory.snapshot();
  const result = await memory.snapshot();
  assert.equal(calls, 5);
  assert.ok(result.indicators.every((item) => item.points.length === 1));
});
test('posicionamento do tour mantém dica no viewport e prefere espaço ao lado do alvo', () => {
  const { tourPosition } = load(
    'src/renderer/src/components/Onboarding/tour-position.ts',
  );
  const rect = {
    left: 400,
    top: 200,
    right: 600,
    bottom: 250,
    width: 200,
    height: 50,
  };
  const positioned = tourPosition(rect, 1440, 900, 400);
  assert.equal(positioned.side, 'right');
  assert.ok(positioned.left >= rect.right);
  for (const [width, height] of [
    [320, 600],
    [800, 500],
    [1440, 900],
  ]) {
    const position = tourPosition(
      rect,
      width,
      height,
      Math.min(400, height - 72),
    );
    assert.ok(
      position.left >= 0 &&
        position.top >= 44 &&
        position.left + position.width <= width,
    );
  }
});
