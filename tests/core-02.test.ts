import { describe, expect, test } from 'vitest';
import {
  compileChart,
  migrateIntent01To02,
  validateChart,
} from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import recipe from '../resources/recipes/bar.json';

const base = () => ({ ...structuredClone(recipe), schemaVersion: '0.2' });
function compile(input: unknown) {
  const result = compileChart(input);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
describe('experimental 0.2 intent profile', () => {
  test('keeps 0.1 behavior and explicitly converts intent without mutation', () => {
    const original = structuredClone(recipe);
    const result = migrateIntent01To02(original);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.schemaVersion).toBe('0.2');
    expect(compile(result.value).option).toEqual(compile(original).option);
    expect(original).toEqual(recipe);
    expect(
      migrateIntent01To02({
        schemaVersion: '0.1',
        id: 'n',
        mode: 'echarts',
        option: { series: [] },
      }).ok,
    ).toBe(false);
    expect(validateChart(result.value).ok).toBe(true);
    expect(validateChart({ ...result.value, extra: true }).ok).toBe(false);
  });
  test('horizontal bars keep data while swapping physical axes', () => {
    const doc = base();
    const input = {
      ...doc,
      chart: { ...doc.chart, orientation: 'horizontal' },
    };
    const before = structuredClone(input);
    const plan = compile(input);
    expect(plan.option.xAxis).toMatchObject({ type: 'value', name: 'revenue' });
    expect(plan.option.yAxis).toMatchObject({
      type: 'category',
      data: ['Jan', 'Feb', 'Mar'],
    });
    expect(plan.option.series).toMatchObject([{ data: [120, 180, 150] }]);
    expect(input).toEqual(before);
    expect(plan.profile).toBe('basic-0.2');
    expect(compile(input)).toEqual(plan);
    expect(renderSvg(input).ok).toBe(true);
  });
  test('renders area and donut variants with named themes', () => {
    const doc = base();
    const area = {
      ...doc,
      chart: { ...doc.chart, type: 'line', area: true },
      presentation: { theme: { id: 'dark', version: '1' } },
    };
    expect(compile(area).option).toMatchObject({
      backgroundColor: '#111827',
      series: [{ type: 'line', areaStyle: {} }],
    });
    expect(renderSvg(area).ok).toBe(true);
    const donut = {
      ...doc,
      chart: { ...doc.chart, type: 'pie', donut: true },
      presentation: { theme: { id: 'light', version: '1' } },
    };
    expect(compile(donut).option).toMatchObject({
      backgroundColor: '#ffffff',
      series: [{ type: 'pie', radius: ['40%', '70%'] }],
    });
    expect(renderSvg(donut).ok).toBe(true);
  });
  test('provides schema-owned expected constant and enum values for repair', () => {
    const doc = base();
    expect(
      compileChart({
        ...doc,
        presentation: { theme: { id: 'light', version: 1 } },
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({
          code: 'INVALID_SCHEMA',
          path: '/presentation/theme/version',
          message: 'Expected "1".',
        }),
      ]),
    });
    expect(
      compileChart({ ...doc, presentation: { detailLevel: 'verbose' } }),
    ).toMatchObject({
      ok: false,
      diagnostics: [
        {
          code: 'INVALID_SCHEMA',
          path: '/presentation/detailLevel',
          message: expect.stringContaining('comprehensive'),
        },
      ],
    });
  });
  test('rejects invalid combinations, unknown themes, versions and native mode', () => {
    const doc = base();
    for (const input of [
      { ...doc, chart: { ...doc.chart, area: true } },
      { ...doc, chart: { ...doc.chart, donut: true } },
      {
        ...doc,
        chart: { ...doc.chart, type: 'pie', orientation: 'horizontal' },
      },
      { ...doc, presentation: { theme: { id: 'unknown', version: '1' } } },
      { ...doc, presentation: { theme: { id: 'light', version: '2' } } },
      {
        schemaVersion: '0.2',
        id: 'native',
        mode: 'echarts',
        option: { series: [] },
      },
    ])
      expect(compileChart(input).ok).toBe(false);
  });
});
