import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
const make = () => ({
  schemaVersion: '0.2',
  id: 'heat',
  mode: 'intent',
  data: {
    kind: 'inline',
    fields: ['day', 'region', 'orders'],
    rows: [
      { day: 'Mon', region: 'East', orders: 4 },
      { day: 'Tue', region: 'West', orders: null },
      { day: 'Tue', region: 'East', orders: 0 },
      { day: 'Mon', region: 'West', orders: 10 },
    ],
  },
  chart: {
    type: 'heatmap',
    title: 'Orders',
    encoding: {
      x: { field: 'day', type: 'ordinal' },
      y: { field: 'region', type: 'ordinal' },
    },
    heatmap: { field: 'orders', min: 0, max: 10 },
  },
  presentation: { theme: { id: 'dark', version: '1' } },
});
function plan(input: unknown, registry?: Parameters<typeof compileChart>[1]) {
  const result = compileChart(input, registry);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('categorical heatmap', () => {
  test('preserves sparse cells, zero, row identities, ranges and source', () => {
    const input = make(),
      before = structuredClone(input),
      result = plan(input);
    expect(result.option).toMatchObject({
      backgroundColor: '#111827',
      xAxis: { type: 'category', data: ['Mon', 'Tue'] },
      yAxis: { type: 'category', data: ['East', 'West'] },
      visualMap: { min: 0, max: 10 },
      series: [
        {
          type: 'heatmap',
          data: [
            [0, 0, 4],
            [1, 0, 0],
            [0, 1, 10],
          ],
        },
      ],
    });
    expect(result.rowIndices).toEqual([[0, 2, 3]]);
    expect(input).toEqual(before);
    expect(plan(input)).toEqual(result);
    const svg = renderSvg(input);
    expect(svg.ok).toBe(true);
    if (svg.ok) expect(svg.value).toContain('<svg');
  });
  test('preserves reference revision and rejects stale/missing references', () => {
    const input = make(),
      table = structuredClone(input.data),
      registry = { sales: { revision: 'r1', table } },
      before = structuredClone(registry);
    const doc = {
      ...input,
      data: { kind: 'reference', id: 'sales', revision: 'r1' },
    };
    expect(plan(doc, registry).dataRevision).toBe('r1');
    expect(registry).toEqual(before);
    expect(
      compileChart(doc, { sales: { revision: 'r2', table } }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'REVISION_CONFLICT' }],
    });
    expect(compileChart(doc)).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'DATA_NOT_FOUND' }],
    });
  });
  test('rejects ambiguous cells, invalid fields and ranges', () => {
    const doc = make();
    const invalid = [
      {
        ...doc,
        data: {
          ...doc.data,
          rows: [...doc.data.rows, { day: 'Tue', region: 'West', orders: 5 }],
        },
      },
      {
        ...doc,
        data: {
          ...doc.data,
          rows: [{ day: 'Mon', region: 'East', orders: 11 }],
        },
      },
      {
        ...doc,
        data: {
          ...doc.data,
          rows: [{ day: 'Mon', region: 'East', orders: '2' }],
        },
      },
      {
        ...doc,
        chart: { ...doc.chart, heatmap: { field: 'missing', min: 0, max: 10 } },
      },
      {
        ...doc,
        chart: { ...doc.chart, heatmap: { field: 'orders', min: 10, max: 10 } },
      },
      {
        ...doc,
        chart: {
          ...doc.chart,
          heatmap: { field: 'orders', min: -1e308, max: 1e308 },
        },
      },
      {
        ...doc,
        chart: { ...doc.chart, heatmap: { field: 'day', min: 0, max: 10 } },
      },
      { ...doc, presentation: { legend: { show: true } } },
      {
        ...doc,
        chart: {
          ...doc.chart,
          sort: { by: 'category', order: 'ascending', nulls: 'last' },
        },
      },
      { ...doc, schemaVersion: '0.1' },
    ];
    for (const item of invalid) expect(compileChart(item).ok).toBe(false);
  });
  test('handles empty data and all-null without inventing cells', () => {
    const doc = make();
    const empty = plan({ ...doc, data: { ...doc.data, rows: [] } });
    expect(empty.option.series).toMatchObject([{ type: 'heatmap', data: [] }]);
    const nulls = plan({
      ...doc,
      data: { ...doc.data, rows: [{ day: 'X', region: 'Y', orders: null }] },
    });
    expect(nulls.option).toMatchObject({
      xAxis: { data: ['X'] },
      yAxis: { data: ['Y'] },
      series: [{ data: [] }],
    });
    expect(nulls.rowIndices).toEqual([[]]);
  });
});
