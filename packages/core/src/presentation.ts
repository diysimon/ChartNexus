import {
  failure,
  type ChartAccessibility,
  type DataRegistry,
  type JsonValue,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { record, limits } from './guard.js';
import { resolveTable } from './data.js';

export const themeTokens = {
  light: {
    surface: '#ffffff',
    text: '#172033',
    secondary: '#475569',
    axis: '#64748b',
    grid: '#e2e8f0',
    tooltip: '#ffffff',
    colors: ['#2563eb', '#b45309', '#047857', '#be185d'],
  },
  dark: {
    surface: '#111827',
    text: '#f3f4f6',
    secondary: '#cbd5e1',
    axis: '#94a3b8',
    grid: '#334155',
    tooltip: '#1f2937',
    colors: ['#60a5fa', '#fbbf24', '#34d399', '#f472b6'],
  },
} as const;

export function describeChart(
  doc: Record<string, JsonValue>,
  plan: RenderPlan,
  registry?: DataRegistry,
): ChartAccessibility | undefined {
  if (
    !record(doc.data) ||
    typeof doc.data.kind !== 'string' ||
    !record(doc.chart)
  )
    return undefined;
  const source =
    doc.data.kind === 'reference' &&
    typeof doc.data.id === 'string' &&
    typeof doc.data.revision === 'string'
      ? { kind: 'reference', id: doc.data.id, revision: doc.data.revision }
      : { ...doc.data, kind: doc.data.kind };
  const table = resolveTable(source, registry);
  if (!table.ok) return undefined;
  const fields = table.value.table.fields;
  const columns = [...fields];
  const encoding = record(doc.chart.encoding) ? doc.chart.encoding : {};
  for (const item of [encoding.y, doc.chart.secondary]) {
    if (!record(item) || typeof item.field !== 'string' || !record(item.unit))
      continue;
    const index = fields.indexOf(item.field);
    if (index < 0) continue;
    const unit = item.unit;
    columns[index] =
      `${item.field} (${unit.kind === 'currency' ? unit.code : unit.kind === 'percent' ? (unit.scale === 'ratio' ? 'ratio' : '%') : unit.label})`;
  }
  const keyField = doc.data.keyField;
  const title =
    typeof doc.chart.title === 'string' ? `${doc.chart.title}. ` : '';
  const scale = record(doc.chart.heatmap)
    ? ` Color range: ${String(doc.chart.heatmap.min)} to ${String(doc.chart.heatmap.max)}.`
    : '';
  const aggregate = record(doc.chart.aggregate)
    ? ` Aggregation: ${String(doc.chart.aggregate.op)}; table contains original source rows.`
    : '';
  const renderedRows: (string | number | boolean | null)[][] = [];
  const series = Array.isArray(plan.option.series) ? plan.option.series : [];
  const axis =
    record(plan.option.xAxis) && Array.isArray(plan.option.xAxis.data)
      ? plan.option.xAxis.data
      : [];
  for (const [si, item] of series.entries()) {
    if (!record(item) || !Array.isArray(item.data)) continue;
    for (const [di, point] of item.data.entries()) {
      const value = record(point)
        ? point.value
        : Array.isArray(point)
          ? point.at(-1)
          : point;
      const category = record(point)
        ? point.name
        : Array.isArray(point)
          ? JSON.stringify(point.slice(0, -1))
          : (axis[di] ?? di);
      const source = plan.rowIndices[si]?.[di];
      const aggregate = plan.aggregatePoints?.[si]?.[di];
      renderedRows.push([
        String(item.name ?? ''),
        typeof category === 'string' || typeof category === 'number'
          ? category
          : JSON.stringify(category),
        typeof value === 'number' || value === null
          ? value
          : JSON.stringify(value ?? null),
        source === undefined || source < 0
          ? null
          : typeof keyField === 'string'
            ? String(table.value.table.rows[source]?.[keyField])
            : source,
        aggregate ? JSON.stringify(aggregate) : null,
      ]);
    }
  }
  return {
    summary: `${title}${String(doc.chart.type)} chart; ${table.value.table.rows.length} source rows.${aggregate}${scale}${plan.dataState === 'no-share' ? ' No shares: all values are zero.' : ''}`,
    columns,
    rendered: {
      columns: [
        'Series',
        'Category / coordinates',
        'Value',
        'Source',
        'Aggregation',
      ],
      rows: renderedRows,
    },
    rows: table.value.table.rows.map((row) =>
      fields.map((field) => row[field] ?? null),
    ),
    ...(typeof keyField === 'string'
      ? {
          sourceKeys: table.value.table.rows.map((row) =>
            String(row[keyField]),
          ),
        }
      : {}),
  };
}
export interface PresentationContext {
  width: number;
  height: number;
  target?: 'browser' | 'svg';
  theme?: 'light' | 'dark';
}
/** Pure bounded layout. Conservative text budgets favor an explicit alternative over overlap. */
export function resolvePresentation(
  source: RenderPlan,
  context: PresentationContext,
): Result<RenderPlan> {
  const { width, height } = context;
  if (
    ![width, height].every(
      (n) => Number.isFinite(n) && n > 0 && n <= limits.dimension,
    )
  )
    return failure(
      'INVALID_SIZE',
      '/presentation',
      'Dimensions must be positive and at most 4096.',
    );
  const plan: RenderPlan = JSON.parse(JSON.stringify(source));
  const option = plan.option;
  plan.presentationVersion = '1';
  const series = Array.isArray(option.series)
    ? option.series.filter(record)
    : [];
  const legend = record(option.legend) ? option.legend : {};
  const itemLegend = series.some(
    (item) =>
      item.type === 'pie' || item.type === 'funnel' || item.type === 'radar',
  );
  const names =
    legend.show === false
      ? []
      : itemLegend
        ? series.flatMap((item) =>
            Array.isArray(item.data)
              ? item.data.flatMap((point) =>
                  record(point) && typeof point.name === 'string'
                    ? [point.name]
                    : [],
                )
              : [],
          )
        : series.map((item) => String(item.name ?? ''));
  const legendRowWidth = names.reduce(
    (sum, name) => sum + Math.min(width - 32, [...name].length * 14 + 36),
    0,
  );
  const legendHeight = names.length
    ? Math.ceil(legendRowWidth / Math.max(1, width - 32)) * 26
    : 0;
  const title = record(option.title) ? option.title : {};
  const titleHeight =
    title.show === false
      ? 8
      : Math.min(
          48,
          Math.ceil(
            ([...String(title.text ?? '')].length * 18) /
              Math.max(1, width - 32),
          ) * 24,
        ) +
        (title.subtext ? 26 : 0) +
        8;
  const scaleHeight = record(option.visualMap) ? 62 : 0;
  const dual = Array.isArray(option.yAxis) && option.yAxis.length > 1;
  const diagram = series.some((item) =>
    ['radar', 'tree', 'sankey'].includes(String(item.type)),
  );
  function visibleNodes(value: JsonValue): number {
    if (!record(value)) return 0;
    return (
      1 +
      (value.collapsed === true || !Array.isArray(value.children)
        ? 0
        : value.children.reduce<number>(
            (n, child) => n + visibleNodes(child),
            0,
          ))
    );
  }
  const crowded = series.some(
    (item) =>
      Array.isArray(item.data) &&
      (item.type === 'sankey'
        ? item.data.length > Math.max(8, Math.floor((height - 80) / 16))
        : item.type === 'tree'
          ? item.data.reduce<number>((n, root) => n + visibleNodes(root), 0) >
            Math.max(8, Math.floor((height - titleHeight - 40) / 20))
          : false),
  );
  const fallback =
    (diagram && width < 320) ||
    crowded ||
    width < 240 ||
    height < 240 ||
    (dual && width < 480) ||
    height - titleHeight - legendHeight - scaleHeight - 74 < 100;
  if (fallback) {
    if (context.target === 'svg')
      return failure(
        'EXPORT_LIMIT',
        '/presentation',
        'Increase export dimensions to fit required labels, legend and scales.',
      );
    const message =
      'Chart needs more space. Full data is available in the table.';
    plan.notices = [
      ...(plan.notices ?? []),
      {
        code: 'LAYOUT_FALLBACK',
        severity: 'info',
        path: '/presentation',
        message,
      },
    ];
    plan.option = {
      animation: false,
      backgroundColor: option.backgroundColor ?? 'transparent',
      title: {
        text: 'Table view',
        subtext: 'Open full data below',
        textStyle: { color: themeTokens[context.theme ?? 'light'].text },
        subtextStyle: {
          color: themeTokens[context.theme ?? 'light'].secondary,
        },
      },
      series: [],
    };
    return { ok: true, value: plan };
  }
  const bottom = legendHeight + scaleHeight + 56;
  option.grid = {
    left: dual ? 72 : 56,
    right: dual ? 72 : 24,
    top: titleHeight + 18,
    bottom,
    containLabel: true,
  };
  option.title = {
    ...title,
    left: 8,
    top: 4,
    textStyle: {
      ...(record(title.textStyle) ? title.textStyle : {}),
      width: width - 24,
      overflow: 'truncate',
      fontSize: 16,
    },
    subtextStyle: {
      ...(record(title.subtextStyle) ? title.subtextStyle : {}),
      width: width - 24,
      overflow: 'truncate',
    },
  };
  option.legend = {
    ...legend,
    type: 'plain',
    left: 8,
    right: 8,
    bottom: scaleHeight + 4,
    itemWidth: 16,
    itemHeight: 10,
    itemGap: 12,
    textStyle: {
      ...(record(legend.textStyle) ? legend.textStyle : {}),
      width: Math.min(120, width - 70),
      overflow: 'truncate',
    },
    tooltip: { show: true },
  };
  for (const axisName of ['xAxis', 'yAxis']) {
    const update = (axis: JsonValue): JsonValue => {
      if (!record(axis)) return axis;
      return {
        ...axis,
        nameTruncate: { maxWidth: Math.max(80, width / 3), ellipsis: '…' },
        axisLabel: {
          ...(record(axis.axisLabel) ? axis.axisLabel : {}),
          width:
            axisName === 'xAxis'
              ? Math.min(80, Math.max(32, (width - 100) / 4))
              : 64,
          overflow: 'truncate',
          hideOverlap: true,
        },
      };
    };
    const axis = option[axisName];
    if (Array.isArray(axis)) option[axisName] = axis.map(update);
    else if (axis !== undefined) option[axisName] = update(axis);
  }
  if (record(option.radar))
    option.radar = {
      ...option.radar,
      center: [
        width / 2,
        titleHeight + 30 + (height - bottom - titleHeight - 30) / 2,
      ],
      radius: Math.max(
        24,
        Math.min(width / 2 - 100, (height - bottom - titleHeight) / 2 - 35),
      ),
      axisName: {
        ...(record(option.radar.axisName) ? option.radar.axisName : {}),
        width: Math.min(88, width / 5),
        overflow: 'truncate',
      },
    };
  let limited = false;
  option.series = series.map((item) => {
    const dense =
      Array.isArray(item.data) &&
      item.data.length > Math.max(4, Math.floor((width - 80) / 55));
    if (dense && record(item.label) && item.label.show === true) limited = true;
    return {
      ...item,
      ...(item.type === 'pie'
        ? {
            center: [
              '50%',
              `${((titleHeight + (height - bottom - titleHeight) / 2) / height) * 100}%`,
            ],
            radius: item.radius ? ['28%', '45%'] : '45%',
            labelLine: { show: false },
          }
        : {}),
      ...(['tree', 'sankey', 'map'].includes(String(item.type))
        ? {
            top: titleHeight + 24,
            bottom: legendHeight + scaleHeight + 24,
            left: item.type === 'tree' ? 80 : 24,
            right: item.type === 'map' ? 24 : 112,
            label: {
              ...(record(item.label) ? item.label : {}),
              overflow: 'truncate',
              width: 88,
            },
          }
        : {}),
      ...(item.type === 'funnel'
        ? {
            top: titleHeight + 12,
            bottom: bottom - 32,
            left: '15%',
            width: '70%',
          }
        : {}),
      ...(dense
        ? { label: { ...(record(item.label) ? item.label : {}), show: false } }
        : {}),
    };
  });
  if (limited)
    plan.notices = [
      ...(plan.notices ?? []),
      {
        code: 'LABEL_DENSITY_LIMIT',
        severity: 'info',
        path: '/presentation/dataLabels',
        message: 'Dense labels are available in the full data table.',
      },
    ];
  if (record(option.visualMap))
    option.visualMap = {
      ...option.visualMap,
      itemWidth: 14,
      itemHeight: Math.min(140, width - 100),
      bottom: 0,
    };
  return { ok: true, value: plan };
}
