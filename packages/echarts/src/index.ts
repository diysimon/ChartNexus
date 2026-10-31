import { echarts } from './engine.js';
export { echarts } from './engine.js';
import {
  failure,
  type MapAsset,
  type MapCatalog,
  type MapRegistry,
  type MapMetadata,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { sha256 } from './sha256.js';
export const mapLimits = Object.freeze({
  bytes: 5 * 1024 * 1024,
  points: 20000,
  regions: 1000,
  registrations: 8,
  totalBytes: 20 * 1024 * 1024,
});
const object = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === 'object' && !Array.isArray(x);
const text = (x: unknown, max = 256): x is string =>
  typeof x === 'string' && x.length > 0 && x.length <= max;
/** Strict plain JSON clone with a separate geometry budget. Never invokes getters or toJSON. */
function safeAsset(input: unknown): boolean {
  let nodes = 0;
  const seen = new Set<object>();
  function visit(x: unknown, depth: number): boolean {
    if (++nodes > 150000 || depth > 16) return false;
    if (x === null || typeof x === 'boolean') return true;
    if (typeof x === 'number') return Number.isFinite(x);
    if (typeof x === 'string') return x.length <= mapLimits.bytes;
    if (typeof x !== 'object' || seen.has(x)) return false;
    if (
      !Array.isArray(x) &&
      Object.getPrototypeOf(x) !== Object.prototype &&
      Object.getPrototypeOf(x) !== null
    )
      return false;
    if (Array.isArray(x) && x.length > 150000) return false;
    seen.add(x);
    for (const key of Reflect.ownKeys(x)) {
      if (
        typeof key !== 'string' ||
        ['__proto__', 'prototype', 'constructor'].includes(key)
      )
        return false;
      if (Array.isArray(x) && key === 'length') continue;
      const d = Object.getOwnPropertyDescriptor(x, key);
      if (!d || !('value' in d) || !d.enumerable || !visit(d.value, depth + 1))
        return false;
    }
    if (Array.isArray(x) && Object.keys(x).length !== x.length) return false;
    seen.delete(x);
    return true;
  }
  return visit(input, 0);
}
/** Host preparation, never a model tool argument. Strict subset, not a full GIS topology validator. */
export function createMapAsset(input: unknown): Result<MapAsset> {
  if (!safeAsset(input))
    return failure(
      'INVALID_MAP_ASSET',
      '/maps',
      'Expected bounded plain JSON map input.',
    );
  const raw = JSON.stringify(input);
  if (new TextEncoder().encode(raw).length > mapLimits.bytes)
    return failure('MAP_RESOURCE_LIMIT', '/maps', 'Map asset exceeds 5 MiB.');
  const v: unknown = JSON.parse(raw);
  if (
    !object(v) ||
    !text(v.id, 128) ||
    !text(v.revision, 128) ||
    !text(v.license, 1024) ||
    !text(v.provenance, 2048) ||
    v.coordinateSystem !== 'WGS84' ||
    !object(v.geoJSON) ||
    v.geoJSON.type !== 'FeatureCollection' ||
    'crs' in v.geoJSON ||
    !Array.isArray(v.geoJSON.features) ||
    v.geoJSON.features.length < 1 ||
    v.geoJSON.features.length > 1000
  )
    return failure(
      'INVALID_MAP_ASSET',
      '/maps',
      'Require id/revision/license/provenance, WGS84 and 1–1000 polygon features.',
    );
  const features: MapAsset['geoJSON']['features'] = [],
    regionKeys: string[] = [];
  let count = 0;
  function polygon(value: unknown): value is number[][][] {
    if (!Array.isArray(value) || value.length === 0) return false;
    for (const ring of value) {
      if (!Array.isArray(ring) || ring.length < 4) return false;
      let area = 0;
      for (let i = 0; i < ring.length; i++) {
        const p: unknown = ring[i];
        if (
          !Array.isArray(p) ||
          p.length !== 2 ||
          !p.every((n) => typeof n === 'number' && Number.isFinite(n)) ||
          Math.abs(p[0]) > 180 ||
          Math.abs(p[1]) > 90 ||
          ++count > mapLimits.points
        )
          return false;
        if (i > 0) {
          const prev = ring[i - 1] as number[];
          if (Math.abs(p[0] - prev[0]!) > 180) return false;
          area += prev[0]! * p[1] - p[0] * prev[1]!;
        }
      }
      const first = ring[0] as number[],
        last = ring.at(-1) as number[];
      if (first[0] !== last[0] || first[1] !== last[1] || area === 0)
        return false;
    }
    return true;
  }
  for (const f of v.geoJSON.features) {
    if (
      !object(f) ||
      f.type !== 'Feature' ||
      !object(f.properties) ||
      !text(f.properties.name) ||
      regionKeys.includes(f.properties.name) ||
      !object(f.geometry) ||
      'crs' in f.geometry
    )
      return failure(
        'INVALID_MAP_ASSET',
        '/maps/geoJSON/features',
        'Features require unique name keys and polygon geometry.',
      );
    const g = f.geometry;
    let geometry: MapAsset['geoJSON']['features'][number]['geometry'];
    if (g.type === 'Polygon' && polygon(g.coordinates))
      geometry = { type: 'Polygon', coordinates: g.coordinates };
    else if (
      g.type === 'MultiPolygon' &&
      Array.isArray(g.coordinates) &&
      g.coordinates.length > 0 &&
      g.coordinates.every(polygon)
    )
      geometry = { type: 'MultiPolygon', coordinates: g.coordinates };
    else
      return failure(
        'INVALID_MAP_ASSET',
        '/maps/geoJSON/features',
        'Use closed finite nondegenerate WGS84 Polygon/MultiPolygon rings within 20000 points; antimeridian crossings are unsupported.',
      );
    regionKeys.push(f.properties.name);
    features.push({
      type: 'Feature',
      properties: { name: f.properties.name },
      geometry,
    });
  }
  const geoJSON: MapAsset['geoJSON'] = { type: 'FeatureCollection', features };
  const hash = sha256(JSON.stringify(geoJSON));
  if (v.hash !== undefined && v.hash !== hash)
    return failure(
      'MAP_HASH_MISMATCH',
      '/maps/hash',
      'Geometry does not match the declared SHA-256.',
    );
  if (
    v.regionKeys !== undefined &&
    JSON.stringify(v.regionKeys) !== JSON.stringify(regionKeys)
  )
    return failure(
      'INVALID_MAP_ASSET',
      '/maps/regionKeys',
      'Metadata region keys do not match geometry.',
    );
  return {
    ok: true,
    value: {
      id: v.id,
      revision: v.revision,
      hash,
      regionKeys,
      coordinateSystem: 'WGS84',
      license: v.license,
      provenance: v.provenance,
      geoJSON,
    },
  };
}
/** Resolve only metadata for core; the renderer independently revalidates geometry and hashes. */
export function mapCatalog(maps: MapRegistry = {}): MapCatalog {
  return Object.fromEntries(
    Object.entries(maps).map(([key, asset]) => [
      key,
      {
        id: asset.id,
        revision: asset.revision,
        hash: asset.hash,
        regionKeys: asset.regionKeys,
        coordinateSystem: asset.coordinateSystem,
        license: asset.license,
        provenance: asset.provenance,
      },
    ]),
  );
}
const registrations = new Map<
  string,
  { hash: string; bytes: number; source: string }
>();
export function mapRegistrationStats() {
  return {
    count: registrations.size,
    bytes: [...registrations.values()].reduce((sum, a) => sum + a.bytes, 0),
    limits: mapLimits,
  };
}
export function registerPlanMap(
  plan: RenderPlan,
  maps: MapRegistry = {},
): Result<true> {
  const meta: MapMetadata | undefined = plan.map;
  if (!meta) return { ok: true, value: true };
  const input = Object.hasOwn(maps, meta.id) ? maps[meta.id] : undefined;
  if (!input)
    return failure(
      'MAP_NOT_FOUND',
      '/chart/mapRef',
      'Host map is unavailable.',
    );
  const checked = createMapAsset(input);
  if (!checked.ok) return checked;
  const asset = checked.value;
  if (
    asset.id !== meta.id ||
    asset.revision !== meta.revision ||
    asset.hash !== meta.hash
  )
    return failure(
      'MAP_REVISION_CONFLICT',
      '/chart/mapRef',
      'Prepared map snapshot no longer matches the compiled metadata.',
    );
  const name =
      'chartnexus:' + JSON.stringify([asset.id, asset.revision, asset.hash]),
    revisionKey = JSON.stringify([asset.id, asset.revision]),
    source = JSON.stringify(asset.geoJSON),
    bytes = new TextEncoder().encode(source).length;
  const prior = registrations.get(revisionKey);
  if (prior && (prior.hash !== asset.hash || prior.source !== source))
    return failure(
      'MAP_REVISION_CONFLICT',
      '/chart/mapRef',
      'An existing map revision cannot be overwritten.',
    );
  const existing = echarts.getMap(name);
  if (existing && JSON.stringify(existing.geoJSON) !== source)
    return failure(
      'MAP_REVISION_CONFLICT',
      '/chart/mapRef',
      'The ECharts registered map was changed externally.',
    );
  if (!prior) {
    const stats = mapRegistrationStats();
    if (stats.count >= 8 || stats.bytes + bytes > mapLimits.totalBytes)
      return failure(
        'MAP_RESOURCE_LIMIT',
        '/chart/mapRef',
        'Map registration capacity exhausted; use a fresh renderer or worker.',
      );
  }
  try {
    if (!existing)
      echarts.registerMap(name, { geoJSON: asset.geoJSON, specialAreas: {} });
  } catch {
    return failure(
      'INVALID_MAP_ASSET',
      '/maps',
      'ECharts rejected the geometry.',
    );
  }
  registrations.set(revisionKey, { hash: asset.hash, bytes, source });
  return { ok: true, value: true };
}

/** Fixed renderer-owned text callbacks preserve labels literally, including ECharts template markers.
 * No model string is interpreted as code; RenderPlan itself remains serializable JSON.
 */
export function renderOption(plan: RenderPlan): echarts.EChartsCoreOption {
  const option: Record<string, unknown> = { ...plan.option };
  if (Array.isArray(plan.option.series))
    option.series = plan.option.series.map((series) => {
      if (!object(series) || series.type !== 'sankey') return series;
      const labels = new Map<string, string>();
      if (Array.isArray(series.data))
        for (const point of series.data)
          if (
            object(point) &&
            typeof point.id === 'string' &&
            typeof point.name === 'string'
          )
            labels.set(point.id, point.name);
      return {
        ...series,
        label: {
          ...(object(series.label) ? series.label : {}),
          formatter: (params: unknown) =>
            object(params) &&
            object(params.data) &&
            typeof params.data.name === 'string'
              ? params.data.name
              : '',
        },
        tooltip: {
          renderMode: 'richText',
          formatter: (params: unknown) => {
            if (!object(params) || !object(params.data)) return '';
            const point = params.data;
            if (
              typeof point.source === 'string' &&
              typeof point.target === 'string'
            )
              return `${labels.get(point.source) ?? point.source} → ${labels.get(point.target) ?? point.target}\n${String(point.value)}`;
            return typeof point.name === 'string' ? point.name : '';
          },
        },
      };
    });
  return option;
}
