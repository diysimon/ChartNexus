import { mapCatalog, registerPlanMap, renderOption } from '@chartnexus/echarts';
import { Buffer } from 'node:buffer';
import { echarts } from '@chartnexus/echarts';
import {
  compileChart,
  compileChatChart,
  limits,
  type ChatPresentationSettings,
} from '@chartnexus/core';
import {
  failure,
  type DataRegistry,
  type MapRegistry,
  type Result,
} from '@chartnexus/schema';

/** Static SVG only; rendering has no browser interaction or arbitrary callbacks. */
export function renderSvg(
  input: unknown,
  settings: {
    width?: number;
    height?: number;
    registry?: DataRegistry;
    maps?: MapRegistry;
    chatPresentation?: ChatPresentationSettings;
  } = {},
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
  const chat =
    settings.chatPresentation === undefined
      ? undefined
      : compileChatChart(
          input,
          { ...settings.chatPresentation, width, height, target: 'svg' },
          settings.registry,
          mapCatalog(settings.maps),
        );
  if (chat && !chat.ok) return chat;
  const compiled = chat
    ? { ok: true as const, value: chat.value.plan }
    : compileChart(input, settings.registry, mapCatalog(settings.maps));
  if (!compiled.ok) return compiled;
  const registered = registerPlanMap(compiled.value, settings.maps);
  if (!registered.ok) return registered;
  let chart: echarts.ECharts | undefined;
  try {
    chart = echarts.init(null, undefined, {
      renderer: 'svg',
      ssr: true,
      width,
      height,
    });
    chart.setOption(renderOption(compiled.value), { notMerge: true });
    const rawSvg = chart.renderToSVGString();
    const escape = (text: string) =>
      text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
    const accessible = compiled.value.accessibility;
    const svg = accessible
      ? rawSvg.replace(
          /(<svg[^>]*>)/,
          `$1<title>${escape(accessible.summary)}</title><metadata id="chartnexus-data">${escape(JSON.stringify(accessible))}</metadata>`,
        )
      : rawSvg;
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
