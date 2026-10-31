import {
  failure,
  type DataRegistry,
  type JsonValue,
  type RenderPlan,
  type Result,
  type SeriesMetadata,
} from '@chartnexus/schema';
import { inspectJson, limits, record } from './guard.js';
import { validateChart01 } from './validation.js';
import { resolveTable } from './data.js';
import { nativeOption } from './native.js';
/** Host resolves references; core never accesses the network or model APIs. */
export function compileChart01(
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
  const resolved = resolveTable(doc.data, registry);
  if (!resolved.ok) return resolved;
  const {
    table: { fields, rows },
    revision: dataRevision,
  } = resolved.value;
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
  const seriesMetadata: SeriesMetadata[] = [];
  let emptyGroupLabel = '(empty)';
  for (let suffix = 2; groups.has(emptyGroupLabel); suffix++)
    emptyGroupLabel = `(empty) [${suffix}]`;
  const series: JsonValue[] = [...groups.entries()].map(([name, bucket]) => {
    const categoryChart = type === 'bar' || type === 'line';
    const id = group
      ? `series:${JSON.stringify([group, name, y])}`
      : `series:${name}`;
    const displayName = group ? name || emptyGroupLabel : y;
    if (group)
      seriesMetadata.push({
        id,
        groupField: group,
        groupValue: name,
        displayName,
      });
    rowIndices.push(
      categoryChart
        ? categories.map((c) => bucket.byCategory.get(c)?.index ?? -1)
        : bucket.indices,
    );
    return {
      id,
      name: displayName,
      type,
      ...(type === 'pie'
        ? { stillShowZeroSum: false, showEmptyCircle: false }
        : {}),
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
  const noShare =
    type === 'pie' && rows.length > 0 && rows.every((row) => row[y] === 0);
  const noShareMessage = 'No shares: all values are zero.';
  if (noShare) {
    option.title = { text: doc.chart.title ?? '', subtext: noShareMessage };
    option.aria = { enabled: true, description: noShareMessage };
  }
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
      ...(group ? { seriesMetadata } : {}),
      ...(type === 'pie' && rows.length === 0
        ? { dataState: 'empty' as const }
        : {}),
      ...(noShare
        ? {
            dataState: 'no-share' as const,
            notices: [
              {
                code: 'NO_SHARE_DATA' as const,
                severity: 'info' as const,
                path: '/data',
                message: noShareMessage,
              },
            ],
          }
        : {}),
    },
  };
}

/** Structural validation for the declared schema version; compileChart adds semantic checks. */
