import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import recipe from '../resources/recipes/bar.json';
const make = (op: 'sum' | 'mean' | 'count') => ({
  ...structuredClone(recipe),
  schemaVersion: '0.2',
  data: {
    kind: 'inline',
    fields: ['month', 'revenue'],
    rows: [
      { month: 'B', revenue: 2 },
      { month: 'A', revenue: null },
      { month: 'B', revenue: 4 },
      { month: 'C', revenue: 0 },
    ],
  },
  chart: { ...recipe.chart, aggregate: { op } },
});
function plan(doc: unknown, registry?: Parameters<typeof compileChart>[1]) {
  const r = compileChart(doc, registry);
  if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
  return r.value;
}
describe('explicit 0.2 aggregation', () => {
  test.each([
    ['sum', [6, null, 0]],
    ['mean', [3, null, 0]],
    ['count', [2, 0, 1]],
  ] as const)(
    '%s preserves null semantics and describes aggregate identity',
    (op, values) => {
      const doc = make(op);
      const before = structuredClone(doc);
      const result = plan(doc);
      expect(result.option.xAxis).toMatchObject({ data: ['B', 'A', 'C'] });
      expect(result.option.series).toMatchObject([{ data: values }]);
      expect(result.rowIndices).toEqual([[-1, -1, -1]]);
      expect(result.aggregatePoints).toEqual([
        [
          {
            operation: op,
            category: 'B',
            series: null,
            sourceCount: 2,
            nonNullCount: 2,
          },
          {
            operation: op,
            category: 'A',
            series: null,
            sourceCount: 1,
            nonNullCount: 0,
          },
          {
            operation: op,
            category: 'C',
            series: null,
            sourceCount: 1,
            nonNullCount: 1,
          },
        ],
      ]);
      expect(doc).toEqual(before);
      expect(plan(doc)).toEqual(result);
      expect(renderSvg(doc).ok).toBe(true);
    },
  );
  test('grouped sorted temporal reference preserves gaps and aligned provenance', () => {
    const doc = make('sum');
    const table = {
      fields: ['day', 'value', 'region'],
      rows: [
        { day: '2024-03-01', value: 2, region: 'A' },
        { day: '2024-02-29', value: 3, region: 'B' },
        { day: '2024-03-01', value: 5, region: 'A' },
      ],
    };
    const registry = { data: { revision: 'r1', table } };
    const before = structuredClone(registry);
    const input = {
      ...doc,
      data: { kind: 'reference', id: 'data', revision: 'r1' },
      chart: {
        type: 'line',
        aggregate: { op: 'sum' },
        sort: { by: 'category', order: 'ascending', nulls: 'last' },
        encoding: {
          x: { field: 'day', type: 'temporal', temporalKind: 'date' },
          y: { field: 'value', type: 'quantitative' },
          series: { field: 'region' },
        },
      },
    };
    const result = plan(input, registry);
    const feb = Date.UTC(2024, 1, 29),
      mar = Date.UTC(2024, 2, 1);
    expect(result.option.series).toMatchObject([
      {
        data: [
          [feb, null],
          [mar, 7],
        ],
      },
      {
        data: [
          [feb, 3],
          [mar, null],
        ],
      },
    ]);
    expect(result.aggregatePoints).toEqual([
      [
        null,
        {
          operation: 'sum',
          category: '2024-03-01',
          series: 'A',
          sourceCount: 2,
          nonNullCount: 2,
        },
      ],
      [
        {
          operation: 'sum',
          category: '2024-02-29',
          series: 'B',
          sourceCount: 1,
          nonNullCount: 1,
        },
        null,
      ],
    ]);
    expect(result.dataRevision).toBe('r1');
    expect(registry).toEqual(before);
    expect(renderSvg(input, { registry }).ok).toBe(true);
    expect(
      compileChart(input, { data: { revision: 'old', table } }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'REVISION_CONFLICT' }],
    });
  });
  test('ungrouped value sorting retains correct provenance; pie works', () => {
    const doc = make('sum');
    const sorted = {
      ...doc,
      data: {
        ...doc.data,
        rows: doc.data.rows.filter((row) => row.revenue !== null),
      },
      chart: {
        ...doc.chart,
        type: 'pie',
        donut: true,
        sort: { by: 'value', order: 'ascending', nulls: 'last' },
      },
    };
    const result = plan(sorted);
    expect(result.option.series).toMatchObject([
      {
        data: [
          { name: 'C', value: 0 },
          { name: 'B', value: 6 },
        ],
      },
    ]);
    expect(result.aggregatePoints?.[0]?.map((x) => x?.category)).toEqual([
      'C',
      'B',
    ]);
  });
  test('rejects unsafe or ambiguous operations and preserves 0.1 defaults', () => {
    const doc = make('sum');
    expect(compileChart({ ...doc, schemaVersion: '0.1' }).ok).toBe(false);
    expect(
      compileChart({ ...doc, chart: { ...doc.chart, type: 'scatter' } }).ok,
    ).toBe(false);
    const count = make('count');
    expect(
      compileChart({
        ...count,
        chart: {
          ...count.chart,
          encoding: {
            ...count.chart.encoding,
            y: {
              ...count.chart.encoding.y,
              unit: { kind: 'unit', label: 'kg' },
            },
          },
        },
      }).ok,
    ).toBe(false);
    const overflow = {
      ...doc,
      data: {
        ...doc.data,
        rows: [
          { month: 'A', revenue: 1e308 },
          { month: 'A', revenue: 1e308 },
        ],
      },
    };
    expect(compileChart(overflow)).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'INVALID_DATA' }],
    });
    expect(compileChart({ ...doc, chart: recipe.chart })).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'AMBIGUOUS_DATA' }],
    });
    expect(
      compileChart({
        ...doc,
        chart: { ...doc.chart, aggregate: { op: 'median' } },
      }).ok,
    ).toBe(false);
  });
});
