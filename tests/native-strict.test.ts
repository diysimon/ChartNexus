import { describe, expect, test } from 'vitest';
import { compileChart, validateNativeStrict } from '@chartnexus/core';
import { createAgentService } from '@chartnexus/agent';
import { renderSvg } from '@chartnexus/render';

const doc = <T>(option: T) => ({
  schemaVersion: '0.1',
  id: 'strict',
  mode: 'echarts',
  option,
});
const bar = () =>
  doc({
    title: { text: 'Sales' },
    xAxis: { type: 'category', data: ['A', 'B'] },
    yAxis: { type: 'value' },
    series: [
      { type: 'bar', data: [2, null] },
      { type: 'line', data: [1, 3] },
    ],
  });
describe('opt-in strict native subset', () => {
  test('accepts bar/line, scatter and pie and renders them', () => {
    for (const input of [
      bar(),
      doc({
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: [
          {
            type: 'scatter',
            data: [
              [1, 2],
              [3, null],
            ],
          },
        ],
      }),
      doc({
        series: [
          {
            type: 'pie',
            data: [
              { name: 'A', value: 2 },
              { name: 'B', value: 1 },
            ],
          },
        ],
      }),
    ]) {
      const before = structuredClone(input);
      expect(validateNativeStrict(input)).toEqual({ ok: true, value: true });
      expect(renderSvg(input).ok).toBe(true);
      expect(input).toEqual(before);
    }
  });
  test('strict rejects unknown nested fields while default guarded compilation stays compatible', () => {
    const input = bar();
    input.option.series[0] = {
      ...input.option.series[0]!,
      typo: 1,
    } as (typeof input.option.series)[0];
    expect(compileChart(input).ok).toBe(true);
    expect(validateNativeStrict(input)).toMatchObject({
      ok: false,
      diagnostics: [
        {
          code: 'INVALID_NATIVE_STRICT',
          path: expect.stringContaining('/option/series/0'),
        },
      ],
    });
  });
  test('rejects malformed or semantically mismatched shapes', () => {
    const tests = [
      doc({
        xAxis: { type: 'category', data: ['A', 'A'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [1, 2] }],
      }),
      doc({
        xAxis: { type: 'category', data: ['A', 'B'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [1] }],
      }),
      doc({
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [1] }],
      }),
      doc({
        series: [
          {
            type: 'pie',
            data: [
              { name: 'A', value: 1 },
              { name: 'A', value: 2 },
            ],
          },
        ],
      }),
      doc({ series: [{ type: 'pie', data: [{ name: 'A', value: -1 }] }] }),
      doc({
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: [
          { type: 'scatter', data: [[1, 2]] },
          { type: 'line', data: [1] },
        ],
      }),
      doc({
        xAxis: { type: 'category', data: ['A'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: ['1'] }],
      }),
      doc({ dataset: { source: [] }, series: [{ type: 'bar', data: [] }] }),
      doc({
        series: [
          {
            type: 'pie',
            data: [{ name: 'A', value: 1 }],
            label: { formatter: '{b}' },
          },
        ],
      }),
      { ...bar(), schemaVersion: '0.2' },
    ];
    for (const input of tests)
      expect(validateNativeStrict(input).ok).toBe(false);
  });
  test('agent selects strict explicitly and never silently downgrades', async () => {
    const service = createAgentService();
    const input = bar();
    expect(
      await service.execute('validate_chart', {
        document: input,
        nativeValidation: 'strict-basic-0.1',
      }),
    ).toMatchObject({
      ok: true,
      value: { validation: 'native-strict-basic-0.1' },
    });
    expect(
      await service.execute('validate_chart', { document: input }),
    ).toMatchObject({
      ok: true,
      value: { validation: 'guarded-native-partial' },
    });
    expect(
      (
        await service.execute('validate_chart', {
          document: { ...input, mode: 'intent' },
          nativeValidation: 'strict-basic-0.1',
        })
      ).ok,
    ).toBe(false);
    const changed = structuredClone(input);
    changed.option.series[0] = {
      ...changed.option.series[0]!,
      typo: true,
    } as (typeof changed.option.series)[0];
    expect(
      (
        await service.execute('validate_chart', {
          document: changed,
          nativeValidation: 'strict-basic-0.1',
        })
      ).ok,
    ).toBe(false);
    expect(
      (await service.execute('validate_chart', { document: changed })).ok,
    ).toBe(true);
  });
});
