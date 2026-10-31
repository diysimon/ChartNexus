import {
  failure,
  type ChartDocument03,
  type DataRegistry,
  type MapCatalog,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { themeTokens } from './presentation.js';
import { resolveTable } from './data.js';
import {
  fieldsExist,
  identityKey,
  newPlan,
  sourceBudget,
  validateKeys,
} from './chart-03-common.js';
export const mapName = (id: string, revision: string, hash: string) =>
  'chartnexus:' + JSON.stringify([id, revision, hash]);
export function compileMap(
  doc: Extract<ChartDocument03, { chart: { type: 'map' } }>,
  registry: DataRegistry,
  maps: MapCatalog,
): Result<RenderPlan> {
  const c = doc.chart,
    ref = c.mapRef,
    asset = Object.hasOwn(maps, ref.id) ? maps[ref.id] : undefined;
  if (!asset)
    return failure(
      'MAP_NOT_FOUND',
      '/chart/mapRef',
      'Host must register the requested map asset.',
    );
  if (asset.id !== ref.id || asset.revision !== ref.revision)
    return failure(
      'MAP_REVISION_CONFLICT',
      '/chart/mapRef/revision',
      'Map revision does not match the host asset.',
    );
  if (
    !/^[a-f0-9]{64}$/.test(asset.hash) ||
    asset.coordinateSystem !== 'WGS84' ||
    !asset.license ||
    !asset.provenance ||
    !Array.isArray(asset.regionKeys) ||
    asset.regionKeys.length < 1 ||
    asset.regionKeys.length > 1000 ||
    new Set(asset.regionKeys).size !== asset.regionKeys.length
  )
    return failure(
      'INVALID_MAP_ASSET',
      '/chart/mapRef',
      'Map metadata is incomplete or invalid.',
    );
  const resolved = resolveTable(doc.data, registry);
  if (!resolved.ok) return resolved;
  const { table, revision } = resolved.value,
    e = c.encoding;
  for (const check of [
    fieldsExist(table, [e.region.field, e.value.field]),
    validateKeys(table, doc.data.keyField),
    sourceBudget(table),
  ])
    if (!check.ok) return check;
  if (
    table.rows.length > 1000 ||
    c.colorDomain.min >= c.colorDomain.max ||
    !Number.isFinite(c.colorDomain.max - c.colorDomain.min)
  )
    return failure(
      'INVALID_MAP_DATA',
      '/chart/colorDomain',
      'Use at most 1000 rows and an explicit finite min < max color domain.',
    );
  const values = new Map<string, { value: number | null; index: number }>();
  for (const [i, row] of table.rows.entries()) {
    const key = row[e.region.field],
      value = row[e.value.field];
    if (
      typeof key !== 'string' ||
      !asset.regionKeys.includes(key) ||
      values.has(key) ||
      !(
        value === null ||
        (typeof value === 'number' &&
          value >= c.colorDomain.min &&
          value <= c.colorDomain.max)
      )
    )
      return failure(
        'INVALID_MAP_DATA',
        `/data/rows/${i}`,
        'Region keys must match exactly and be unique; values must be null or inside the color domain.',
      );
    values.set(key, { value, index: i });
  }
  const plan = newPlan(
    doc,
    table,
    revision,
    `Regional map; color range ${c.colorDomain.min} to ${c.colorDomain.max}. Null and absent regions mean missing data, not zero. Asset ${asset.id}@${asset.revision}; ${asset.license}; ${asset.provenance}.`,
  );
  plan.map = {
    id: asset.id,
    revision: asset.revision,
    hash: asset.hash,
    regionKeys: [...asset.regionKeys],
    coordinateSystem: asset.coordinateSystem,
    license: asset.license,
    provenance: asset.provenance,
  };
  plan.markIdentities = {};
  const missing = doc.presentation?.theme === 'dark' ? '#475569' : '#e2e8f0';
  plan.option.series = [
    {
      type: 'map',
      id: 'map',
      map: mapName(asset.id, asset.revision, asset.hash),
      roam: false,
      showLegendSymbol: false,
      nameProperty: 'name',
      top: 56,
      bottom: 80,
      left: 24,
      right: 24,
      label: {
        show: doc.presentation?.dataLabels?.show ?? false,
        color: themeTokens[doc.presentation?.theme ?? 'light'].text,
        backgroundColor:
          themeTokens[doc.presentation?.theme ?? 'light'].surface,
        padding: [2, 4],
      },
      itemStyle: {
        areaColor: missing,
        borderColor: doc.presentation?.theme === 'dark' ? '#94a3b8' : '#64748b',
      },
      data: asset.regionKeys.map((region) => {
        const entry = values.get(region),
          id = identityKey('region', region);
        plan.markIdentities![id] = {
          identity: 'region',
          regionId: region,
          rowIndex: entry?.index ?? null,
        };
        return {
          id,
          name: region,
          value: entry?.value ?? null,
          ...(entry?.value == null
            ? { itemStyle: { areaColor: missing } }
            : {}),
        };
      }),
    },
  ];
  plan.option.visualMap = {
    type: 'continuous',
    min: c.colorDomain.min,
    max: c.colorDomain.max,
    calculable: false,
    orient: 'horizontal',
    left: 'center',
    bottom: 4,
    inRange: { color: ['#dbeafe', '#2563eb', '#1e3a8a'] },
    outOfRange: { color: missing },
    text: [String(c.colorDomain.max), String(c.colorDomain.min)],
  };
  plan.accessibility!.rendered = {
    columns: ['Region', 'Value', 'Source status'],
    rows: asset.regionKeys.map((region) => [
      region,
      values.get(region)?.value ?? null,
      values.has(region) ? 'provided' : 'absent',
    ]),
  };
  return { ok: true, value: plan };
}
