import {
  failure,
  type DataRegistry,
  type DataTable,
  type Result,
} from '@chartnexus/schema';
import { inspectJson, limits, record } from './guard.js';
export function checkTable(input: unknown): Result<DataTable> {
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

export function resolveTable(
  source: { kind: string; id?: string; revision?: string },
  registry: DataRegistry = {},
): Result<{ table: DataTable; revision: string }> {
  let input: unknown = source;
  let revision = 'inline';
  if (source.kind === 'reference') {
    const entry =
      source.id && Object.hasOwn(registry, source.id)
        ? registry[source.id]
        : undefined;
    if (!entry)
      return failure(
        'DATA_NOT_FOUND',
        '/data/id',
        'Data reference is not registered by the host.',
      );
    if (entry.revision !== source.revision)
      return failure(
        'REVISION_CONFLICT',
        '/data/revision',
        'Registered data revision differs from requested revision.',
      );
    input = entry.table;
    revision = entry.revision;
  }
  const checked = checkTable(input);
  return checked.ok
    ? { ok: true, value: { table: checked.value, revision } }
    : checked;
}
