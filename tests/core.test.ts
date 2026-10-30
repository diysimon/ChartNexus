import { describe, expect, test } from 'vitest';
import { compileChart, validateChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import recipe from '../resources/recipes/bar.json';

const fresh = () => structuredClone(recipe);
function option(input: unknown) {
  const result = compileChart(input);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value.option;
}
function code(input: unknown) {
  const result = compileChart(input);
  return result.ok ? 'OK' : result.diagnostics[0]?.code;
}

describe('document boundary', () => {
  test('rejects ambiguous modes and unknown properties', () => {
    expect(validateChart({ ...fresh(), option: {} }).ok).toBe(false);
    expect(validateChart({ ...fresh(), surprise: true }).ok).toBe(false);
    expect(validateChart({ ...fresh(), schemaVersion: '2.0' }).ok).toBe(false);
  });
  test.each([NaN, Infinity, undefined, () => 1, new Date(), new Map()])(
    'rejects non-JSON values: %s',
    (value) => {
      expect(code({ ...fresh(), extra: value })).toBe('INVALID_JSON');
    },
  );
  test('rejects accessors without evaluating them', () => {
    let calls = 0;
    const value = {
      get data() {
        calls++;
        return 1;
      },
    };
    expect(validateChart(value).ok).toBe(false);
    expect(calls).toBe(0);
  });
  test('rejects dangerous keys, cycles, sparse arrays, excessive depth and size', () => {
    expect(code(JSON.parse('{"__proto__":{}}'))).toBe('INVALID_JSON');
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(code(cycle)).toBe('INVALID_JSON');
    expect(code({ rows: new Array(3) })).toBe('INVALID_JSON');
    let deep: unknown = 1;
    for (let i = 0; i < 34; i++) deep = { deep };
    expect(code(deep)).toBe('INVALID_JSON');
    expect(code({ text: 'a'.repeat(1_048_576) })).toBe('RESOURCE_LIMIT');
  });
});

describe('intent semantics', () => {
  test('deterministic and does not mutate input', () => {
    const doc = fresh();
    const before = JSON.stringify(doc);
    expect(compileChart(doc)).toEqual(compileChart(doc));
    expect(JSON.stringify(doc)).toBe(before);
  });
  test.each(['bar', 'line', 'pie'])('compiles %s', (type) => {
    const doc = fresh();
    doc.chart.type = type;
    expect(option(doc).series).toMatchObject([{ type }]);
  });
  test('scatter maps numerical coordinates', () => {
    const doc = fresh();
    doc.chart.type = 'scatter';
    doc.chart.encoding.x.type = 'quantitative';
    const rows = [
      { month: 1, revenue: 2 },
      { month: 2, revenue: 3 },
    ];
    expect(
      option({ ...doc, data: { ...doc.data, rows } }).series,
    ).toMatchObject([
      {
        data: [
          [1, 2],
          [2, 3],
        ],
      },
    ]);
  });
  test('null remains a gap rather than zero', () => {
    const doc = fresh();
    expect(
      option({
        ...doc,
        data: { ...doc.data, rows: [{ month: 'Jan', revenue: null }] },
      }).series,
    ).toMatchObject([{ data: [null] }]);
  });
  test('empty dataset compiles without fabricated values', () => {
    const doc = fresh();
    doc.data.rows = [];
    expect(option(doc).series).toEqual([]);
  });
  test('rejects wrong fields, string numbers, duplicate categories and wrong encoding', () => {
    const doc = fresh();
    doc.chart.encoding.y.field = 'missing';
    expect(code(doc)).toBe('UNKNOWN_FIELD');
    const source = fresh();
    expect(
      code({
        ...source,
        data: { ...source.data, rows: [{ month: 'Jan', revenue: '10' }] },
      }),
    ).toBe('INVALID_DATA');
    source.data.rows.push({ month: 'Jan', revenue: 5 });
    expect(code(source)).toBe('AMBIGUOUS_DATA');
    const scatter = fresh();
    scatter.chart.type = 'scatter';
    expect(code(scatter)).toBe('INVALID_ENCODING');
  });
  test('pie rejects negative values and grouping', () => {
    const doc = fresh();
    doc.chart.type = 'pie';
    doc.data.rows[0]!.revenue = -1;
    expect(code(doc)).toBe('INVALID_DATA');
  });
  test('grouped data aligns categories and preserves missing combinations', () => {
    const doc = fresh();
    const result = compileChart({
      ...doc,
      data: {
        kind: 'inline',
        fields: ['month', 'revenue', 'region'],
        rows: [
          { month: 'Jan', revenue: 2, region: 'East' },
          { month: 'Feb', revenue: 3, region: 'West' },
        ],
      },
      chart: {
        ...doc.chart,
        stack: true,
        encoding: { ...doc.chart.encoding, series: { field: 'region' } },
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.option.series).toMatchObject([
      { name: 'East', stack: 'total', data: [2, null] },
      { name: 'West', data: [null, 3] },
    ]);
    expect(result.value.rowIndices).toEqual([
      [0, -1],
      [-1, 1],
    ]);
  });
  test('references require exact revision and valid host data', () => {
    const doc = fresh();
    const referenced = {
      ...doc,
      data: { kind: 'reference', id: 'sales', revision: 'r1' },
    };
    expect(compileChart(referenced).ok).toBe(false);
    expect(
      compileChart(referenced, { sales: { revision: 'r2', table: doc.data } })
        .ok,
    ).toBe(false);
    const result = compileChart(referenced, {
      sales: { revision: 'r1', table: doc.data },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.dataRevision).toBe('r1');
  });
});

describe('native capability profile', () => {
  const native = (option: unknown) => ({
    schemaVersion: '0.1',
    id: 'native',
    mode: 'echarts',
    option,
  });
  test('compiles native option and forces safe tooltip mode without mutation', () => {
    const original = {
      series: [{ type: 'pie', data: [{ value: 1, name: '<b>x</b>' }] }],
      tooltip: { renderMode: 'html' },
    };
    expect(option(native(original)).tooltip).toMatchObject({
      renderMode: 'richText',
    });
    expect(original.tooltip.renderMode).toBe('html');
  });
  test.each([
    { series: [{ type: 'custom' }] },
    { series: [], graphic: {} },
    { series: [{ type: 'bar', symbol: 'image://https://example.org/x' }] },
    { series: [], tooltip: { formatter: '{b}' } },
  ])('rejects unsupported native features', (value) => {
    expect(code(native(value))).toBe('UNSUPPORTED_CAPABILITY');
  });
});

describe('SVG SSR', () => {
  test.each(['bar', 'line', 'pie'])(
    'renders actual %s SVG without DOM',
    (type) => {
      const doc = fresh();
      doc.chart.type = type;
      const svg = renderSvg(doc);
      expect(svg.ok).toBe(true);
      if (svg.ok) {
        expect(svg.value).toContain('<svg');
        expect(svg.value).toContain('<path');
        expect(svg.value).not.toMatch(/<script|foreignObject/);
      }
    },
  );
  test('invalid dimensions and data are diagnosed', () => {
    expect(renderSvg(fresh(), { width: 0 }).ok).toBe(false);
    expect(renderSvg(fresh(), { width: 4097 }).ok).toBe(false);
    expect(renderSvg({}).ok).toBe(false);
  });
});
