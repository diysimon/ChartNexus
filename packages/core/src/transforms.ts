import { applyLegacyPresentation } from './presentation-legacy.js';
import {
  failure,
  type ChartDocument02,
  type DataRegistry,
  type JsonValue,
  type RenderPlan,
  type Result,
  type AggregatePoint,
} from '@chartnexus/schema';
import { record } from './guard.js';
import { compileChart01 } from './legacy.js';
import { checkTable } from './data.js';
import { temporalMilliseconds } from './temporal.js';
export function compileTransformed(
  doc: ChartDocument02,
  registry: DataRegistry,
): Result<RenderPlan> {
  const {
    orientation,
    area,
    donut,
    sort,
    aggregate,
    encoding,
    secondary: _secondary,
    heatmap: _heatmap,
    ...chartOptions
  } = doc.chart;
  void _secondary;
  void _heatmap;
  const { unit, ...y } = encoding.y;
  const { temporalKind, ...x } = encoding.x;
  const temporal = x.type === 'temporal';
  if (
    (temporal &&
      (temporalKind === undefined || chartOptions.type !== 'line')) ||
    (!temporal && temporalKind !== undefined)
  )
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart/encoding/x',
      'Temporal encoding is supported only for line charts and requires an explicit temporalKind.',
    );
  const chart = {
    ...chartOptions,
    encoding: {
      ...encoding,
      x: { ...x, type: temporal ? 'ordinal' : x.type },
      y,
    },
  };
  if (unit && chart.type === 'pie')
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart/encoding/y/unit',
      'Units are not yet supported for pie charts.',
    );
  if (
    (orientation === 'horizontal' && chart.type !== 'bar') ||
    (area && chart.type !== 'line') ||
    (donut && chart.type !== 'pie')
  )
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart',
      'Horizontal requires bar, area requires line, and donut requires pie.',
    );
  let compiledData: unknown = doc.data;
  let aggregateRevision = 'inline';
  let aggregateMetadata: AggregatePoint[] | undefined;
  if (aggregate) {
    if (chart.type === 'scatter' || (aggregate.op === 'count' && unit))
      return failure(
        'UNSUPPORTED_CAPABILITY',
        '/chart/aggregate',
        'Aggregation is unavailable for scatter; count cannot retain a value unit.',
      );
    let input: unknown = doc.data;
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
      input = entry.table;
      aggregateRevision = entry.revision;
    }
    const checked = checkTable(input);
    if (!checked.ok) return checked;
    const categoryField = chart.encoding.x.field;
    const valueField = chart.encoding.y.field;
    const groupField = chart.encoding.series?.field;
    if (
      categoryField === valueField ||
      (groupField &&
        (groupField === categoryField || groupField === valueField))
    )
      return failure(
        'INVALID_ENCODING',
        '/chart/encoding',
        'Aggregation requires distinct category, value and series fields.',
      );
    for (const field of [
      categoryField,
      valueField,
      ...(groupField ? [groupField] : []),
    ])
      if (!checked.value.fields.includes(field))
        return failure(
          'UNKNOWN_FIELD',
          '/chart/encoding',
          'An encoded field is not declared in the data fields.',
        );
    const groups = new Map<
      string,
      {
        category: string;
        series: string | null;
        count: number;
        nonNull: number;
        sum: number;
      }
    >();
    for (const [index, row] of checked.value.rows.entries()) {
      const category = row[categoryField];
      const value = row[valueField];
      const series = groupField ? row[groupField] : null;
      if (
        typeof category !== 'string' ||
        (series !== null && typeof series !== 'string') ||
        (groupField && series === null) ||
        (value !== null && typeof value !== 'number')
      )
        return failure(
          'INVALID_DATA',
          `/data/rows/${index}`,
          'Aggregate inputs require a string category and series and numeric or null values.',
        );
      const key = JSON.stringify([category, series]);
      let bucket = groups.get(key);
      if (!bucket) {
        bucket = { category, series, count: 0, nonNull: 0, sum: 0 };
        groups.set(key, bucket);
      }
      bucket.count++;
      if (typeof value === 'number') {
        bucket.nonNull++;
        if (aggregate.op !== 'count') {
          bucket.sum += value;
          if (!Number.isFinite(bucket.sum))
            return failure(
              'INVALID_DATA',
              `/data/rows/${index}`,
              'Aggregation exceeds finite numeric range.',
            );
        }
      }
    }
    aggregateMetadata = [];
    const rows = [...groups.values()].map((bucket) => {
      const value =
        aggregate.op === 'count'
          ? bucket.nonNull
          : bucket.nonNull === 0
            ? null
            : aggregate.op === 'mean'
              ? bucket.sum / bucket.nonNull
              : bucket.sum;
      aggregateMetadata!.push({
        operation: aggregate.op,
        category: bucket.category,
        series: bucket.series,
        sourceCount: bucket.count,
        nonNullCount: bucket.nonNull,
      });
      return {
        [categoryField]: bucket.category,
        [valueField]: value,
        ...(groupField ? { [groupField]: bucket.series } : {}),
      };
    });
    compiledData = {
      kind: 'inline',
      fields: [categoryField, valueField, ...(groupField ? [groupField] : [])],
      rows,
    };
  }
  const oldDoc = {
    schemaVersion: '0.1',
    id: doc.id,
    mode: 'intent',
    data: compiledData,
    chart,
  };
  const result = compileChart01(oldDoc, registry);
  if (!result.ok) return result;
  const option = result.value.option;
  const temporalValues = new Map<string, number>();
  if (temporal) {
    const axis = option.xAxis;
    if (!record(axis) || !Array.isArray(axis.data))
      return failure(
        'INVALID_DATA',
        '/chart/encoding/x',
        'A temporal axis is required.',
      );
    const seen = new Map<number, string>();
    for (const value of axis.data) {
      if (typeof value !== 'string')
        return failure(
          'INVALID_DATA',
          '/chart/encoding/x',
          'Temporal values must be strings.',
        );
      const timestamp = temporalMilliseconds(value, temporalKind!);
      if (timestamp === undefined)
        return failure(
          'INVALID_DATA',
          '/chart/encoding/x',
          'Invalid or unsupported date or offset-bearing instant.',
        );
      const previous = seen.get(timestamp);
      if (previous !== undefined && previous !== value)
        return failure(
          'AMBIGUOUS_DATA',
          '/chart/encoding/x',
          'Different temporal values represent the same instant.',
        );
      seen.set(timestamp, value);
      temporalValues.set(value, timestamp);
    }
  }
  if (sort) {
    if (
      chart.type === 'scatter' ||
      (sort.by === 'value' && chart.encoding.series)
    )
      return failure(
        'UNSUPPORTED_CAPABILITY',
        '/chart/sort',
        'Scatter sorting and grouped value sorting are not supported.',
      );
    const series = option.series;
    if (!Array.isArray(series))
      return failure('INVALID_DATA', '/chart/sort', 'Expected chart series.');
    const axis = option.xAxis;
    const first = series[0];
    const firstData: JsonValue[] =
      record(first) && Array.isArray(first.data) ? first.data : [];
    const categories: (JsonValue | undefined)[] =
      chart.type === 'pie'
        ? firstData.map((item) => (record(item) ? item.name : undefined))
        : record(axis) && Array.isArray(axis.data)
          ? axis.data
          : [];
    const entries = categories.map((category, index) => {
      const item = firstData[index];
      const value = chart.type === 'pie' && record(item) ? item.value : item;
      return { category, value, index };
    });
    if (
      entries.some(
        (entry) =>
          typeof entry.category !== 'string' ||
          (sort.by === 'value' &&
            entry.value !== null &&
            typeof entry.value !== 'number'),
      )
    )
      return failure(
        'INVALID_DATA',
        '/chart/sort',
        'Sort values must have a consistent supported type.',
      );
    entries.sort((a, b) => {
      const left =
        sort.by === 'category'
          ? temporal && typeof a.category === 'string'
            ? temporalValues.get(a.category)
            : a.category
          : a.value;
      const right =
        sort.by === 'category'
          ? temporal && typeof b.category === 'string'
            ? temporalValues.get(b.category)
            : b.category
          : b.value;
      if (left === null || right === null) {
        if (left === right) return a.index - b.index;
        return (left === null ? -1 : 1) * (sort.nulls === 'first' ? 1 : -1);
      }
      const comparison =
        typeof left === 'number' && typeof right === 'number'
          ? left < right
            ? -1
            : left > right
              ? 1
              : 0
          : typeof left === 'string' && typeof right === 'string'
            ? left < right
              ? -1
              : left > right
                ? 1
                : 0
            : 0;
      return (
        (sort.order === 'ascending' ? comparison : -comparison) ||
        a.index - b.index
      );
    });
    if (chart.type !== 'pie' && record(axis))
      axis.data = entries.map((entry) => entry.category!);
    option.series = series.map((item) => {
      if (!record(item) || !Array.isArray(item.data)) return item;
      const data = item.data;
      return { ...item, data: entries.map((entry) => data[entry.index]!) };
    });
    result.value.rowIndices = result.value.rowIndices.map((indices) =>
      entries.map((entry) => indices[entry.index] ?? -1),
    );
  }
  if (aggregate && aggregateMetadata) {
    result.value.dataRevision = aggregateRevision;
    result.value.aggregatePoints = result.value.rowIndices.map((indices) =>
      indices.map((index) =>
        index < 0 ? null : (aggregateMetadata![index] ?? null),
      ),
    );
    result.value.rowIndices = result.value.rowIndices.map((indices) =>
      indices.map(() => -1),
    );
    if (aggregate.op === 'count' && record(option.yAxis))
      option.yAxis.name = `count(${chart.encoding.y.field})`;
  }
  if (temporal) {
    const axis = option.xAxis;
    const series = option.series;
    if (!record(axis) || !Array.isArray(axis.data) || !Array.isArray(series))
      return failure(
        'INVALID_DATA',
        '/chart/encoding/x',
        'A date axis is required.',
      );
    const times = axis.data.map((date) =>
      typeof date === 'string' ? temporalValues.get(date)! : NaN,
    );
    option.xAxis = {
      type: 'time',
      name: chart.encoding.x.field,
      nameLocation: 'middle',
      nameGap: 28,
    };
    option.useUTC = true;
    option.series = series.map((item) => {
      if (!record(item) || !Array.isArray(item.data)) return item;
      return {
        ...item,
        data: item.data.map((value, index) => [times[index]!, value]),
      };
    });
  }
  if (unit) {
    const axis = option.yAxis;
    if (!record(axis))
      return failure(
        'INVALID_DATA',
        '/chart/encoding/y/unit',
        'A quantitative axis is required.',
      );
    const label =
      unit.kind === 'currency'
        ? unit.code
        : unit.kind === 'percent'
          ? unit.scale === 'percent'
            ? '%'
            : 'ratio'
          : unit.label;
    axis.name = `${chart.encoding.y.field} (${label})`;
  }
  if (orientation === 'horizontal') {
    const x = option.xAxis;
    const y = option.yAxis;
    if (x === undefined || y === undefined)
      return failure(
        'INVALID_SCHEMA',
        '/chart',
        'Horizontal bars require axes.',
      );
    option.xAxis = y;
    option.yAxis = x;
  }
  if (Array.isArray(option.series)) {
    option.series = option.series.map((series) =>
      record(series)
        ? {
            ...series,
            ...(area ? { areaStyle: {} } : {}),
            ...(donut ? { radius: ['40%', '70%'] } : {}),
          }
        : series,
    );
  }
  applyLegacyPresentation(doc, option);
  return { ok: true, value: { ...result.value, profile: 'basic-0.2' } };
}
