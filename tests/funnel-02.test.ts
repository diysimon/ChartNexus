import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import recipe from '../resources/recipes/bar.json';
const base = () => ({
  ...structuredClone(recipe),
  schemaVersion: '0.2',
  chart: { ...structuredClone(recipe.chart), type: 'funnel' },
});
function plan(input: unknown, registry?: Parameters<typeof compileChart>[1]) {
  const result = compileChart(input, registry);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('explicit funnel', () => {
  test('preserves source order without inventing conversion rates', () => {
    const input = base(),
      before = structuredClone(input),
      result = plan(input);
    expect(result.option.series).toMatchObject([
      {
        type: 'funnel',
        sort: 'none',
        data: [
          { name: 'Jan', value: 120 },
          { name: 'Feb', value: 180 },
          { name: 'Mar', value: 150 },
        ],
      },
    ]);
    expect(result.rowIndices).toEqual([[0, 1, 2]]);
    expect(input).toEqual(before);
    expect(renderSvg(input).ok).toBe(true);
  });
  test('sorts or explicitly aggregates with provenance', () => {
    const doc = base();
    const input = {
      ...doc,
      data: {
        ...doc.data,
        rows: [
          { month: 'B', revenue: 2 },
          { month: 'A', revenue: 1 },
          { month: 'B', revenue: 3 },
        ],
      },
      chart: {
        ...doc.chart,
        aggregate: { op: 'sum' },
        sort: { by: 'value', order: 'descending', nulls: 'last' },
      },
      presentation: {
        dataLabels: { show: true },
        theme: { id: 'dark', version: '1' },
      },
    };
    const result = plan(input);
    expect(result.option.series).toMatchObject([
      {
        type: 'funnel',
        sort: 'none',
        data: [
          { name: 'B', value: 5 },
          { name: 'A', value: 1 },
        ],
        label: { show: true },
      },
    ]);
    expect(result.aggregatePoints?.[0]?.map((v) => v?.sourceCount)).toEqual([
      2, 1,
    ]);
    expect(result.rowIndices).toEqual([[-1, -1]]);
    expect(renderSvg(input).ok).toBe(true);
  });
  test('preserves reference revisions and rejects invalid data and variants', () => {
    const doc = base(),
      table = structuredClone(doc.data),
      input = { ...doc, data: { kind: 'reference', id: 'd', revision: 'r1' } };
    expect(plan(input, { d: { revision: 'r1', table } }).dataRevision).toBe(
      'r1',
    );
    expect(compileChart(input, { d: { revision: 'r2', table } }).ok).toBe(
      false,
    );
    for (const value of [-1, null, '2'])
      expect(
        compileChart({
          ...doc,
          data: { ...doc.data, rows: [{ month: 'A', revenue: value }] },
        }).ok,
      ).toBe(false);
    expect(
      plan({
        ...doc,
        data: { ...doc.data, rows: [{ month: 'A', revenue: 0 }] },
      }).option.series,
    ).toMatchObject([{ data: [{ value: 0 }] }]);
    expect(
      compileChart({ ...doc, chart: { ...doc.chart, donut: true } }).ok,
    ).toBe(false);
    expect(compileChart({ ...doc, schemaVersion: '0.1' }).ok).toBe(false);
  });
});
