import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
const base = () => ({
  schemaVersion: '0.2',
  id: 'time',
  mode: 'intent',
  data: {
    kind: 'inline',
    fields: ['time', 'value'],
    rows: [
      { time: '2024-03-01T08:00:00+08:00', value: 2 },
      { time: '2024-03-01T02:30:00+03:00', value: 1 },
    ],
  },
  chart: {
    type: 'line',
    encoding: {
      x: { field: 'time', type: 'temporal', temporalKind: 'instant' },
      y: {
        field: 'value',
        type: 'quantitative',
        unit: { kind: 'unit', label: 'kg' },
      },
    },
    sort: { by: 'category', order: 'ascending', nulls: 'last' },
  },
  presentation: { theme: { id: 'dark', version: '1' } },
});
function plan(doc: unknown, registry?: Parameters<typeof compileChart>[1]) {
  const r = compileChart(doc, registry);
  if (!r.ok) throw new Error(JSON.stringify(r.diagnostics));
  return r.value;
}
describe('0.2 offset-bearing instants', () => {
  test('sorts by absolute time, preserves row identity and source', () => {
    const input = base();
    const before = structuredClone(input);
    const result = plan(input);
    expect(result.option).toMatchObject({
      useUTC: true,
      xAxis: { type: 'time' },
      yAxis: { name: 'value (kg)' },
      series: [
        {
          data: [
            [Date.UTC(2024, 1, 29, 23, 30), 1],
            [Date.UTC(2024, 2, 1), 2],
          ],
        },
      ],
    });
    expect(result.rowIndices).toEqual([[1, 0]]);
    expect(input).toEqual(before);
    expect(plan(input)).toEqual(result);
    expect(renderSvg(input).ok).toBe(true);
  });
  test('does not implicitly reorder and handles subsecond offset times', () => {
    const doc = base();
    const input = {
      ...doc,
      data: {
        ...doc.data,
        rows: [
          { time: '2024-03-01T00:00:00.125Z', value: 1 },
          { time: '2024-02-29T20:00:00-05:00', value: 2 },
        ],
      },
      chart: { type: 'line', encoding: doc.chart.encoding },
    };
    expect(plan(input).option.series).toMatchObject([
      {
        data: [
          [Date.UTC(2024, 2, 1, 0, 0, 0, 125), 1],
          [Date.UTC(2024, 2, 1, 1), 2],
        ],
      },
    ]);
  });
  test('rejects equivalent instants expressed with different offsets, including grouped data', () => {
    const doc = base();
    const table = {
      fields: ['time', 'value', 'region'],
      rows: [
        { time: '2024-03-01T08:00:00+08:00', value: 2, region: 'A' },
        { time: '2024-03-01T00:00:00Z', value: 3, region: 'B' },
      ],
    };
    const input = {
      ...doc,
      data: { kind: 'reference', id: 'd', revision: 'r1' },
      chart: {
        ...doc.chart,
        encoding: { ...doc.chart.encoding, series: { field: 'region' } },
      },
    };
    expect(compileChart(input, { d: { revision: 'r1', table } })).toMatchObject(
      { ok: false, diagnostics: [{ code: 'AMBIGUOUS_DATA' }] },
    );
  });
  test('grouped aggregation and category sorting keep metadata and null gaps', () => {
    const doc = base();
    const input = {
      ...doc,
      data: {
        kind: 'inline',
        fields: ['time', 'value', 'g'],
        rows: [
          { time: '2024-03-01T08:00:00+08:00', value: 2, g: 'A' },
          { time: '2024-03-01T02:30:00+03:00', value: 3, g: 'B' },
          { time: '2024-03-01T08:00:00+08:00', value: 4, g: 'A' },
        ],
      },
      chart: {
        ...doc.chart,
        aggregate: { op: 'sum' },
        encoding: { ...doc.chart.encoding, series: { field: 'g' } },
      },
    };
    const result = plan(input);
    expect(result.option.series).toMatchObject([
      {
        data: [
          [Date.UTC(2024, 1, 29, 23, 30), null],
          [Date.UTC(2024, 2, 1), 6],
        ],
      },
      {
        data: [
          [Date.UTC(2024, 1, 29, 23, 30), 3],
          [Date.UTC(2024, 2, 1), null],
        ],
      },
    ]);
    expect(result.aggregatePoints?.[0]?.[1]).toMatchObject({
      sourceCount: 2,
      category: '2024-03-01T08:00:00+08:00',
    });
  });
  test.each([
    '2024-02-30T00:00:00Z',
    '2023-02-29T00:00:00Z',
    '2024-01-01T24:00:00Z',
    '2024-01-01T00:00:60Z',
    '2024-01-01T00:00:00',
    '2024-01-01T00:00:00+14:01',
    '2024-01-01T00:00:00-00:00',
    '2024-01-01T00:00:00.1234Z',
    '2024-01-01T00:00Z',
  ])('rejects unsupported or invalid instant %s', (time) => {
    const doc = base();
    expect(
      compileChart({
        ...doc,
        data: { ...doc.data, rows: [{ time, value: 1 }] },
      }).ok,
    ).toBe(false);
  });
  test('rejects 0.1 and non-line instant chart', () => {
    const doc = base();
    expect(compileChart({ ...doc, schemaVersion: '0.1' }).ok).toBe(false);
    expect(
      compileChart({ ...doc, chart: { ...doc.chart, type: 'bar' } }).ok,
    ).toBe(false);
  });
});
