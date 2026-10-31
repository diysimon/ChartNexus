import {
  describeChart,
  resolvePresentation,
  themeTokens,
} from './presentation.js';
import {
  failure,
  type DataRegistry,
  type MapCatalog,
  type JsonValue,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { compileChart } from './index.js';
import { inspectJson, record } from './guard.js';

export interface ChatPresentationSettings {
  theme?: 'light' | 'dark';
  detailLevel?:
    | 'minimal'
    | 'simple'
    | 'standard'
    | 'detailed'
    | 'comprehensive';
  background?: 'transparent' | 'theme';
  width?: number;
  height?: number;
  target?: 'browser' | 'svg';
}
export interface ChatRenderPlan {
  plan: RenderPlan;
  adjustments: ('REQUIRED_LEGEND' | 'LABEL_DENSITY_LIMIT')[];
}

/** Host-owned presentation for 0.2 charts; no source values or identity are modified. */
export function compileChatChart(
  input: unknown,
  settings: ChatPresentationSettings = {},
  registry?: DataRegistry,
  maps?: MapCatalog,
): Result<ChatRenderPlan> {
  const checked = inspectJson({ document: input, settings });
  if (!checked.ok) return checked;
  const value = checked.value;
  if (!record(value) || !record(value.document) || !record(value.settings))
    return failure(
      'INVALID_ARGUMENTS',
      '',
      'Expected a document and presentation settings.',
    );
  const doc = value.document,
    config = value.settings;
  if (
    Object.keys(config).some(
      (key) =>
        ![
          'theme',
          'detailLevel',
          'background',
          'width',
          'height',
          'target',
        ].includes(key),
    ) ||
    (config.theme !== undefined &&
      (typeof config.theme !== 'string' ||
        !['light', 'dark'].includes(config.theme))) ||
    (config.detailLevel !== undefined &&
      (typeof config.detailLevel !== 'string' ||
        ![
          'minimal',
          'simple',
          'standard',
          'detailed',
          'comprehensive',
        ].includes(config.detailLevel))) ||
    (config.background !== undefined &&
      (typeof config.background !== 'string' ||
        !['transparent', 'theme'].includes(config.background)))
  )
    return failure(
      'INVALID_ARGUMENTS',
      '/settings',
      'Unsupported chat presentation settings.',
    );
  if (
    (config.width !== undefined && typeof config.width !== 'number') ||
    (config.height !== undefined && typeof config.height !== 'number') ||
    (config.target !== undefined &&
      !['browser', 'svg'].includes(String(config.target)))
  )
    return failure(
      'INVALID_ARGUMENTS',
      '/settings',
      'Invalid dimensions or target.',
    );
  if (
    !['0.2', '0.3'].includes(String(doc.schemaVersion)) ||
    doc.mode !== 'intent'
  )
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/schemaVersion',
      'Chat presentation requires a 0.2 or 0.3 intent document.',
    );
  const compiled = compileChart(doc, registry, maps);
  if (!compiled.ok) return compiled;
  const option = compiled.value.option;
  const presentation = record(doc.presentation) ? doc.presentation : {};
  const docTheme =
    record(presentation.theme) && typeof presentation.theme.id === 'string'
      ? presentation.theme.id
      : typeof presentation.theme === 'string'
        ? presentation.theme
        : undefined;
  const dark = (config.theme ?? docTheme ?? 'light') === 'dark';
  const level = config.detailLevel ?? presentation.detailLevel ?? 'standard';
  const tokens = themeTokens[dark ? 'dark' : 'light'];
  const foreground = tokens.text,
    line = tokens.axis,
    grid = tokens.grid;
  option.backgroundColor =
    config.background === 'theme'
      ? dark
        ? '#111827'
        : '#ffffff'
      : 'transparent';
  option.color = dark
    ? ['#60a5fa', '#fbbf24', '#34d399', '#f472b6']
    : ['#2563eb', '#b45309', '#047857', '#be185d'];
  option.textStyle = { color: foreground };
  if (record(option.title))
    option.title = {
      ...option.title,
      show:
        level !== 'minimal' ||
        compiled.value.dataState === 'no-share' ||
        Boolean(compiled.value.treeState),
      ...(level === 'minimal' && compiled.value.dataState === 'no-share'
        ? { text: '' }
        : {}),
      textStyle: { color: foreground },
      subtextStyle: { color: foreground },
    };
  const chart = record(doc.chart) ? doc.chart : {};
  const userLegend =
    record(presentation.legend) && typeof presentation.legend.show === 'boolean'
      ? presentation.legend.show
      : undefined;
  const userLabels =
    record(presentation.dataLabels) &&
    typeof presentation.dataLabels.show === 'boolean'
      ? presentation.dataLabels.show
      : undefined;
  const series = Array.isArray(option.series) ? option.series : [];
  const requiresLegend =
    chart.type !== 'heatmap' &&
    (series.length > 1 ||
      chart.type === 'pie' ||
      chart.type === 'funnel' ||
      chart.type === 'radar');
  const legendVisible =
    requiresLegend ||
    (userLegend ?? (level !== 'minimal' && series.length > 1));
  const adjustments: ChatRenderPlan['adjustments'] = [];
  if (
    requiresLegend &&
    (userLegend === false || (userLegend === undefined && level === 'minimal'))
  )
    adjustments.push('REQUIRED_LEGEND');
  if (record(option.legend))
    option.legend = {
      ...option.legend,
      show: legendVisible,
      textStyle: { color: foreground },
    };
  const density = series.some(
    (item) => record(item) && Array.isArray(item.data) && item.data.length > 8,
  );
  const wantsDefaultLabels = level === 'detailed' || level === 'comprehensive';
  const labelsVisible =
    chart.type === 'heatmap'
      ? false
      : (userLabels ?? (wantsDefaultLabels && !density));
  if (
    chart.type !== 'heatmap' &&
    wantsDefaultLabels &&
    density &&
    userLabels === undefined
  )
    adjustments.push('LABEL_DENSITY_LIMIT');
  option.series = series.map((item) =>
    record(item)
      ? {
          ...item,
          label: {
            ...(record(item.label) ? item.label : {}),
            show:
              ['tree', 'sankey'].includes(String(chart.type)) || labelsVisible,
            color: foreground,
          },
        }
      : item,
  );
  if (record(option.radar))
    option.radar = {
      ...option.radar,
      axisName: { color: foreground },
      axisLine: { lineStyle: { color: line } },
      splitLine: { lineStyle: { color: line } },
    };
  option.series = (Array.isArray(option.series) ? option.series : []).map(
    (item) => {
      if (!record(item)) return item;
      if (item.type === 'tree') {
        const recolor = (value: JsonValue): JsonValue =>
          record(value)
            ? {
                ...value,
                label: {
                  ...(record(value.label) ? value.label : {}),
                  color: foreground,
                },
                ...(Array.isArray(value.children)
                  ? { children: value.children.map(recolor) }
                  : {}),
              }
            : value;
        return {
          ...item,
          data: Array.isArray(item.data) ? item.data.map(recolor) : [],
          lineStyle: { color: line },
          leaves: { label: { show: true, color: foreground } },
        };
      }
      if (item.type === 'map') {
        const missing = dark ? '#475569' : '#e2e8f0';
        return {
          ...item,
          itemStyle: { areaColor: missing, borderColor: line },
          label: {
            ...(record(item.label) ? item.label : {}),
            backgroundColor: tokens.surface,
            padding: [2, 4],
            borderRadius: 3,
          },
          data: Array.isArray(item.data)
            ? item.data.map((p) =>
                record(p) && p.value === null
                  ? { ...p, itemStyle: { areaColor: missing } }
                  : p,
              )
            : [],
        };
      }
      return item;
    },
  );
  for (const axisName of ['xAxis', 'yAxis']) {
    const updateAxis = (axis: JsonValue): JsonValue =>
      record(axis)
        ? {
            ...axis,
            nameTextStyle: { color: foreground },
            axisLabel: {
              color: foreground,
              ...(axis.type === 'category'
                ? { width: 80, overflow: 'truncate', hideOverlap: true }
                : {}),
              ...(level === 'comprehensive'
                ? { showMinLabel: true, showMaxLabel: true }
                : {}),
            },
            ...(axis.type === 'category' ? { tooltip: { show: true } } : {}),
            ...(level === 'comprehensive' ? { axisTick: { show: true } } : {}),
            axisLine: { lineStyle: { color: line } },
            splitLine: {
              show: level !== 'minimal' && level !== 'simple',
              lineStyle: { color: grid },
            },
          }
        : axis;
    const axis = option[axisName];
    if (Array.isArray(axis)) option[axisName] = axis.map(updateAxis);
    else if (axis !== undefined) option[axisName] = updateAxis(axis);
  }
  if (record(option.visualMap))
    option.visualMap = {
      ...option.visualMap,
      textStyle: { color: foreground },
      ...(chart.type === 'heatmap' &&
      typeof option.visualMap.min === 'number' &&
      typeof option.visualMap.max === 'number'
        ? { text: [String(option.visualMap.max), String(option.visualMap.min)] }
        : {}),
      ...(['heatmap', 'map'].includes(String(chart.type)) && dark
        ? { inRange: { color: ['#1d4ed8', '#38bdf8', '#e0f2fe'] } }
        : {}),
    };
  option.tooltip = {
    ...(record(option.tooltip) ? option.tooltip : {}),
    renderMode: 'richText',
    ...(level === 'comprehensive' &&
    ['bar', 'line', 'scatter', 'combo'].includes(String(chart.type))
      ? { trigger: 'axis' }
      : {}),
    backgroundColor: dark ? '#1f2937' : '#ffffff',
    borderColor: dark ? '#64748b' : '#cbd5e1',
    textStyle: { color: foreground },
  };
  const accessibility =
    compiled.value.accessibility ??
    describeChart(doc, compiled.value, registry);
  if (accessibility) compiled.value.accessibility = accessibility;
  compiled.value.interactionKey ??= JSON.stringify([
    chart.type,
    chart.encoding,
    chart.secondary ?? null,
  ]);
  const layout =
    config.width !== undefined || config.height !== undefined
      ? resolvePresentation(compiled.value, {
          width: typeof config.width === 'number' ? config.width : 800,
          height: typeof config.height === 'number' ? config.height : 480,
          target: config.target === 'svg' ? 'svg' : 'browser',
          theme: dark ? 'dark' : 'light',
        })
      : { ok: true as const, value: compiled.value };
  return layout.ok
    ? { ok: true, value: { plan: layout.value, adjustments } }
    : layout;
}
