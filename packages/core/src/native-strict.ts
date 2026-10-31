import { Ajv2020 } from 'ajv/dist/2020.js';
import {
  failure,
  nativeStrictBasicSchema,
  type Result,
} from '@chartnexus/schema';
import { inspectJson, limits, record } from './guard.js';
import { nativeOption } from './native.js';

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(nativeStrictBasicSchema);
const pointer = (key: string) =>
  key.replaceAll('~', '~0').replaceAll('/', '~1');

/** Checks the narrow native-strict-basic-0.1 profile, not all ECharts options. */
export function validateNativeStrict(input: unknown): Result<true> {
  const safe = inspectJson(input);
  if (!safe.ok) return safe;
  const doc = safe.value;
  if (
    !record(doc) ||
    doc.schemaVersion !== '0.1' ||
    doc.mode !== 'echarts' ||
    typeof doc.id !== 'string' ||
    doc.id.length < 1 ||
    doc.id.length > 256 ||
    Object.keys(doc).some(
      (key) => !['schemaVersion', 'id', 'mode', 'option'].includes(key),
    ) ||
    !record(doc.option)
  )
    return failure(
      'INVALID_SCHEMA',
      '',
      'Expected a ChartDocument 0.1 native document.',
    );
  const guard = nativeOption(doc.option);
  if (!guard.ok) return guard;
  if (!validate(doc.option)) {
    const error = validate.errors?.[0];
    const extra =
      error?.keyword === 'additionalProperties' &&
      typeof error.params.additionalProperty === 'string'
        ? `/${pointer(error.params.additionalProperty)}`
        : '';
    return failure(
      'INVALID_NATIVE_STRICT',
      `/option${error?.instancePath ?? ''}${extra}`,
      error?.message ?? 'Option is outside the strict native profile.',
    );
  }
  const option = doc.option;
  const series = option.series;
  if (!Array.isArray(series) || !series.every(record))
    return failure(
      'INVALID_NATIVE_STRICT',
      '/option/series',
      'Expected series objects.',
    );
  const kinds = new Set(series.map((item) => item.type));
  const pie = kinds.has('pie');
  const scatter = kinds.has('scatter');
  if (
    (pie &&
      (series.length !== 1 ||
        option.xAxis !== undefined ||
        option.yAxis !== undefined)) ||
    (scatter && kinds.size !== 1)
  )
    return failure(
      'INVALID_NATIVE_STRICT',
      '/option/series',
      'Pie must stand alone; scatter cannot be mixed with other series.',
    );
  if (pie) {
    const data = series[0]?.data;
    if (!Array.isArray(data))
      return failure(
        'INVALID_NATIVE_STRICT',
        '/option/series/0/data',
        'Expected pie data.',
      );
    const names = new Set<string>();
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!record(item) || typeof item.name !== 'string')
        return failure(
          'INVALID_NATIVE_STRICT',
          `/option/series/0/data/${i}`,
          'Expected named pie data.',
        );
      if (names.has(item.name))
        return failure(
          'AMBIGUOUS_DATA',
          `/option/series/0/data/${i}/name`,
          'Pie names must be unique.',
        );
      names.add(item.name);
    }
  } else {
    const x = option.xAxis,
      y = option.yAxis;
    if (
      !record(x) ||
      !record(y) ||
      y.type !== 'value' ||
      (scatter ? x.type !== 'value' : x.type !== 'category') ||
      y.data !== undefined ||
      (scatter && x.data !== undefined)
    )
      return failure(
        'INVALID_NATIVE_STRICT',
        '/option',
        'Expected compatible xAxis and yAxis types.',
      );
    if (!scatter) {
      if (!Array.isArray(x.data))
        return failure(
          'INVALID_NATIVE_STRICT',
          '/option/xAxis/data',
          'Expected category data.',
        );
      if (new Set(x.data).size !== x.data.length)
        return failure(
          'AMBIGUOUS_DATA',
          '/option/xAxis/data',
          'Category names must be unique.',
        );
      for (let i = 0; i < series.length; i++) {
        const data = series[i]?.data;
        if (!Array.isArray(data) || data.length !== x.data.length)
          return failure(
            'INVALID_NATIVE_STRICT',
            `/option/series/${i}/data`,
            'Series length must match category count.',
          );
      }
      if (x.data.length * series.length > limits.points)
        return failure(
          'RESOURCE_LIMIT',
          '/option/series',
          'Expanded data exceeds the point budget.',
        );
    } else {
      const count = series.reduce(
        (total, item) =>
          total + (Array.isArray(item.data) ? item.data.length : 0),
        0,
      );
      if (count > limits.points)
        return failure(
          'RESOURCE_LIMIT',
          '/option/series',
          'Data exceeds the point budget.',
        );
    }
  }
  return { ok: true, value: true };
}
