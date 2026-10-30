import capabilityManifest from './capabilities.json' with { type: 'json' };
import { Ajv2020 } from 'ajv/dist/2020.js';
import {
  chartDocumentSchema,
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
export const capabilities = Object.freeze(capabilityManifest);

export function validateChart(input: unknown): Result<ChartDocument> {
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
export function compileChart(
  input: unknown,
  registry: DataRegistry = {},
): Result<RenderPlan> {
  const validated = validateChart(input);
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
