import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import recipe from '../resources/recipes/bar.json';

const sort = (
  by: 'category' | 'value',
  order: 'ascending' | 'descending',
  nulls: 'first' | 'last' = 'last',
) => ({ by, order, nulls });
const base = () => ({ ...structuredClone(recipe), schemaVersion: '0.2' });
function plan(input: unknown, registry?: Parameters<typeof compileChart>[1]) {
  const result = compileChart(input, registry);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('0.2 explicit sorting', () => {
  test('sorts numbers stably and handles null independently of direction', () => {
    const doc = base();
    doc.data.rows = [
      { month: 'B', revenue: 2 },
      { month: 'A', revenue: 1 },
      { month: 'D', revenue: 2 },
      { month: 'C', revenue: null as unknown as number },
    ];
    const original = structuredClone(doc);
    for (const [order, nulls, expected, indices] of [
      ['ascending', 'last', ['A', 'B', 'D', 'C'], [1, 0, 2, 3]],
      ['descending', 'first', ['C', 'B', 'D', 'A'], [3, 0, 2, 1]],
    ] as const) {
      const result = plan({
        ...doc,
        chart: { ...doc.chart, sort: sort('value', order, nulls) },
      });
      expect(result.option.xAxis).toMatchObject({ data: expected });
      expect(result.rowIndices).toEqual([indices]);
    }
    expect(doc).toEqual(original);
  });
  test('sorts grouped categories consistently and retains original row indices in references', () => {
    const doc = base();
    const rows = [
      { month: 'B', revenue: 2, region: 'East' },
      { month: 'A', revenue: 3, region: 'West' },
      { month: 'A', revenue: 4, region: 'East' },
    ];
    const table = { fields: ['month', 'revenue', 'region'], rows };
    const input = {
      ...doc,
      data: { kind: 'reference', id: 'sales', revision: 'r1' },
      chart: {
        ...doc.chart,
        orientation: 'horizontal',
        encoding: { ...doc.chart.encoding, series: { field: 'region' } },
        sort: sort('category', 'ascending'),
      },
    };
    const registry = { sales: { revision: 'r1', table } };
    const before = structuredClone(registry);
    const result = plan(input, registry);
    expect(result.option.yAxis).toMatchObject({ data: ['A', 'B'] });
    expect(result.option.series).toMatchObject([
      { name: 'East', data: [4, 2] },
      { name: 'West', data: [3, null] },
    ]);
    expect(result.rowIndices).toEqual([
      [2, 0],
      [1, -1],
    ]);
    expect(result.dataRevision).toBe('r1');
    expect(registry).toEqual(before);
    expect(plan(input, registry)).toEqual(result);
    expect(renderSvg(input, { registry }).ok).toBe(true);
    expect(
      compileChart(
        {
          ...input,
          chart: { ...input.chart, sort: sort('value', 'ascending') },
        },
        registry,
      ),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'UNSUPPORTED_CAPABILITY' }],
    });
  });
  test('category ordering uses code units rather than locale and works for empty data', () => {
    const doc = base();
    doc.data.rows = [
      { month: '中', revenue: 1 },
      { month: 'a', revenue: 2 },
      { month: 'Z', revenue: 3 },
    ];
    const sorted = {
      ...doc,
      chart: { ...doc.chart, sort: sort('category', 'ascending') },
    };
    expect(plan(sorted).option.xAxis).toMatchObject({ data: ['Z', 'a', '中'] });
    expect(plan(sorted).rowIndices).toEqual([[2, 1, 0]]);
    expect(
      plan({ ...sorted, data: { ...doc.data, rows: [] } }).rowIndices,
    ).toEqual([]);
  });
  test('sorts pie values and rejects scatter sort or invalid sort fields', () => {
    const doc = base();
    const pie = {
      ...doc,
      chart: { ...doc.chart, type: 'pie', sort: sort('value', 'descending') },
    };
    expect(plan(pie).option.series).toMatchObject([
      {
        data: [
          { name: 'Feb', value: 180 },
          { name: 'Mar', value: 150 },
          { name: 'Jan', value: 120 },
        ],
      },
    ]);
    expect(plan(pie).rowIndices).toEqual([[1, 2, 0]]);
    expect(renderSvg(pie).ok).toBe(true);
    expect(
      compileChart({
        ...doc,
        data: { ...doc.data, rows: [{ month: 1, revenue: 2 }] },
        chart: {
          ...doc.chart,
          type: 'scatter',
          encoding: {
            ...doc.chart.encoding,
            x: { field: 'month', type: 'quantitative' },
          },
          sort: sort('category', 'ascending'),
        },
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'UNSUPPORTED_CAPABILITY' }],
    });
    expect(
      compileChart({
        ...doc,
        chart: {
          ...doc.chart,
          sort: { by: 'missing', order: 'ascending', nulls: 'last' },
        },
      }).ok,
    ).toBe(false);
    expect(
      compileChart({
        ...doc,
        schemaVersion: '0.1',
        chart: { ...doc.chart, sort: sort('category', 'ascending') },
      }).ok,
    ).toBe(false);
  });
});
