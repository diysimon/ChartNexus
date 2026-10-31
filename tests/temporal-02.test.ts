import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import recipe from '../resources/recipes/bar.json';
const make = () => ({
  ...structuredClone(recipe),
  schemaVersion: '0.2',
  data: {
    kind: 'inline',
    fields: ['day', 'value'],
    rows: [
      { day: '2024-03-01', value: 2 },
      { day: '2024-02-29', value: null },
    ],
  },
  chart: {
    type: 'line',
    encoding: {
      x: { field: 'day', type: 'temporal', temporalKind: 'date' },
      y: { field: 'value', type: 'quantitative' },
    },
  },
});
function compile(
  input: unknown,
  registry?: Parameters<typeof compileChart>[1],
) {
  const result = compileChart(input, registry);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('0.2 calendar date axis', () => {
  test('renders UTC date coordinates without changing order, null or source', () => {
    const input = make();
    const before = structuredClone(input);
    const result = compile(input);
    expect(result.option).toMatchObject({
      useUTC: true,
      xAxis: { type: 'time' },
      series: [
        {
          data: [
            [Date.UTC(2024, 2, 1), 2],
            [Date.UTC(2024, 1, 29), null],
          ],
        },
      ],
    });
    expect(result.rowIndices).toEqual([[0, 1]]);
    expect(input).toEqual(before);
    expect(renderSvg(input).ok).toBe(true);
    expect(compile(input)).toEqual(result);
  });
  test('sorts grouped dates and preserves source row indexes with reference data', () => {
    const input = make();
    const table = {
      fields: ['day', 'value', 'group'],
      rows: [
        { day: '2024-03-01', value: 2, group: 'A' },
        { day: '2024-02-29', value: 3, group: 'B' },
        { day: '2024-02-29', value: 1, group: 'A' },
      ],
    };
    const registry = { data: { revision: 'r1', table } };
    const before = structuredClone(registry);
    const doc = {
      ...input,
      data: { kind: 'reference', id: 'data', revision: 'r1' },
      chart: {
        ...input.chart,
        encoding: { ...input.chart.encoding, series: { field: 'group' } },
        sort: { by: 'category', order: 'ascending', nulls: 'last' },
      },
    };
    const result = compile(doc, registry);
    const feb = Date.UTC(2024, 1, 29),
      mar = Date.UTC(2024, 2, 1);
    expect(result.option.series).toMatchObject([
      {
        data: [
          [feb, 1],
          [mar, 2],
        ],
      },
      {
        data: [
          [feb, 3],
          [mar, null],
        ],
      },
    ]);
    expect(result.rowIndices).toEqual([
      [2, 0],
      [1, -1],
    ]);
    expect(result.dataRevision).toBe('r1');
    expect(registry).toEqual(before);
    expect(renderSvg(doc, { registry }).ok).toBe(true);
  });
  test.each([
    '2023-02-29',
    '2024-13-01',
    '2024-04-31',
    '2024-1-01',
    '2024-01-01T00:00:00Z',
    '0999-01-01',
    '2024-00-01',
  ])('rejects unsupported or invalid date %s', (day) => {
    const doc = make();
    expect(
      compileChart({ ...doc, data: { ...doc.data, rows: [{ day, value: 1 }] } })
        .ok,
    ).toBe(false);
  });
  test('rejects missing or misplaced temporal metadata and non-line charts', () => {
    const doc = make();
    for (const chart of [
      { ...doc.chart, type: 'bar' },
      {
        ...doc.chart,
        encoding: {
          ...doc.chart.encoding,
          x: { field: 'day', type: 'temporal' },
        },
      },
      {
        ...doc.chart,
        encoding: {
          ...doc.chart.encoding,
          x: { field: 'day', type: 'ordinal', temporalKind: 'date' },
        },
      },
    ])
      expect(compileChart({ ...doc, chart }).ok).toBe(false);
    expect(compileChart({ ...doc, schemaVersion: '0.1' }).ok).toBe(false);
  });
});
