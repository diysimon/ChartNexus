import { failure, type JsonValue, type Result } from '@chartnexus/schema';
import { limits, record } from './guard.js';

const topKeys = new Set([
  'title',
  'legend',
  'grid',
  'xAxis',
  'yAxis',
  'series',
  'dataset',
  'tooltip',
  'color',
  'backgroundColor',
  'animation',
]);
const forbidden = new Set([
  'formatter',
  'renderItem',
  'transform',
  'graphic',
  'toolbox',
  'media',
  'options',
  'baseOption',
  'link',
  'sublink',
  'image',
  'map',
  'geo',
  'rich',
  'textStyleCallback',
]);
const types = new Set(['bar', 'line', 'pie', 'scatter']);

export function nativeOption(
  option: Record<string, JsonValue>,
): Result<Record<string, JsonValue>> {
  for (const key of Object.keys(option))
    if (!topKeys.has(key))
      return failure(
        'UNSUPPORTED_CAPABILITY',
        `/option/${key}`,
        'Component is outside the basic native profile.',
      );
  function scan(value: JsonValue, path: string): Result<true> {
    if (
      typeof value === 'string' &&
      /(?:image:\/\/|https?:|data:|javascript:)/i.test(value)
    )
      return failure(
        'UNSUPPORTED_CAPABILITY',
        path,
        'External or executable resource strings are disabled.',
      );
    if (Array.isArray(value)) {
      if (value.length > limits.rows)
        return failure(
          'RESOURCE_LIMIT',
          path,
          'Array exceeds the 10000 item budget.',
        );
      for (const [index, child] of value.entries()) {
        const r = scan(child, `${path}/${index}`);
        if (!r.ok) return r;
      }
    } else if (record(value)) {
      for (const [key, child] of Object.entries(value)) {
        if (forbidden.has(key))
          return failure(
            'UNSUPPORTED_CAPABILITY',
            `${path}/${key}`,
            'Code, transforms, rich text, and external resource hooks are not supported.',
          );
        const r = scan(child, `${path}/${key}`);
        if (!r.ok) return r;
      }
    }
    return { ok: true, value: true };
  }
  const safe = scan(option, '/option');
  if (!safe.ok) return safe;
  if (
    !Array.isArray(option.series) ||
    option.series.length > limits.series ||
    !option.series.every(
      (s) => record(s) && typeof s.type === 'string' && types.has(s.type),
    )
  )
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/option/series',
      'Expected at most 50 bar, line, pie, or scatter series.',
    );
  if (option.tooltip !== undefined && !record(option.tooltip))
    return failure(
      'INVALID_SCHEMA',
      '/option/tooltip',
      'Tooltip must be an object.',
    );
  return {
    ok: true,
    value: {
      ...option,
      animation: false,
      tooltip: {
        ...(record(option.tooltip) ? option.tooltip : {}),
        renderMode: 'richText',
      },
    },
  };
}
