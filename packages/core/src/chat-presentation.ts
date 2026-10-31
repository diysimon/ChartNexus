import {
  failure,
  type DataRegistry,
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
      (key) => !['theme', 'detailLevel', 'background'].includes(key),
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
  if (doc.schemaVersion !== '0.2' || doc.mode !== 'intent')
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/schemaVersion',
      'Chat presentation requires a 0.2 intent document.',
    );
  const compiled = compileChart(doc, registry);
  if (!compiled.ok) return compiled;
  const option = compiled.value.option;
  const presentation = record(doc.presentation) ? doc.presentation : {};
  const docTheme =
    record(presentation.theme) && typeof presentation.theme.id === 'string'
      ? presentation.theme.id
      : undefined;
  const dark = (config.theme ?? docTheme ?? 'light') === 'dark';
  const level = config.detailLevel ?? presentation.detailLevel ?? 'standard';
  const foreground = dark ? '#f3f4f6' : '#172033';
  const line = dark ? '#94a3b8' : '#64748b';
  const grid = dark ? '#334155' : '#e2e8f0';
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
      show: level !== 'minimal',
      textStyle: { color: foreground },
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
    (series.length > 1 || chart.type === 'pie' || chart.type === 'funnel');
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
      ? { ...item, label: { show: labelsVisible, color: foreground } }
      : item,
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
      ...(chart.type === 'heatmap' && dark
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
  return { ok: true, value: { plan: compiled.value, adjustments } };
}
