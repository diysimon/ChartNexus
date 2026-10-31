import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
const unit = { kind: 'currency', code: 'USD' };
const sample = () => ({
  schemaVersion: '0.2',
  id: 'sales',
  mode: 'intent',
  data: {
    kind: 'inline',
    fields: ['month', 'sales', 'cost'],
    rows: [
      { month: 'Mar', sales: 20, cost: 8 },
      { month: 'Jan', sales: 10, cost: null },
    ],
  },
  chart: {
    type: 'combo',
    title: 'Sales and cost',
    encoding: {
      x: { field: 'month', type: 'ordinal' },
      y: { field: 'sales', type: 'quantitative', unit },
    },
    secondary: { field: 'cost', unit },
    sort: { by: 'category', order: 'ascending', nulls: 'last' },
  },
  presentation: {
    theme: { id: 'dark', version: '1' },
    dataLabels: { show: true },
    legend: { show: true, position: 'top' },
  },
});
function plan(doc: unknown, registry?: Parameters<typeof compileChart>[1]) {
  const result = compileChart(doc, registry);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('single axis bar-line combo', () => {
  test('compiles both measures, common unit, labels, data and source rows', () => {
    const doc = sample(),
      before = structuredClone(doc);
    const result = plan(doc);
    expect(result.option).toMatchObject({
      xAxis: { data: ['Jan', 'Mar'] },
      yAxis: { name: 'sales / cost (USD)' },
      series: [
        {
          id: 'series:combo:bar',
          name: 'sales',
          type: 'bar',
          data: [10, 20],
          label: { show: true },
        },
        {
          id: 'series:combo:line',
          name: 'cost',
          type: 'line',
          data: [null, 8],
          label: { show: true },
        },
      ],
    });
    expect(result.rowIndices).toEqual([
      [1, 0],
      [1, 0],
    ]);
    expect(doc).toEqual(before);
    expect(plan(doc)).toEqual(result);
    expect(renderSvg(doc).ok).toBe(true);
  });
  test('explicit right axis keeps independent units and unchanged values', () => {
    const doc = sample();
    const input = {
      ...doc,
      chart: {
        ...doc.chart,
        secondary: {
          field: 'cost',
          axis: 'right',
          unit: { kind: 'percent', scale: 'ratio' },
        },
      },
    };
    const result = plan(input);
    expect(result.option.yAxis).toMatchObject([
      { name: 'sales (USD)' },
      { name: 'cost (ratio)', position: 'right' },
    ]);
    expect(result.option.series).toMatchObject([
      { type: 'bar', data: [10, 20] },
      { type: 'line', yAxisIndex: 1, data: [null, 8] },
    ]);
    expect(result.rowIndices).toEqual([
      [1, 0],
      [1, 0],
    ]);
    expect(renderSvg(input).ok).toBe(true);
    expect(
      compileChart({
        ...doc,
        chart: { ...doc.chart, secondary: { field: 'cost', axis: 'right' } },
      }).ok,
    ).toBe(false);
    const explicitShared = {
      ...doc,
      chart: {
        ...doc.chart,
        secondary: { ...doc.chart.secondary, axis: 'shared' },
      },
    };
    expect(plan(explicitShared).option).toEqual(plan(doc).option);
  });
  test('reference revisions and input purity', () => {
    const input = sample(),
      table = structuredClone(input.data),
      registry = { data: { revision: 'r1', table } },
      before = structuredClone(registry);
    const doc = {
      ...input,
      data: { kind: 'reference', id: 'data', revision: 'r1' },
    };
    expect(plan(doc, registry).dataRevision).toBe('r1');
    expect(registry).toEqual(before);
    expect(
      compileChart(doc, { data: { revision: 'r2', table } }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'REVISION_CONFLICT' }],
    });
  });
  test('rejects missing, mismatched, ambiguous or unsupported configuration', () => {
    const d = sample();
    for (const chart of [
      { ...d.chart, secondary: { field: 'sales', unit } },
      { ...d.chart, secondary: { field: 'missing', unit } },
      { ...d.chart, secondary: { field: 'cost' } },
      {
        ...d.chart,
        secondary: { field: 'cost', unit: { kind: 'currency', code: 'CNY' } },
      },
      { ...d.chart, aggregate: { op: 'sum' } },
      { ...d.chart, stack: true },
      { ...d.chart, sort: { by: 'value', order: 'ascending', nulls: 'last' } },
      {
        ...d.chart,
        encoding: { ...d.chart.encoding, series: { field: 'month' } },
      },
      { ...d.chart, type: 'line' },
    ])
      expect(compileChart({ ...d, chart }).ok).toBe(false);
    expect(compileChart({ ...d, schemaVersion: '0.1' }).ok).toBe(false);
    const { unit: _a, ...y } = d.chart.encoding.y;
    void _a;
    const noUnits = {
      ...d,
      chart: {
        ...d.chart,
        encoding: { ...d.chart.encoding, y },
        secondary: { field: 'cost' },
      },
    };
    expect(plan(noUnits).option.yAxis).toMatchObject({ name: 'sales / cost' });
  });
});
