import { describe, expect, test } from 'vitest';
import { compileChart, compileChatChart } from '@chartnexus/core';
import { createAgentService } from '@chartnexus/agent';
import { renderSvg } from '@chartnexus/render';
import type { RenderPlan } from '@chartnexus/schema';

function pie(version = '0.2', values = [0, 0], donut = false) {
  return {
    schemaVersion: version,
    id: 'semantics',
    mode: 'intent',
    data: {
      kind: 'inline',
      fields: ['category', 'value'],
      rows: values.map((value, i) => ({ category: `C${i}`, value })),
    },
    chart: {
      type: 'pie',
      encoding: {
        x: { field: 'category', type: 'ordinal' },
        y: { field: 'value', type: 'quantitative' },
      },
      ...(donut ? { donut: true } : {}),
    },
  };
}
function plan(
  input: unknown,
  registry?: Parameters<typeof compileChart>[1],
): RenderPlan {
  const result = compileChart(input, registry);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
function svg(
  input: unknown,
  settings?: Parameters<typeof renderSvg>[1],
): string {
  const result = renderSvg(input, settings);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
function sectors(output: string): string[] {
  return (output.match(/<path[^>]+>/g) ?? []).filter(
    (path) =>
      path.includes('ecmeta_ssr_type="chart"') && /d="[^"]*A/.test(path),
  );
}
function grouped(
  groups = ['', 'value', '(empty)', '(empty) [2]'],
  type = 'bar',
  version = '0.2',
) {
  return {
    schemaVersion: version,
    id: 'semantics',
    mode: 'intent',
    data: {
      kind: 'inline',
      fields: ['category', 'value', 'group'],
      rows: groups.map((group, i) => ({ category: 'A', value: i + 1, group })),
    },
    chart: {
      type,
      encoding: {
        x: { field: 'category', type: 'ordinal' },
        y: { field: 'value', type: 'quantitative' },
        series: { field: 'group' },
      },
    },
  };
}

describe('intent share semantics', () => {
  test.each([
    ['0.1', false],
    ['0.2', false],
    ['0.2', true],
  ] as const)(
    '%s pie (donut %s) never fabricates zero shares',
    (version, donut) => {
      const input = pie(version, [0, 0], donut),
        before = structuredClone(input);
      const output = plan(input);
      expect(output.dataState).toBe('no-share');
      expect(output.notices).toMatchObject([
        { code: 'NO_SHARE_DATA', severity: 'info', path: '/data' },
      ]);
      expect(output.option.series).toMatchObject([
        {
          data: [
            { name: 'C0', value: 0 },
            { name: 'C1', value: 0 },
          ],
        },
      ]);
      expect(output.rowIndices).toEqual([[0, 1]]);
      const rendered = svg(input);
      expect(sectors(rendered)).toEqual([]);
      expect(rendered).toContain('No shares: all values are zero.');
      expect(input).toEqual(before);
      const positive = pie(version, [2, 3], donut);
      expect(sectors(svg(positive))).toHaveLength(2);
      expect(plan(positive).notices).toBeUndefined();
      expect(plan(positive).dataState).toBeUndefined();
      const empty = pie(version, [], donut);
      expect(plan(empty).dataState).toBe('empty');
      expect(plan(empty).notices).toBeUndefined();
      expect(sectors(svg(empty))).toEqual([]);
      expect(svg(empty)).not.toContain('No shares:');
    },
  );
  test('chat preserves no-share information even at minimal level in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      const input = {
        ...pie(),
        chart: { ...pie().chart, title: 'Optional title' },
      };
      const result = compileChatChart(input, { theme, detailLevel: 'minimal' });
      expect(result).toMatchObject({
        ok: true,
        value: {
          plan: {
            dataState: 'no-share',
            option: { title: { show: true, text: '' } },
          },
        },
      });
      const rendered = svg(input, {
        chatPresentation: { theme, detailLevel: 'minimal' },
      });
      expect(sectors(rendered)).toEqual([]);
      expect(rendered).toContain('No shares:');
      expect(
        rendered.replace(
          /<title>[\s\S]*?<\/title>|<metadata[^>]*>[\s\S]*?<\/metadata>/g,
          '',
        ),
      ).not.toContain('Optional title');
      expect(rendered).toContain('Optional title');
    }
  });
  test('zero aggregation retains provenance and registry revision', () => {
    const input = pie(),
      table = {
        ...input.data,
        rows: [
          { category: 'A', value: 0 },
          { category: 'A', value: 0 },
        ],
      };
    const result = plan(
      {
        ...input,
        data: { kind: 'reference', id: 'values', revision: 'r1' },
        chart: { ...input.chart, aggregate: { op: 'sum' } },
      },
      { values: { revision: 'r1', table } },
    );
    expect(result.dataState).toBe('no-share');
    expect(result.dataRevision).toBe('r1');
    expect(result.aggregatePoints).toMatchObject([
      [{ operation: 'sum', category: 'A', sourceCount: 2, nonNullCount: 2 }],
    ]);
    expect(result.rowIndices).toEqual([[-1]]);
  });
  test('funnel and native retain their own semantics, and null is not zero', () => {
    const input = pie();
    const funnel = plan({
      ...input,
      chart: { ...input.chart, type: 'funnel' },
    });
    expect(funnel.dataState).toBeUndefined();
    expect(funnel.notices).toBeUndefined();
    expect(funnel.option.title).not.toHaveProperty('subtext');
    expect(funnel.option.aria).toBeUndefined();
    expect(funnel.option.series).toMatchObject([
      { type: 'funnel', sort: 'none', data: [{ value: 0 }, { value: 0 }] },
    ]);
    const native = {
      schemaVersion: '0.1',
      id: 'native',
      mode: 'echarts',
      option: {
        series: [
          {
            type: 'pie',
            data: [
              { name: 'A', value: 0 },
              { name: 'B', value: 0 },
            ],
          },
        ],
      },
    };
    expect(plan(native).dataState).toBeUndefined();
    expect(sectors(svg(native))).toHaveLength(2);
    expect(
      compileChart({
        ...input,
        data: { ...input.data, rows: [{ category: 'A', value: null }] },
      }).ok,
    ).toBe(false);
  });
  test('Agent validation and compile expose no-share state while rendering remains successful', async () => {
    const agent = createAgentService();
    for (const name of ['validate_chart', 'compile_chart']) {
      expect(await agent.execute(name, { document: pie() })).toMatchObject({
        ok: true,
        value: { dataState: 'no-share', notices: [{ code: 'NO_SHARE_DATA' }] },
      });
    }
    expect(
      await agent.execute('render_chart', { document: pie() }),
    ).toMatchObject({
      ok: true,
      value: { svg: expect.stringContaining('No shares:') },
    });
  });
});

describe('group identity and labels', () => {
  test.each(['0.1', '0.2'])(
    'separates empty/raw collision names and preserves values in %s',
    (version) => {
      const input = grouped(undefined, 'bar', version),
        before = structuredClone(input),
        result = plan(input);
      expect(result.seriesMetadata?.map((s) => s.displayName)).toEqual([
        '(empty) [3]',
        'value',
        '(empty)',
        '(empty) [2]',
      ]);
      expect(result.seriesMetadata?.map((s) => s.groupValue)).toEqual([
        '',
        'value',
        '(empty)',
        '(empty) [2]',
      ]);
      expect(new Set(result.seriesMetadata?.map((s) => s.id)).size).toBe(4);
      expect(result.option.series).toMatchObject([
        { data: [1] },
        { data: [2] },
        { data: [3] },
        { data: [4] },
      ]);
      expect(result.rowIndices).toEqual([[0], [1], [2], [3]]);
      expect(input).toEqual(before);
      const reordered = plan({
        ...input,
        data: { ...input.data, rows: [...input.data.rows].reverse() },
      });
      expect(
        [...reordered.seriesMetadata!].sort((a, b) => a.id.localeCompare(b.id)),
      ).toEqual(
        [...result.seriesMetadata!].sort((a, b) => a.id.localeCompare(b.id)),
      );
      const renamed = plan({
        ...input,
        data: {
          ...input.data,
          fields: ['category', 'value', 'renamed'],
          rows: input.data.rows.map(({ group, ...row }) => ({
            ...row,
            renamed: group,
          })),
        },
        chart: {
          ...input.chart,
          encoding: { ...input.chart.encoding, series: { field: 'renamed' } },
        },
      });
      expect(renamed.seriesMetadata?.map((s) => s.id)).not.toEqual(
        result.seriesMetadata?.map((s) => s.id),
      );
    },
  );
  test('applies to grouped line/scatter and preserves aggregates', () => {
    const line = grouped(['', 'value'], 'line');
    const aggregate = plan({
      ...line,
      chart: { ...line.chart, aggregate: { op: 'sum' } },
    });
    expect(
      aggregate.aggregatePoints?.map((points) => points[0]?.series),
    ).toEqual(['', 'value']);
    expect(aggregate.seriesMetadata?.map((s) => s.groupValue)).toEqual([
      '',
      'value',
    ]);
    const scatter = {
      ...line,
      data: {
        ...line.data,
        rows: line.data.rows.map((row) => ({ ...row, category: 1 })),
      },
      chart: {
        ...line.chart,
        type: 'scatter',
        encoding: {
          ...line.chart.encoding,
          x: { field: 'category', type: 'quantitative' },
        },
      },
    };
    expect(plan(scatter).option.series).toMatchObject([
      { name: '(empty)', data: [[1, 1]] },
      { name: 'value', data: [[1, 2]] },
    ]);
  });
});
