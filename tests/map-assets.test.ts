import { test, expect } from 'vitest';
import { createHash } from 'node:crypto';
import {
  createMapAsset,
  mapCatalog,
  mapRegistrationStats,
  registerPlanMap,
} from '@chartnexus/echarts';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import assetInput from '../examples/maps/two-regions.json';
import doc from '../resources/recipes/map-03.json';
function prepare(input: unknown = assetInput) {
  const asset = createMapAsset(input);
  if (!asset.ok) throw new Error(JSON.stringify(asset));
  return asset.value;
}
test('asset SHA-256 matches Node crypto; preparation clones, checks metadata and invalid geometry', () => {
  const raw = structuredClone(assetInput);
  const asset = prepare(raw);
  expect(asset.hash).toBe(
    createHash('sha256').update(JSON.stringify(asset.geoJSON)).digest('hex'),
  );
  raw.geoJSON.features[0]!.geometry.coordinates[0]![0]![0] = 123;
  expect(asset.geoJSON.features[0]!.geometry.coordinates[0]![0]![0]).toBe(0);
  for (const alter of [
    (v: typeof raw) => Object.assign(v, { coordinateSystem: 'mercator' }),
    (v: typeof raw) => Object.assign(v.geoJSON, { crs: { name: 'EPSG:4326' } }),
    (v: typeof raw) => {
      v.geoJSON.features[0]!.geometry.coordinates[0]!.pop();
    },
    (v: typeof raw) => {
      v.geoJSON.features[0]!.geometry.coordinates[0]![1]![0] = 181;
    },
    (v: typeof raw) => {
      v.geoJSON.features[0]!.geometry.coordinates[0]![1]![1] = 91;
    },
    (v: typeof raw) => {
      v.geoJSON.features[0]!.geometry.coordinates[0]![1]![0] = NaN;
    },
    (v: typeof raw) =>
      Object.assign(v.geoJSON.features[0]!.geometry, {
        type: 'GeometryCollection',
      }),
    (v: typeof raw) => {
      v.geoJSON.features[1]!.properties.name = 'West';
    },
    (v: typeof raw) => Object.assign(v, { license: '' }),
  ]) {
    const input = structuredClone(assetInput);
    alter(input);
    expect(createMapAsset(input).ok).toBe(false);
  }
  expect(createMapAsset({ ...asset, hash: '0'.repeat(64) })).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'MAP_HASH_MISMATCH' }],
  });
  expect(createMapAsset({ ...asset, regionKeys: ['Other'] })).toMatchObject({
    ok: false,
  });
  let accessed = false;
  expect(
    createMapAsset({
      get geoJSON() {
        accessed = true;
        return {};
      },
    }).ok,
  ).toBe(false);
  expect(accessed).toBe(false);
});
test('Polygon/MultiPolygon, holes and non-ASCII keys have a deterministic shared digest', () => {
  const input = structuredClone(assetInput);
  const geometry = input.geoJSON.features[0]!.geometry;
  const multi = {
    ...input,
    geoJSON: {
      ...input.geoJSON,
      features: [
        {
          ...input.geoJSON.features[0],
          properties: { name: '区域甲' },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [geometry.coordinates],
          },
        },
      ],
    },
  };
  const a = prepare(multi);
  expect(a.hash).toBe(
    createHash('sha256').update(JSON.stringify(a.geoJSON)).digest('hex'),
  );
  expect(a.regionKeys).toEqual(['区域甲']);
});
test('asset count/point/size limits fail before ECharts registration', () => {
  const many = structuredClone(assetInput);
  many.geoJSON.features = Array.from({ length: 1001 }, (_, i) => ({
    ...assetInput.geoJSON.features[0]!,
    properties: { name: String(i) },
  }));
  expect(createMapAsset(many).ok).toBe(false);
  const points = structuredClone(assetInput);
  points.geoJSON.features[0]!.geometry.coordinates = [
    Array.from({ length: 20001 }, (_, i) => [i % 2, 0]),
  ];
  expect(createMapAsset(points).ok).toBe(false);
  expect(
    createMapAsset({ ...assetInput, extra: 'a'.repeat(5 * 1024 * 1024) }),
  ).toMatchObject({ ok: false, diagnostics: [{ code: 'MAP_RESOURCE_LIMIT' }] });
});
test('map registration preserves revisions, rejects same-revision replacement and enforces eight registrations', () => {
  const asset = prepare();
  const maps = { [asset.id]: asset },
    plan = compileChart(doc, {}, mapCatalog(maps));
  if (!plan.ok) throw new Error('compile');
  expect(registerPlanMap(plan.value, maps).ok).toBe(true);
  expect(registerPlanMap(plan.value, maps).ok).toBe(true);
  const changed = structuredClone(assetInput);
  changed.geoJSON.features[0]!.geometry.coordinates[0]![1]![0] = 9;
  const other = prepare(changed);
  const conflicting = compileChart(doc, {}, mapCatalog({ [other.id]: other }));
  if (!conflicting.ok) throw new Error('compile');
  expect(
    registerPlanMap(conflicting.value, { [other.id]: other }),
  ).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'MAP_REVISION_CONFLICT' }],
  });
  expect(renderSvg(doc, { maps }).ok).toBe(true);
  for (let i = mapRegistrationStats().count; i < 8; i++) {
    const a = prepare({ ...assetInput, revision: String(i + 1) }),
      d = {
        ...doc,
        chart: { ...doc.chart, mapRef: { id: a.id, revision: a.revision } },
      };
    expect(renderSvg(d, { maps: { [a.id]: a } }).ok).toBe(true);
  }
  const overflow = prepare({ ...assetInput, revision: 'overflow' });
  expect(
    renderSvg(
      {
        ...doc,
        chart: {
          ...doc.chart,
          mapRef: { id: overflow.id, revision: overflow.revision },
        },
      },
      { maps: { [overflow.id]: overflow } },
    ),
  ).toMatchObject({ ok: false, diagnostics: [{ code: 'MAP_RESOURCE_LIMIT' }] });
  expect(mapRegistrationStats()).toMatchObject({ count: 8 });
  expect(mapRegistrationStats().bytes).toBeLessThan(20 * 1024 * 1024);
});

test('valid geometry at 20000 total points passes and one additional point is rejected', () => {
  const ring = (count: number) => {
    const points = Array.from({ length: count - 1 }, (_, i) => [
      5 + Math.cos((2 * Math.PI * i) / (count - 1)),
      5 + Math.sin((2 * Math.PI * i) / (count - 1)),
    ]);
    points.push([...points[0]!]);
    return points;
  };
  const exact = structuredClone(assetInput);
  exact.geoJSON.features[0]!.geometry.coordinates = [ring(19995)];
  expect(createMapAsset(exact).ok).toBe(true);
  exact.geoJSON.features[0]!.geometry.coordinates = [ring(19996)];
  expect(createMapAsset(exact).ok).toBe(false);
});
