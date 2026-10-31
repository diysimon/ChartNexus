import capabilityManifest from './capabilities.json' with { type: 'json' };
import capability02Manifest from './capabilities-0.2.json' with { type: 'json' };
import nativeStrictManifest from './native-strict-capabilities.json' with { type: 'json' };
import { Ajv2020 } from 'ajv/dist/2020.js';
import {
  chartDocumentSchema,
  chartDocument02Schema,
  type ChartDocument02,
  type AggregatePoint,
  failure,
  type ChartDocument,
  type DataRegistry,
  type DataTable,
  type JsonValue,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { inspectJson, limits, record } from './guard.js';
import { nativeOption } from './native.js';
export { limits, inspectJson } from './guard.js';

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile<ChartDocument>(chartDocumentSchema);
const validate02 = ajv.compile<ChartDocument02>(chartDocument02Schema);
export const capabilities = Object.freeze(capabilityManifest);
export const capabilities02 = Object.freeze(capability02Manifest);
export const nativeStrictCapabilities = Object.freeze(nativeStrictManifest);

function validateChart01(input: unknown): Result<ChartDocument> {
  const json = inspectJson(input);
  if (!json.ok) return json;
  if (!validate(json.value))
    return {
      ok: false,
      diagnostics: (validate.errors ?? []).slice(0, 12).map((e) => ({
        code: 'INVALID_SCHEMA',
        severity: 'error',
        path: e.instancePath,
        message: e.message ?? 'Invalid document.',
        recoverable: true,
      })),
    };
  return { ok: true, value: json.value };
}

function checkTable(input: unknown): Result<DataTable> {
  const safe = inspectJson(input);
  if (!safe.ok) return safe;
  const table = safe.value;
  if (
    !record(table) ||
    !Array.isArray(table.fields) ||
    !Array.isArray(table.rows) ||
    table.fields.length === 0 ||
    table.fields.length > 100 ||
    table.rows.length > limits.rows
  )
    return failure(
      'INVALID_DATA',
      '/data',
      'Expected fields and bounded rows.',
    );
  const fields = table.fields;
  if (
    !fields.every(
      (f): f is string =>
        typeof f === 'string' && f.length > 0 && f.length <= 128,
    ) ||
    new Set(fields).size !== fields.length
  )
    return failure(
      'INVALID_DATA',
      '/data/fields',
      'Expected unique field names.',
    );
  const rows: Record<string, string | number | boolean | null>[] = [];
  for (const [index, row] of table.rows.entries()) {
    if (!record(row))
      return failure(
        'INVALID_DATA',
        `/data/rows/${index}`,
        'Expected an object row.',
      );
    const output: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(row)) {
      if (
        !fields.includes(key) ||
        (value !== null &&
          typeof value !== 'string' &&
          typeof value !== 'number' &&
          typeof value !== 'boolean')
      )
        return failure(
          'INVALID_DATA',
          `/data/rows/${index}`,
          'Rows must contain declared scalar fields.',
        );
      output[key] = value;
    }
    if (!fields.every((f) => Object.hasOwn(row, f)))
      return failure(
        'INVALID_DATA',
        `/data/rows/${index}`,
        'Missing fields must be represented explicitly as null.',
      );
    rows.push(output);
  }
  return { ok: true, value: { fields, rows } };
}

/** Host resolves references; core never accesses the network or model APIs. */
function compileChart01(
  input: unknown,
  registry: DataRegistry = {},
): Result<RenderPlan> {
  const validated = validateChart01(input);
  if (!validated.ok) return validated;
  const doc = validated.value;
  if (doc.mode === 'echarts') {
    const json = inspectJson(doc.option);
    if (!json.ok) return json;
    if (!record(json.value))
      return failure('INVALID_SCHEMA', '/option', 'Expected option object.');
    const native = nativeOption(json.value);
    if (!native.ok) return native;
    return {
      ok: true,
      value: {
        chartId: doc.id,
        dataRevision: 'inline',
        option: native.value,
        compilerVersion: '0.0.1',
        profile: 'basic-0.1',
        rowIndices: [],
      },
    };
  }
  let tableInput: unknown = doc.data;
  let dataRevision = 'inline';
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
    tableInput = entry.table;
    dataRevision = entry.revision;
  }
  const checked = checkTable(tableInput);
  if (!checked.ok) return checked;
  const { fields, rows } = checked.value;
  const { type, encoding, stack } = doc.chart;
  const x = encoding.x.field,
    y = encoding.y.field,
    group = encoding.series?.field;
  for (const field of [x, y, ...(group ? [group] : [])])
    if (!fields.includes(field))
      return failure(
        'UNKNOWN_FIELD',
        '/chart/encoding',
        'An encoded field is not declared in the data fields.',
      );
  if (
    encoding.y.type !== 'quantitative' ||
    encoding.x.type !== (type === 'scatter' ? 'quantitative' : 'ordinal')
  )
    return failure(
      'INVALID_ENCODING',
      '/chart/encoding',
      'Scatter requires quantitative x/y; other charts require ordinal x and quantitative y.',
    );
  if ((stack && type !== 'bar' && type !== 'line') || (group && type === 'pie'))
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart',
      'Stacking is limited to bar/line; grouped pie is not supported.',
    );
  const categories: string[] = [];
  const categorySet = new Set<string>();
  const groups = new Map<
    string,
    {
      indices: number[];
      values: JsonValue[];
      byCategory: Map<string, { value: JsonValue; index: number }>;
    }
  >();
  for (const [index, row] of rows.entries()) {
    const xv = row[x],
      yv = row[y],
      gv = group ? row[group] : '';
    if (
      typeof gv !== 'string' ||
      (type === 'scatter' ? typeof xv !== 'number' : typeof xv !== 'string') ||
      (yv !== null && typeof yv !== 'number')
    )
      return failure(
        'INVALID_DATA',
        `/data/rows/${index}`,
        'Encoded values do not match field types; no implicit conversion is performed.',
      );
    if (type === 'pie' && (typeof yv !== 'number' || yv < 0))
      return failure(
        'INVALID_DATA',
        `/data/rows/${index}`,
        'Pie values must be nonnegative numbers.',
      );
    let bucket = groups.get(gv);
    if (!bucket) {
      bucket = { indices: [], values: [], byCategory: new Map() };
      groups.set(gv, bucket);
    }
    if (groups.size > limits.series)
      return failure(
        'RESOURCE_LIMIT',
        '/chart/encoding/series',
        'Too many series.',
      );
    if (typeof xv === 'string') {
      if (bucket.byCategory.has(xv))
        return failure(
          'AMBIGUOUS_DATA',
          `/data/rows/${index}`,
          'Duplicate category within a series requires explicit upstream aggregation.',
        );
      if (!categorySet.has(xv)) {
        categories.push(xv);
        categorySet.add(xv);
      }
      bucket.byCategory.set(xv, { value: yv ?? null, index });
    }
    bucket.indices.push(index);
    bucket.values.push(
      type === 'scatter'
        ? [xv ?? null, yv ?? null]
        : { name: xv ?? '', value: yv ?? null },
    );
  }
  if (
    (type === 'bar' || type === 'line') &&
    categories.length * groups.size > limits.points
  )
    return failure(
      'RESOURCE_LIMIT',
      '/chart',
      'Expanded category/series grid exceeds the 50000 point budget.',
    );
  const rowIndices: number[][] = [];
  const series: JsonValue[] = [...groups.entries()].map(([name, bucket]) => {
    const categoryChart = type === 'bar' || type === 'line';
    rowIndices.push(
      categoryChart
        ? categories.map((c) => bucket.byCategory.get(c)?.index ?? -1)
        : bucket.indices,
    );
    return {
      id: `series:${name}`,
      name: name || y,
      type,
      ...(stack ? { stack: 'total' } : {}),
      data: categoryChart
        ? categories.map((c) => bucket.byCategory.get(c)?.value ?? null)
        : bucket.values,
    };
  });
  const option: Record<string, JsonValue> = {
    animation: false,
    title: { text: doc.chart.title ?? '' },
    tooltip: { renderMode: 'richText' },
    legend: { bottom: 4 },
    series,
  };
  if (type !== 'pie') {
    option.xAxis =
      type === 'scatter'
        ? { type: 'value', name: x, nameLocation: 'middle', nameGap: 28 }
        : {
            type: 'category',
            name: x,
            nameLocation: 'middle',
            nameGap: 28,
            data: categories,
          };
    option.yAxis = { type: 'value', name: y };
    option.grid = { containLabel: true, left: 32, right: 24, bottom: 64 };
  }
  return {
    ok: true,
    value: {
      chartId: doc.id,
      dataRevision,
      option,
      compilerVersion: '0.0.1',
      profile: 'basic-0.1',
      rowIndices,
    },
  };
}

/** Structural validation for the declared schema version; compileChart adds semantic checks. */
export function validateChart(
  input: unknown,
): Result<ChartDocument | ChartDocument02> {
  const safe = inspectJson(input);
  if (!safe.ok) return safe;
  if (!record(safe.value) || safe.value.schemaVersion !== '0.2')
    return validateChart01(safe.value);
  if (!validate02(safe.value))
    return {
      ok: false,
      diagnostics: (validate02.errors ?? []).slice(0, 12).map((e) => ({
        code: 'INVALID_SCHEMA',
        severity: 'error' as const,
        path: e.instancePath,
        message: e.message ?? 'Invalid document.',
        recoverable: true,
      })),
    };
  return { ok: true, value: safe.value };
}

/** Explicit, lossless conversion of 0.1 intent documents. Native option migration is not supported. */
export function migrateIntent01To02(input: unknown): Result<ChartDocument02> {
  const result = validateChart01(input);
  if (!result.ok) return result;
  if (result.value.mode !== 'intent')
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/mode',
      'Only 0.1 intent documents can be migrated.',
    );
  return { ok: true, value: { ...result.value, schemaVersion: '0.2' } };
}

/** Dispatch by version; 0.1 retains its established behavior. */
export function compileChart(
  input: unknown,
  registry: DataRegistry = {},
): Result<RenderPlan> {
  const safe = inspectJson(input);
  if (!safe.ok) return safe;
  if (!record(safe.value) || safe.value.schemaVersion !== '0.2')
    return compileChart01(safe.value, registry);
  if (!validate02(safe.value))
    return {
      ok: false,
      diagnostics: (validate02.errors ?? []).slice(0, 12).map((e) => ({
        code: 'INVALID_SCHEMA',
        severity: 'error' as const,
        path: e.instancePath,
        message: e.message ?? 'Invalid document.',
        recoverable: true,
      })),
    };
  const doc = safe.value;
  const {
    orientation,
    area,
    donut,
    sort,
    aggregate,
    encoding,
    ...chartOptions
  } = doc.chart;
  const { unit, ...y } = encoding.y;
  const { temporalKind, ...x } = encoding.x;
  const temporal = x.type === 'temporal';
  if (
    (temporal && (temporalKind !== 'date' || chartOptions.type !== 'line')) ||
    (!temporal && temporalKind !== undefined)
  )
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart/encoding/x',
      'Temporal date encoding is supported only for line charts and requires temporalKind date.',
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
      const left = sort.by === 'category' ? a.category : a.value;
      const right = sort.by === 'category' ? b.category : b.value;
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
    const times: number[] = [];
    for (const date of axis.data) {
      if (typeof date !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date))
        return failure(
          'INVALID_DATA',
          '/chart/encoding/x',
          'Dates must use YYYY-MM-DD, years 1000–9999.',
        );
      const [year, month, day] = date.split('-').map(Number) as [
        number,
        number,
        number,
      ];
      const timestamp = Date.UTC(year, month - 1, day);
      const utc = new Date(timestamp);
      if (
        utc.getUTCFullYear() !== year ||
        utc.getUTCMonth() !== month - 1 ||
        utc.getUTCDate() !== day
      )
        return failure(
          'INVALID_DATA',
          '/chart/encoding/x',
          'Invalid Gregorian calendar date.',
        );
      times.push(timestamp);
    }
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
  const theme = doc.presentation?.theme;
  if (theme) {
    const dark = theme.id === 'dark';
    const foreground = dark ? '#f3f4f6' : '#172033';
    option.backgroundColor = dark ? '#111827' : '#ffffff';
    option.color = dark
      ? ['#60a5fa', '#fbbf24', '#34d399', '#f472b6']
      : ['#2563eb', '#b45309', '#047857', '#be185d'];
    option.textStyle = { color: foreground };
    if (record(option.title))
      option.title = { ...option.title, textStyle: { color: foreground } };
    if (record(option.legend))
      option.legend = { ...option.legend, textStyle: { color: foreground } };
    for (const axis of ['xAxis', 'yAxis']) {
      const value = option[axis];
      if (record(value))
        option[axis] = {
          ...value,
          nameTextStyle: { color: foreground },
          axisLabel: { color: foreground },
        };
    }
  }
  const labels = doc.presentation?.dataLabels;
  if (labels && Array.isArray(option.series)) {
    const color =
      labels.show && theme
        ? theme.id === 'dark'
          ? '#f3f4f6'
          : '#172033'
        : undefined;
    option.series = option.series.map((series) =>
      record(series)
        ? {
            ...series,
            label: { show: labels.show, ...(color ? { color } : {}) },
          }
        : series,
    );
  }
  const legend = doc.presentation?.legend;
  if (legend && record(option.legend)) {
    const current = option.legend;
    if (legend.position) {
      const { top: _top, bottom: _bottom, ...rest } = current;
      // Remove previous placement to avoid conflicting ECharts layout values.
      void _top;
      void _bottom;
      option.legend = {
        ...rest,
        show: legend.show,
        ...(legend.position === 'top'
          ? { top: chart.title ? 36 : 4 }
          : { bottom: 4 }),
      };
    } else option.legend = { ...current, show: legend.show };
    if (legend.show && legend.position === 'top' && record(option.grid))
      option.grid = { ...option.grid, top: 80 };
  }
  return { ok: true, value: { ...result.value, profile: 'basic-0.2' } };
}

export { validateNativeStrict } from './native-strict.js';
