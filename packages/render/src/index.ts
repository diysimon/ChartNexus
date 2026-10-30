import { Buffer } from 'node:buffer';
import * as echarts from 'echarts';
import { compileChart, limits } from '@chartnexus/core';
import { failure, type DataRegistry, type Result } from '@chartnexus/schema';

/** Static SVG only; rendering has no browser interaction or arbitrary callbacks. */
export function renderSvg(
  input: unknown,
  settings: { width?: number; height?: number; registry?: DataRegistry } = {},
): Result<string> {
  const width = settings.width ?? 800,
    height = settings.height ?? 480;
  if (
    ![width, height].every(
      (v) => Number.isInteger(v) && v > 0 && v <= limits.dimension,
    )
  )
    return failure(
      'RESOURCE_LIMIT',
      '',
      'Dimensions must be integers in 1..4096.',
    );
  const compiled = compileChart(input, settings.registry);
  if (!compiled.ok) return compiled;
  let chart: echarts.ECharts | undefined;
  try {
    chart = echarts.init(null, undefined, {
      renderer: 'svg',
      ssr: true,
      width,
      height,
    });
    chart.setOption(compiled.value.option, { notMerge: true });
    const svg = chart.renderToSVGString();
    if (Buffer.byteLength(svg, 'utf8') > 8_388_608)
      return failure(
        'RESOURCE_LIMIT',
        '',
        'SVG exceeds the 8 MiB output budget.',
      );
    return { ok: true, value: svg };
  } catch {
    return failure(
      'RENDER_FAILED',
      '',
      'ECharts could not render this document.',
    );
  } finally {
    chart?.dispose();
  }
}
