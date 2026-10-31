import { describe, expect, test } from 'vitest';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import recipe from '../resources/recipes/bar.json';
const base = () => ({ ...structuredClone(recipe), schemaVersion: '0.2' });
function plan(input: unknown) {
  const result = compileChart(input);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('0.2 label and legend presentation', () => {
  test('omission preserves baseline option and false explicitly hides', () => {
    const doc = base();
    expect(plan(doc).option).toEqual(plan({ ...doc, presentation: {} }).option);
    const input = {
      ...doc,
      presentation: { dataLabels: { show: false }, legend: { show: false } },
    };
    expect(plan(input).option).toMatchObject({
      legend: { show: false, bottom: 4 },
      series: [{ label: { show: false }, data: [120, 180, 150] }],
    });
    expect(renderSvg(input).ok).toBe(true);
  });
  test.each(['bar', 'line', 'pie', 'scatter'])(
    'shows labels and places legend for %s',
    (type) => {
      const doc = base();
      const data =
        type === 'scatter'
          ? {
              ...doc.data,
              rows: [
                { month: 1, revenue: 120 },
                { month: 2, revenue: 180 },
              ],
            }
          : doc.data;
      const chart = {
        ...doc.chart,
        type,
        encoding: {
          ...doc.chart.encoding,
          x: {
            ...doc.chart.encoding.x,
            type: type === 'scatter' ? 'quantitative' : 'ordinal',
          },
        },
        ...(type === 'bar' ? { orientation: 'horizontal' } : {}),
        ...(type === 'line' ? { area: true } : {}),
        ...(type === 'pie' ? { donut: true } : {}),
      };
      const input = {
        ...doc,
        data,
        chart,
        presentation: {
          theme: { id: 'dark', version: '1' },
          legend: { show: true, position: 'top' },
          dataLabels: { show: true },
        },
      };
      const before = structuredClone(input);
      const result = plan(input);
      expect(result.option).toMatchObject({
        legend: { show: true, top: 36 },
        series: [{ type, label: { show: true, color: '#f3f4f6' } }],
      });
      expect(result.option.legend).not.toHaveProperty('bottom');
      if (type !== 'pie') expect(result.option.grid).toMatchObject({ top: 80 });
      expect(input).toEqual(before);
      expect(plan(input)).toEqual(result);
      expect(renderSvg(input).ok).toBe(true);
    },
  );
  test('retains aggregate, date, sort, unit and position metadata', () => {
    const doc = base();
    const input = {
      ...doc,
      data: {
        kind: 'inline',
        fields: ['day', 'value'],
        rows: [
          { day: '2024-03-01', value: 2 },
          { day: '2024-02-29', value: 3 },
          { day: '2024-03-01', value: 5 },
        ],
      },
      chart: {
        type: 'line',
        aggregate: { op: 'sum' },
        sort: { by: 'category', order: 'ascending', nulls: 'last' },
        encoding: {
          x: { field: 'day', type: 'temporal', temporalKind: 'date' },
          y: {
            field: 'value',
            type: 'quantitative',
            unit: { kind: 'unit', label: 'kg' },
          },
        },
      },
      presentation: {
        dataLabels: { show: true },
        legend: { show: true, position: 'bottom' },
      },
    };
    const output = plan(input);
    expect(output.option).toMatchObject({
      yAxis: { name: 'value (kg)' },
      series: [
        {
          data: [
            [Date.UTC(2024, 1, 29), 3],
            [Date.UTC(2024, 2, 1), 7],
          ],
          label: { show: true },
        },
      ],
    });
    expect(output.aggregatePoints?.[0]?.map((x) => x?.sourceCount)).toEqual([
      1, 2,
    ]);
    expect(output.rowIndices).toEqual([[-1, -1]]);
    expect(renderSvg(input).ok).toBe(true);
  });
  test('rejects invalid fields and maintains version boundaries', () => {
    const doc = base();
    for (const presentation of [
      { legend: { position: 'top' } },
      { legend: { show: true, position: 'left' } },
      { dataLabels: { show: 'yes' } },
      { dataLabels: { show: true, formatter: '{c}' } },
    ])
      expect(compileChart({ ...doc, presentation }).ok).toBe(false);
    expect(
      compileChart({
        ...doc,
        schemaVersion: '0.1',
        presentation: { legend: { show: true } },
      }).ok,
    ).toBe(false);
  });
});
