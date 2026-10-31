import { expect, test } from 'vitest';
import {
  compileChatChart,
  resolvePresentation,
  themeTokens,
} from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import baseline from './fixtures/m0-semantics.json';
const levels = [
  'minimal',
  'simple',
  'standard',
  'detailed',
  'comprehensive',
] as const;
test('seven types / dimensions / themes / levels preserve full data or explicitly fall back', () => {
  for (const entry of baseline.filter(
    (item) => !['bar', 'zero-pie', 'empty-group'].includes(item.id),
  )) {
    const source = entry.input;
    for (const theme of ['light', 'dark'] as const)
      for (const detailLevel of levels) {
        const compiled = compileChatChart(source, { theme, detailLevel });
        expect(compiled.ok).toBe(true);
        if (!compiled.ok) continue;
        for (const width of [240, 320, 480, 768])
          for (const height of [240, 320, 480]) {
            const layout = resolvePresentation(compiled.value.plan, {
              width,
              height,
              theme,
            });
            expect(layout.ok).toBe(true);
            if (!layout.ok) continue;
            expect(layout.value.accessibility?.rows).toHaveLength(
              source.data.rows.length,
            );
            expect(layout.value.rowIndices).toEqual(
              compiled.value.plan.rowIndices,
            );
            expect(layout.value.dataRevision).toBe(
              compiled.value.plan.dataRevision,
            );
            const fallback = layout.value.notices?.some(
              (notice) => notice.code === 'LAYOUT_FALLBACK',
            );
            const exported = resolvePresentation(compiled.value.plan, {
              width,
              height,
              theme,
              target: 'svg',
            });
            if (fallback)
              expect(exported).toMatchObject({
                ok: false,
                diagnostics: [{ code: 'EXPORT_LIMIT' }],
              });
            else expect(exported.ok).toBe(true);
          }
      }
  }
});
test('SVG has full raw data/units/null metadata, with bounded export failure', () => {
  const input = baseline.find((item) => item.id === 'chat-bar')!.input;
  const source = {
    ...input,
    chart: { ...input.chart, title: 'Full <title> & values' },
    data: {
      ...input.data,
      rows: [
        { month: 'A', revenue: null },
        { month: 'B', revenue: 0 },
      ],
    },
  };
  const svg = renderSvg(source, { chatPresentation: {} });
  expect(svg.ok).toBe(true);
  if (svg.ok) {
    expect(svg.value).toContain('chartnexus-data');
    expect(svg.value).toContain('["A",null]');
    expect(svg.value).toContain('&lt;title&gt; &amp;');
  }
  expect(
    renderSvg(source, { width: 200, height: 200, chatPresentation: {} }),
  ).toMatchObject({ ok: false, diagnostics: [{ code: 'EXPORT_LIMIT' }] });
});
test('text and essential graphic tokens contrast on declared surfaces', () => {
  const luminance = (hex: string) => {
    const c = hex
      .slice(1)
      .match(/../g)!
      .map((x) => parseInt(x, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return c[0]! * 0.2126 + c[1]! * 0.7152 + c[2]! * 0.0722;
  };
  const contrast = (a: string, b: string) => {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  for (const tokens of Object.values(themeTokens)) {
    for (const text of [tokens.text, tokens.secondary])
      expect(contrast(text, tokens.surface)).toBeGreaterThanOrEqual(4.5);
    for (const graphic of [tokens.axis, ...tokens.colors])
      expect(contrast(graphic, tokens.surface)).toBeGreaterThanOrEqual(3);
  }
});
