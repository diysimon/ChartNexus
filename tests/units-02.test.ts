import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import recipe from '../resources/recipes/bar.json';
const base = () => ({ ...structuredClone(recipe), schemaVersion: '0.2' });
const withUnit = (unit: unknown) => {
  const doc = base();
  return {
    ...doc,
    chart: {
      ...doc.chart,
      encoding: { ...doc.chart.encoding, y: { ...doc.chart.encoding.y, unit } },
    },
  };
};
function plan(value: unknown, registry?: Parameters<typeof compileChart>[1]) {
  const result = compileChart(value, registry);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('explicit 0.2 quantity units', () => {
  test.each([
    [{ kind: 'currency', code: 'USD' }, 'revenue (USD)'],
    [{ kind: 'percent', scale: 'percent' }, 'revenue (%)'],
    [{ kind: 'percent', scale: 'ratio' }, 'revenue (ratio)'],
    [{ kind: 'unit', label: 'kg' }, 'revenue (kg)'],
  ])('annotates axis without converting data: %j', (unit, label) => {
    const input = withUnit(unit);
    const snapshot = structuredClone(input);
    const result = plan(input);
    expect(result.option.yAxis).toMatchObject({ name: label });
    expect(result.option.series).toMatchObject([{ data: [120, 180, 150] }]);
    expect(input).toEqual(snapshot);
    expect(renderSvg(input).ok).toBe(true);
  });
  test('horizontal, sorted and themed references preserve values and identity', () => {
    const doc = withUnit({ kind: 'currency', code: 'CNY' });
    const data = structuredClone(doc.data);
    const registry = { sales: { revision: 'r1', table: data } };
    const before = structuredClone(registry);
    const input = {
      ...doc,
      data: { kind: 'reference', id: 'sales', revision: 'r1' },
      chart: {
        ...doc.chart,
        orientation: 'horizontal',
        sort: { by: 'value', order: 'descending', nulls: 'last' },
      },
      presentation: { theme: { id: 'dark', version: '1' } },
    };
    const result = plan(input, registry);
    expect(result.option.xAxis).toMatchObject({ name: 'revenue (CNY)' });
    expect(result.option.series).toMatchObject([{ data: [180, 150, 120] }]);
    expect(result.rowIndices).toEqual([[1, 2, 0]]);
    expect(registry).toEqual(before);
  });
  test('line and scatter preserve values and pie/invalid units are rejected', () => {
    const doc = withUnit({ kind: 'percent', scale: 'ratio' });
    const line = {
      ...doc,
      data: { ...doc.data, rows: [{ month: 'A', revenue: 0.25 }] },
      chart: { ...doc.chart, type: 'line' },
    };
    expect(plan(line).option.series).toMatchObject([{ data: [0.25] }]);
    const scatter = {
      ...line,
      data: { ...doc.data, rows: [{ month: 1, revenue: 0.25 }] },
      chart: {
        ...line.chart,
        type: 'scatter',
        encoding: {
          ...line.chart.encoding,
          x: { field: 'month', type: 'quantitative' },
        },
      },
    };
    expect(plan(scatter).option.series).toMatchObject([{ data: [[1, 0.25]] }]);
    expect(
      compileChart({ ...doc, chart: { ...doc.chart, type: 'pie' } }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'UNSUPPORTED_CAPABILITY' }],
    });
    for (const unit of [
      { kind: 'percent' },
      { kind: 'currency', code: 'usd' },
      { kind: 'unit', label: '' },
      { kind: 'percent', scale: 'auto' },
    ])
      expect(compileChart(withUnit(unit)).ok).toBe(false);
    expect(compileChart({ ...doc, schemaVersion: '0.1' }).ok).toBe(false);
  });
});
