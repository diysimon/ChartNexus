import { describe, expect, test } from 'vitest';
import { compileChart, compileChatChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import bar from '../resources/recipes/bar.json';
import combo from '../resources/recipes/combo.json';
import funnel from '../resources/recipes/funnel.json';
import heatmap from '../resources/recipes/heatmap.json';
const doc = { ...bar, schemaVersion: '0.2' };
function chat(
  input: unknown,
  settings: Parameters<typeof compileChatChart>[1] = {},
) {
  const result = compileChatChart(input, settings);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('host chat presentation', () => {
  test('bounds category labels without modifying category values or identity', () => {
    const input = {
      ...doc,
      data: {
        ...doc.data,
        rows: [{ month: 'A very long category label', revenue: 12 }],
      },
    };
    const baseline = compileChart(input);
    if (!baseline.ok) throw new Error('baseline');
    const result = chat(input);
    expect(result.plan.option.xAxis).toMatchObject({
      axisLabel: { width: 80, overflow: 'truncate', hideOverlap: true },
      tooltip: { show: true },
    });
    expect(result.plan.rowIndices).toEqual(baseline.value.rowIndices);
    expect(result.plan.option.series).toMatchObject([{ data: [12] }]);
  });
  test('default is opt-in light, transparent, and preserves all data and source identity', () => {
    const before = structuredClone(doc),
      ordinary = compileChart(doc);
    if (!ordinary.ok) throw new Error('baseline');
    const result = chat(doc);
    expect(result.plan.option.backgroundColor).toBe('transparent');
    expect(result.plan.option.series).toMatchObject([
      { data: [120, 180, 150], label: { show: false } },
    ]);
    expect(result.plan.rowIndices).toEqual(ordinary.value.rowIndices);
    expect(doc).toEqual(before);
    expect(compileChart(doc)).toEqual(ordinary);
    expect(renderSvg(doc, { chatPresentation: {} }).ok).toBe(true);
  });
  test.each([
    'minimal',
    'simple',
    'standard',
    'detailed',
    'comprehensive',
  ] as const)('maintains required data and legend for %s', (level) => {
    const baseline = compileChart(combo);
    if (!baseline.ok) throw new Error('baseline');
    for (const theme of ['light', 'dark'] as const) {
      const result = chat(combo, { theme, detailLevel: level });
      expect(result.plan.option.legend).toMatchObject({ show: true });
      expect(result.plan.rowIndices).toEqual(baseline.value.rowIndices);
      const values = (result.plan.option.series as { data: unknown }[]).map(
        (s) => s.data,
      );
      const expected = (
        baseline.value.option.series as { data: unknown }[]
      ).map((s) => s.data);
      expect(values).toEqual(expected);
      expect(
        renderSvg(combo, { chatPresentation: { theme, detailLevel: level } })
          .ok,
      ).toBe(true);
    }
  });
  test('retains color range and legends for sparse heatmap, pie and funnel', () => {
    const h = chat(heatmap, { theme: 'dark', detailLevel: 'minimal' });
    expect(h.plan.option.visualMap).toMatchObject({
      min: 0,
      max: 10,
      inRange: { color: ['#1d4ed8', '#38bdf8', '#e0f2fe'] },
    });
    expect(h.plan.rowIndices).toEqual([[0, 2, 3]]);
    for (const input of [
      funnel,
      { ...doc, chart: { ...doc.chart, type: 'pie' } },
    ]) {
      const result = chat(input, { detailLevel: 'minimal' });
      expect(result.plan.option.legend).toMatchObject({ show: true });
      expect(result.adjustments).toContain('REQUIRED_LEGEND');
    }
  });
  test('uses document intent when host leaves it open, with explicit host settings taking priority', () => {
    const input = {
      ...doc,
      presentation: {
        theme: { id: 'dark', version: '1' },
        detailLevel: 'detailed',
      },
    };
    expect(chat(input).plan.option).toMatchObject({
      textStyle: { color: '#f3f4f6' },
      series: [{ label: { show: true } }],
    });
    expect(
      chat(input, { theme: 'light', detailLevel: 'minimal' }).plan.option,
    ).toMatchObject({
      textStyle: { color: '#172033' },
      title: { show: false },
      series: [{ label: { show: false } }],
    });
  });
  test('exposes deterministic overrides and density adjustment', () => {
    const explicit = {
      ...combo,
      presentation: { legend: { show: false }, dataLabels: { show: true } },
    };
    const result = chat(explicit, {
      theme: 'dark',
      detailLevel: 'minimal',
      background: 'theme',
    });
    expect(result.plan.option).toMatchObject({
      backgroundColor: '#111827',
      legend: { show: true },
      series: [{ label: { show: true } }, { label: { show: true } }],
    });
    expect(result.adjustments).toContain('REQUIRED_LEGEND');
    const rows = Array.from({ length: 9 }, (_, i) => ({
      month: String(i),
      revenue: i,
    }));
    const dense = chat(
      { ...doc, data: { ...doc.data, rows } },
      { detailLevel: 'comprehensive' },
    );
    expect(dense.adjustments).toContain('LABEL_DENSITY_LIMIT');
    expect(dense.plan.option.series).toMatchObject([
      { label: { show: false } },
    ]);
  });
  test('minimal level retains both explicitly declared axes and units', () => {
    const input = {
      ...combo,
      chart: {
        ...combo.chart,
        secondary: {
          field: 'cost',
          axis: 'right',
          unit: { kind: 'percent', scale: 'ratio' },
        },
      },
    };
    const result = chat(input, { theme: 'dark', detailLevel: 'minimal' });
    expect(result.plan.option.yAxis).toMatchObject([
      { name: 'sales (USD)' },
      { name: 'cost (ratio)', position: 'right' },
    ]);
    expect(result.plan.option.legend).toMatchObject({ show: true });
    expect(result.adjustments).toEqual([]);
  });
  test('preserves aggregation identity, date/units and rejects invalid settings', () => {
    const input = {
      ...doc,
      data: {
        kind: 'inline',
        fields: ['day', 'value'],
        rows: [
          { day: '2024-03-01', value: 2 },
          { day: '2024-03-01', value: 3 },
        ],
      },
      chart: {
        type: 'line',
        aggregate: { op: 'sum' },
        encoding: {
          x: { field: 'day', type: 'temporal', temporalKind: 'date' },
          y: {
            field: 'value',
            type: 'quantitative',
            unit: { kind: 'unit', label: 'kg' },
          },
        },
      },
    };
    const result = chat(input, { theme: 'dark' });
    expect(result.plan.option.yAxis).toMatchObject({ name: 'value (kg)' });
    expect(result.plan.aggregatePoints?.[0]?.[0]).toMatchObject({
      sourceCount: 2,
    });
    expect(result.plan.rowIndices).toEqual([[-1]]);
    for (const invalid of [
      { theme: 'auto' },
      { theme: ['light'] },
      { background: 'red' },
      { detailLevel: 3 },
      { extra: true },
    ])
      expect(compileChatChart(doc, invalid as never).ok).toBe(false);
    expect(compileChatChart(bar).ok).toBe(false);
  });
});

test('chat presets cover every implemented chart type and SVG backgrounds', () => {
  const line = { ...doc, chart: { ...doc.chart, type: 'line', area: true } };
  const pie = { ...doc, chart: { ...doc.chart, type: 'pie', donut: true } };
  const scatter = {
    ...doc,
    data: {
      ...doc.data,
      rows: [
        { month: 1, revenue: 2 },
        { month: 3, revenue: 4 },
      ],
    },
    chart: {
      ...doc.chart,
      type: 'scatter',
      encoding: {
        ...doc.chart.encoding,
        x: { field: 'month', type: 'quantitative' },
      },
    },
  };
  for (const input of [doc, line, pie, scatter, combo, funnel, heatmap])
    for (const theme of ['light', 'dark'] as const)
      for (const detailLevel of [
        'minimal',
        'simple',
        'standard',
        'detailed',
        'comprehensive',
      ] as const) {
        const baseline = compileChart(input);
        const styled = compileChatChart(input, { theme, detailLevel });
        expect(baseline.ok && styled.ok).toBe(true);
        if (baseline.ok && styled.ok) {
          expect(styled.value.plan.rowIndices).toEqual(
            baseline.value.rowIndices,
          );
          expect(
            (styled.value.plan.option.series as { data: unknown }[]).map(
              (s) => s.data,
            ),
          ).toEqual(
            (baseline.value.option.series as { data: unknown }[]).map(
              (s) => s.data,
            ),
          );
        }
      }
  const transparent = renderSvg(doc, {
    chatPresentation: { theme: 'dark', background: 'transparent' },
  });
  const opaque = renderSvg(doc, {
    chatPresentation: { theme: 'dark', background: 'theme' },
  });
  expect(transparent.ok && transparent.value).toContain('fill="none"');
  expect(opaque.ok && opaque.value).toContain('fill="#111827"');
});

test('preset foreground contrast against representative chat surfaces', () => {
  function luminance(hex: string) {
    const rgb = hex
      .match(/[0-9a-f]{2}/gi)!
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
  }
  const contrast = (a: string, b: string) => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0]! + 0.05) / (values[1]! + 0.05);
  };
  expect(contrast('172033', 'ffffff')).toBeGreaterThanOrEqual(4.5);
  expect(contrast('f3f4f6', '1f2937')).toBeGreaterThanOrEqual(4.5);
});
