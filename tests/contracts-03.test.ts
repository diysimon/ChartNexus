import { expect, test } from 'vitest';
import {
  compileChart,
  validateChart03,
  migrateIntentTo03,
  capabilities03,
} from '@chartnexus/core';
import { createAgentService } from '@chartnexus/agent';
import baseline from './fixtures/m0-semantics.json';
import {
  chartDocument03Schema,
  projectChartSchema03,
} from '@chartnexus/schema';

for (const entry of baseline)
  test(`M0 golden ${entry.id} and explicit migration`, () => {
    expect(compileChart(entry.input)).toEqual(entry.expected);
    const migrated = migrateIntentTo03(entry.input);
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) return;
    const compiled = compileChart(migrated.value);
    expect(compiled.ok).toBe(true);
    if (compiled.ok && entry.expected.ok) {
      expect(compiled.value.option).toEqual(entry.expected.value.option);
      expect(compiled.value.rowIndices).toEqual(
        entry.expected.value.rowIndices,
      );
    }
    expect(validateChart03(migrated.value, entry.input.chart.type).ok).toBe(
      true,
    );
    expect(
      validateChart03({
        ...migrated.value,
        chart: { ...migrated.value.chart, unsupported: true },
      }).ok,
    ).toBe(false);
    expect(
      validateChart03(
        {
          ...migrated.value,
          chart: { ...migrated.value.chart, unsupported: true },
        },
        entry.input.chart.type,
      ).ok,
    ).toBe(false);
  });
const ref = (field: string) => ({ field });
const reserved = [
  {
    type: 'radar',
    encoding: { item: ref('name') },
    indicators: ['a', 'b', 'c'].map((field) => ({
      field,
      label: field,
      min: 0,
      max: 10,
    })),
  },
  {
    type: 'tree',
    encoding: { id: ref('id'), parentId: ref('parent'), label: ref('name') },
  },
  {
    type: 'sankey',
    encoding: {
      nodeId: ref('id'),
      nodeLabel: ref('name'),
      source: ref('from'),
      target: ref('to'),
      value: ref('value'),
    },
  },
  {
    type: 'map',
    encoding: { region: ref('region'), value: ref('value') },
    mapRef: { id: 'local', revision: '1' },
    colorDomain: { min: 0, max: 10 },
  },
];
for (const chart of reserved)
  test(`${chart.type} schema validity does not imply semantic validity`, () => {
    const table = { kind: 'inline', fields: ['name'], rows: [] };
    const doc = {
      schemaVersion: '0.3',
      id: 'reserved',
      mode: 'intent',
      chart,
      data:
        chart.type === 'sankey'
          ? { kind: 'graph', nodes: table, links: table }
          : table,
    };
    expect(validateChart03(doc).ok).toBe(true);
    expect(validateChart03(doc, chart.type).ok).toBe(true);
    expect(validateChart03({ ...doc, chart: { type: chart.type } }).ok).toBe(
      false,
    );
    expect(
      validateChart03({ ...doc, chart: { type: chart.type } }, chart.type).ok,
    ).toBe(false);
    expect(compileChart(doc)).toMatchObject({
      ok: false,
      diagnostics: [
        { code: chart.type === 'map' ? 'MAP_NOT_FOUND' : 'UNKNOWN_FIELD' },
      ],
    });
    expect(capabilities03.charts).toContain(chart.type);
  });
test('eleven exact projections, heatmap requirement, versioned discovery', async () => {
  expect(chartDocument03Schema.oneOf).toHaveLength(11);
  for (const branch of chartDocument03Schema.oneOf)
    expect(
      projectChartSchema03(branch.properties.chart.properties.type.const),
    ).toMatchObject(branch);
  const heat = baseline.find((item) => item.id === 'heatmap')!;
  const doc = {
    ...heat.input,
    schemaVersion: '0.3',
    chart: { type: 'heatmap', encoding: heat.input.chart.encoding },
  };
  expect(validateChart03(doc)).toMatchObject({
    ok: false,
    diagnostics: expect.arrayContaining([
      expect.objectContaining({ path: '/chart/heatmap' }),
    ]),
  });
  const service = createAgentService();
  expect(
    await service.execute('get_chart_schema', {
      schemaVersion: '0.3',
      chartType: 'bar',
    }),
  ).toEqual({ ok: true, value: projectChartSchema03('bar') });
  expect(
    (
      await service.execute('get_chart_schema', {
        schemaVersion: '0.2',
        chartType: 'bar',
      })
    ).ok,
  ).toBe(false);
});
test('stable row keys validate uniqueness and preserve identity through sort', () => {
  const entry = baseline.find((item) => item.id === 'chat-bar')!.input;
  const doc = {
    ...entry,
    schemaVersion: '0.3',
    data: { ...entry.data, keyField: 'month' },
    chart: {
      ...entry.chart,
      sort: { by: 'value', order: 'descending', nulls: 'last' },
    },
  };
  const plan = compileChart(doc);
  expect(plan.ok).toBe(true);
  if (plan.ok) expect(plan.value.rowKeys?.[0]).toEqual(['Feb', 'Mar', 'Jan']);
  const duplicate = {
    ...doc,
    data: {
      ...doc.data,
      rows: doc.data.rows.map((row) => ({ ...row, month: 'same' })),
    },
  };
  expect(compileChart(duplicate)).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'INVALID_ROW_KEY' }],
  });
});
