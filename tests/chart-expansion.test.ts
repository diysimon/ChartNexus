import { test, expect } from 'vitest';
import {
  compileChart,
  compileChatChart,
  validateChart03,
} from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import { createAgentService } from '@chartnexus/agent';
import { createMapAsset, mapCatalog } from '@chartnexus/echarts';
import radar from '../resources/recipes/radar-03.json';
import tree from '../resources/recipes/tree-03.json';
import sankey from '../resources/recipes/sankey-03.json';
import map from '../resources/recipes/map-03.json';
import assetInput from '../examples/maps/two-regions.json';
const prepared = createMapAsset(assetInput);
if (!prepared.ok) throw new Error('Invalid fixture');
const maps = { [prepared.value.id]: prepared.value },
  catalog = mapCatalog(maps);
const fixtures = { radar, tree, sankey, map };
const levels = [
  'minimal',
  'simple',
  'standard',
  'detailed',
  'comprehensive',
] as const;
function invalid(doc: unknown, code?: string) {
  const result = compileChart(doc, {}, catalog);
  expect(result.ok).toBe(false);
  if (!result.ok && code) expect(result.diagnostics[0]?.code).toBe(code);
}
for (const [type, doc] of Object.entries(fixtures))
  test(`${type}: full/projection, source fidelity, two themes/five levels and SVG`, () => {
    expect(validateChart03(doc, type).ok).toBe(true);
    const before = JSON.stringify(doc);
    const result = compileChart(doc, {}, catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.profile).toBe('basic-0.3');
    expect(result.value.accessibility).toBeDefined();
    for (const theme of ['light', 'dark'] as const)
      for (const detailLevel of levels) {
        const chat = compileChatChart(
          doc,
          { theme, detailLevel, width: 800, height: 480 },
          {},
          catalog,
        );
        expect(chat.ok).toBe(true);
        const svg = renderSvg(doc, {
          width: 800,
          height: 480,
          maps,
          chatPresentation: { theme, detailLevel },
        });
        expect(svg.ok).toBe(true);
        if (svg.ok) {
          expect(svg.value).toContain('<svg');
          expect(svg.value).toContain('chartnexus-data');
          expect(svg.value).not.toMatch(/(?:NaN|Infinity)/);
        }
      }
    expect(JSON.stringify(doc)).toBe(before);
  });
test('radar rejects misleading values/ranges/identity and preserves explicit units', () => {
  for (const value of [null, -1, 101, '50']) {
    const doc = structuredClone(radar);
    Object.assign(doc.data.rows[0]!, { speed: value });
    invalid(doc, 'INVALID_RADAR');
  }
  for (const fields of [
    { min: 100, max: 100 },
    { min: 100, max: 0 },
    { field: 'quality' },
  ]) {
    const doc = structuredClone(radar);
    Object.assign(doc.chart.indicators[0]!, fields);
    invalid(doc, 'INVALID_RADAR');
  }
  const duplicate = structuredClone(radar);
  duplicate.data.rows[1]!.team = 'Alpha';
  invalid(duplicate, 'INVALID_RADAR');
  const empty = structuredClone(radar);
  empty.data.rows = [];
  invalid(empty, 'INVALID_RADAR');
  const tooMany = structuredClone(radar);
  tooMany.data.rows = Array.from({ length: 7 }, (_, i) => ({
    ...radar.data.rows[0]!,
    team: String(i),
  }));
  invalid(tooMany);
  const result = compileChart(radar);
  if (!result.ok) throw new Error('compile');
  expect(result.value.accessibility!.summary).toContain('points');
  expect(result.value.rowIndices).toEqual([[0, 1]]);
});
test('tree topology validates every node, duplicates labels are safe and reordered IDs stable', () => {
  for (const mutation of ['orphan', 'self', 'cycle', 'roots', 'duplicate']) {
    const doc = structuredClone(tree);
    if (mutation === 'orphan') doc.data.rows[1]!.parent = 'absent';
    if (mutation === 'self') doc.data.rows[1]!.parent = 'a';
    if (mutation === 'cycle') {
      doc.data.rows[1]!.parent = 'b';
      doc.data.rows[2]!.parent = 'a';
    }
    if (mutation === 'roots') doc.data.rows[1]!.parent = null;
    if (mutation === 'duplicate') doc.data.rows[1]!.id = 'root';
    invalid(doc, 'INVALID_TREE');
  }
  const deep = structuredClone(tree);
  deep.data.rows = Array.from({ length: 18 }, (_, i) => ({
    id: String(i),
    parent: i === 0 ? null : String(i - 1),
    label: 'same',
  }));
  invalid(deep, 'INVALID_TREE');
  deep.data.rows.pop();
  expect(compileChart(deep).ok).toBe(true);
  const doc = structuredClone(tree);
  doc.data.rows.forEach((r) => (r.label = 'Same label'));
  const a = compileChart(doc);
  doc.data.rows.reverse();
  const b = compileChart(doc);
  expect(a.ok && b.ok).toBe(true);
  if (a.ok && b.ok) {
    expect(a.value.treeState!.topologyKey).toBe(b.value.treeState!.topologyKey);
    expect(Object.keys(a.value.markIdentities!).sort()).toEqual(
      Object.keys(b.value.markIdentities!).sort(),
    );
    expect(a.value.accessibility!.rows).toHaveLength(6);
  }
});
test('sankey rejects cycles including zero edges, duplicate pairs, endpoints and invalid weights', () => {
  for (const value of [-1, null, '3']) {
    const doc = structuredClone(sankey);
    Object.assign(doc.data.links.rows[0]!, { weight: value });
    invalid(doc, 'INVALID_SANKEY');
  }
  for (const to of ['input', 'missing']) {
    const doc = structuredClone(sankey);
    doc.data.links.rows[0]!.to = to;
    invalid(doc, 'INVALID_SANKEY');
  }
  const cycle = structuredClone(sankey);
  cycle.data.links.rows.push({ from: 'output', to: 'input', weight: 0 });
  invalid(cycle, 'INVALID_SANKEY');
  const duplicate = structuredClone(sankey);
  duplicate.data.links.rows.push({ ...duplicate.data.links.rows[0]! });
  invalid(duplicate, 'INVALID_SANKEY');
  const labels = structuredClone(sankey);
  labels.data.nodes.rows.forEach((r) => (r.label = 'Same'));
  const result = compileChart(labels);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(
      result.value.flowBalance!.find((n) => n.nodeId === 'work'),
    ).toMatchObject({ incoming: 12, outgoing: 9, difference: 3 });
    expect(result.value.accessibility!.tables![0]!.rows).toHaveLength(3);
    expect(result.value.accessibility!.rendered!.rows.at(-1)).toEqual([
      'input',
      'zero',
      0,
      false,
    ]);
  }
  const zeros = structuredClone(sankey);
  zeros.data.links.rows.forEach((r) => (r.weight = 0));
  const svg = renderSvg(zeros);
  expect(svg.ok).toBe(true);
  if (svg.ok) expect(svg.value).not.toContain('NaN');
});
test('graph references resolve atomically and enforce combined source budgets', () => {
  const doc = {
    ...sankey,
    data: {
      kind: 'graph',
      nodes: { kind: 'reference', id: 'nodes', revision: 'n1' },
      links: { kind: 'reference', id: 'links', revision: 'l1' },
    },
  };
  const registry = {
    nodes: { revision: 'n1', table: sankey.data.nodes },
    links: { revision: 'wrong', table: sankey.data.links },
  };
  expect(compileChart(doc, registry)).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'REVISION_CONFLICT' }],
  });
  registry.links.revision = 'l1';
  const plan = compileChart(doc, registry);
  expect(plan.ok).toBe(true);
  if (plan.ok) expect(plan.value.dataRevision).toBe('["n1","l1"]');
});
test('map distinguishes zero, null and absent and rejects unknown/duplicate/out-of-domain values', () => {
  expect(compileChart(map)).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'MAP_NOT_FOUND' }],
  });
  for (const key of ['missing', 'West']) {
    const doc = structuredClone(map);
    doc.data.rows[1]!.region = key;
    invalid(doc, 'INVALID_MAP_DATA');
  }
  const outside = structuredClone(map);
  outside.data.rows[0]!.value = 101;
  invalid(outside, 'INVALID_MAP_DATA');
  const doc = structuredClone(map);
  Object.assign(doc.data.rows[0]!, { value: null });
  doc.data.rows.pop();
  const result = compileChart(doc, {}, catalog);
  expect(result.ok).toBe(true);
  if (result.ok)
    expect(result.value.accessibility!.rendered!.rows).toEqual([
      ['West', null, 'provided'],
      ['East', null, 'absent'],
    ]);
  const revision = {
    ...map,
    chart: { ...map.chart, mapRef: { id: 'two-regions', revision: 'wrong' } },
  };
  invalid(revision, 'MAP_REVISION_CONFLICT');
});
test('Agent discovers metadata only and renders map in bounded worker with the host snapshot', async () => {
  const service = createAgentService({ maps, timeoutMs: 10000 });
  const caps = await service.execute('list_capabilities');
  expect(caps.ok).toBe(true);
  if (caps.ok) {
    expect(JSON.stringify(caps.value)).toContain(prepared.value.hash);
    expect(JSON.stringify(caps.value)).not.toContain('coordinates');
  }
  for (const document of Object.values(fixtures)) {
    expect((await service.execute('compile_chart', { document })).ok).toBe(
      true,
    );
    const output = await service.execute('render_chart', {
      document,
      chatPresentation: {},
    });
    expect(output.ok).toBe(true);
    if (output.ok)
      expect(JSON.stringify(output.value)).toContain('chartnexus-data');
  }
  const bad = createAgentService({
    maps: {
      ...maps,
      'two-regions': { ...prepared.value, hash: '0'.repeat(64) },
    },
  });
  expect(await bad.execute('render_chart', { document: map })).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'MAP_HASH_MISMATCH' }],
  });
}, 20000);

test('Sankey renderer preserves literal label markers and never exposes internal identity labels', () => {
  const doc = structuredClone(sankey);
  doc.data.nodes.rows[0]!.label = 'Raw {@[0]} {b}';
  const svg = renderSvg(doc, { chatPresentation: {} });
  expect(svg.ok).toBe(true);
  if (svg.ok) {
    const visible = svg.value
      .replace(/<metadata[\s\S]*?<\/metadata>/g, '')
      .replace(/<title>[\s\S]*?<\/title>/g, '');
    expect(visible).toContain('Raw {@[0]} {b}');
    expect(visible).not.toContain('[&quot;node&quot;');
  }
});

test('diagram dimensions and maximum tree data use explicit fallback without dropping rows', () => {
  for (const doc of Object.values(fixtures))
    for (const width of [240, 320, 480, 768])
      for (const height of [240, 320, 480]) {
        const result = compileChatChart(doc, { width, height }, {}, catalog);
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        const svg = compileChatChart(
          doc,
          { width, height, target: 'svg' },
          {},
          catalog,
        );
        expect(svg.ok).toBe(
          !result.value.plan.notices?.some((n) => n.code === 'LAYOUT_FALLBACK'),
        );
      }
  const doc = structuredClone(tree);
  doc.data.rows = Array.from({ length: 1000 }, (_, i) => ({
    id: String(i),
    parent: i === 0 ? null : '0',
    label: 'Node ' + i,
  }));
  const plan = compileChatChart(doc, { width: 768, height: 480 });
  expect(plan.ok).toBe(true);
  if (plan.ok) {
    expect(
      plan.value.plan.notices?.some((n) => n.code === 'LAYOUT_FALLBACK'),
    ).toBe(true);
    expect(plan.value.plan.accessibility!.rows).toHaveLength(1000);
  }
});
test('radar row keys follow reordered source data and graph table limits apply to references', () => {
  const doc = {
    ...radar,
    data: {
      ...radar.data,
      keyField: 'team',
      rows: [...radar.data.rows].reverse(),
    },
  };
  const plan = compileChart(doc);
  expect(plan.ok).toBe(true);
  if (plan.ok) expect(plan.value.rowKeys).toEqual([['Beta', 'Alpha']]);
  const graph = {
    ...sankey,
    data: {
      ...sankey.data,
      nodes: { kind: 'reference', id: 'many', revision: '1' },
    },
  };
  const nodes = {
    fields: ['id', 'label'],
    rows: Array.from({ length: 201 }, (_, i) => ({
      id: String(i),
      label: 'Node',
    })),
  };
  expect(
    compileChart(graph, { many: { revision: '1', table: nodes } }),
  ).toMatchObject({ ok: false, diagnostics: [{ code: 'INVALID_SANKEY' }] });
});

test('new chart branches reject irrelevant legend and graph data-label controls', () => {
  for (const doc of Object.values(fixtures))
    expect(
      validateChart03({ ...doc, presentation: { legend: { show: false } } }).ok,
    ).toBe(false);
  for (const doc of [tree, sankey])
    expect(
      validateChart03({ ...doc, presentation: { dataLabels: { show: false } } })
        .ok,
    ).toBe(false);
  const result = compileChart(
    { ...map, presentation: { dataLabels: { show: true } } },
    {},
    catalog,
  );
  expect(result.ok).toBe(true);
  if (result.ok)
    expect(result.value.option.series).toMatchObject([
      { label: { show: true } },
    ]);
});
