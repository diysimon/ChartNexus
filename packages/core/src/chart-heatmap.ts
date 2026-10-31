import {
  failure,
  type ChartDocument02,
  type DataRegistry,
  type JsonValue,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { record } from './guard.js';
import { checkTable } from './data.js';
export function compileHeatmap(
  doc: ChartDocument02,
  registry: DataRegistry,
  compileChart02: (
    input: unknown,
    registry?: DataRegistry,
  ) => Result<RenderPlan>,
): Result<RenderPlan> {
  const chart = doc.chart;
  const heatmap = chart.heatmap;
  if (
    !heatmap ||
    chart.encoding.x.type !== 'ordinal' ||
    chart.encoding.y.type !== 'ordinal' ||
    chart.encoding.x.temporalKind !== undefined ||
    chart.encoding.y.unit !== undefined ||
    chart.encoding.series !== undefined ||
    chart.secondary !== undefined ||
    chart.sort !== undefined ||
    chart.aggregate !== undefined ||
    chart.stack !== undefined ||
    chart.orientation !== undefined ||
    chart.area !== undefined ||
    chart.donut !== undefined ||
    doc.presentation?.legend !== undefined ||
    doc.presentation?.dataLabels !== undefined
  )
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart',
      'Heatmap requires two categorical axes and a color field; grouping, transforms and label/legend overrides are not supported.',
    );
  const xField = chart.encoding.x.field,
    yField = chart.encoding.y.field,
    valueField = heatmap.field;
  if (new Set([xField, yField, valueField]).size !== 3)
    return failure(
      'INVALID_ENCODING',
      '/chart/heatmap/field',
      'Heatmap requires three distinct fields.',
    );
  if (
    !(heatmap.min < heatmap.max) ||
    !Number.isFinite(heatmap.max - heatmap.min)
  )
    return failure(
      'INVALID_DATA',
      '/chart/heatmap',
      'Heatmap color range must be finite with min less than max.',
    );
  let table: unknown = doc.data;
  let revision = 'inline';
  if (doc.data.kind === 'reference') {
    const entry = Object.hasOwn(registry, doc.data.id)
      ? registry[doc.data.id]
      : undefined;
    if (!entry)
      return failure(
        'DATA_NOT_FOUND',
        '/data/id',
        'Data reference is not registered by the host.',
      );
    if (entry.revision !== doc.data.revision)
      return failure(
        'REVISION_CONFLICT',
        '/data/revision',
        'Registered data revision differs from requested revision.',
      );
    table = entry.table;
    revision = entry.revision;
  }
  const checked = checkTable(table);
  if (!checked.ok) return checked;
  if (
    ![xField, yField, valueField].every((field) =>
      checked.value.fields.includes(field),
    )
  )
    return failure(
      'UNKNOWN_FIELD',
      '/chart/heatmap',
      'Heatmap fields must be declared in the data.',
    );
  const xs: string[] = [],
    ys: string[] = [],
    points: JsonValue[] = [],
    rowIndices: number[] = [];
  const xIndex = new Map<string, number>(),
    yIndex = new Map<string, number>(),
    pairs = new Set<string>();
  for (const [index, row] of checked.value.rows.entries()) {
    const xv = row[xField],
      yv = row[yField],
      value = row[valueField];
    if (
      typeof xv !== 'string' ||
      typeof yv !== 'string' ||
      (value !== null && typeof value !== 'number')
    )
      return failure(
        'INVALID_DATA',
        `/data/rows/${index}`,
        'Heatmap categories must be strings and values numeric or null.',
      );
    const key = JSON.stringify([xv, yv]);
    if (pairs.has(key))
      return failure(
        'AMBIGUOUS_DATA',
        `/data/rows/${index}`,
        'Duplicate heatmap cell requires explicit upstream aggregation.',
      );
    pairs.add(key);
    if (!xIndex.has(xv)) {
      xIndex.set(xv, xs.length);
      xs.push(xv);
    }
    if (!yIndex.has(yv)) {
      yIndex.set(yv, ys.length);
      ys.push(yv);
    }
    if (value !== null) {
      if (
        typeof value !== 'number' ||
        value < heatmap.min ||
        value > heatmap.max
      )
        return failure(
          'INVALID_DATA',
          `/data/rows/${index}`,
          'Heatmap values must be within the declared range.',
        );
      points.push([xIndex.get(xv)!, yIndex.get(yv)!, value]);
      rowIndices.push(index);
    }
  }
  const template = compileChart02({
    schemaVersion: '0.2',
    id: doc.id,
    mode: 'intent',
    data: { kind: 'inline', fields: ['x', 'y'], rows: [] },
    chart: {
      type: 'scatter',
      ...(chart.title !== undefined ? { title: chart.title } : {}),
      encoding: {
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      },
    },
    ...(doc.presentation ? { presentation: doc.presentation } : {}),
  });
  if (!template.ok) return template;
  const option = template.value.option;
  const xAxis = record(option.xAxis) ? option.xAxis : {};
  const yAxis = record(option.yAxis) ? option.yAxis : {};
  option.xAxis = { ...xAxis, type: 'category', name: xField, data: xs };
  option.yAxis = { ...yAxis, type: 'category', name: yField, data: ys };
  option.series = [
    { id: 'series:heatmap', name: valueField, type: 'heatmap', data: points },
  ];
  option.legend = { show: false };
  option.grid = { ...(record(option.grid) ? option.grid : {}), bottom: 95 };
  option.visualMap = {
    type: 'continuous',
    min: heatmap.min,
    max: heatmap.max,
    orient: 'horizontal',
    left: 'center',
    bottom: 0,
    calculable: false,
    inRange: { color: ['#e0f2fe', '#0369a1', '#082f49'] },
    ...(doc.presentation?.theme?.id === 'dark'
      ? { textStyle: { color: '#f3f4f6' } }
      : {}),
  };
  return {
    ok: true,
    value: {
      ...template.value,
      dataRevision: revision,
      rowIndices: [rowIndices],
    },
  };
}
