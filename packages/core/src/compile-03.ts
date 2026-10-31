import {
  failure,
  type ChartDocument03,
  type DataRegistry,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { compileRadar } from './chart-radar.js';
import { compileTree } from './chart-tree.js';
import { compileSankey } from './chart-sankey.js';
import { compileMap } from './chart-map.js';
import type { MapCatalog } from '@chartnexus/schema';
import { compileChart02 } from './compile-02.js';
import { validateChart, validateChart03 } from './validation.js';
import { resolveTable } from './data.js';

export function compileChart03(
  input: unknown,
  registry: DataRegistry = {},
  maps: MapCatalog = {},
): Result<RenderPlan> {
  const checked = validateChart03(input);
  if (!checked.ok) return checked;
  const doc = checked.value;
  // Narrow the whole document: chart.type is a nested discriminator.
  if (doc.chart.type === 'radar')
    return compileRadar(
      doc as Extract<ChartDocument03, { chart: { type: 'radar' } }>,
      registry,
    );
  if (doc.chart.type === 'tree')
    return compileTree(
      doc as Extract<ChartDocument03, { chart: { type: 'tree' } }>,
      registry,
    );
  if (doc.chart.type === 'sankey')
    return compileSankey(
      doc as Extract<ChartDocument03, { chart: { type: 'sankey' } }>,
      registry,
    );
  if (doc.chart.type === 'map')
    return compileMap(
      doc as Extract<ChartDocument03, { chart: { type: 'map' } }>,
      registry,
      maps,
    );
  if (doc.data.kind === 'graph')
    return failure('INVALID_DATA', '/data', 'Graph data requires Sankey.');
  const resolved = resolveTable(doc.data, registry);
  if (!resolved.ok) return resolved;
  const keyField = doc.data.keyField;
  const keys: string[] = [];
  if (keyField) {
    if (!resolved.value.table.fields.includes(keyField))
      return failure(
        'UNKNOWN_FIELD',
        '/data/keyField',
        'Key field must be declared.',
      );
    const seen = new Set<string>();
    for (const [index, row] of resolved.value.table.rows.entries()) {
      const key = row[keyField];
      if (typeof key !== 'string' || !key || key.length > 256 || seen.has(key))
        return failure(
          'INVALID_ROW_KEY',
          `/data/rows/${index}/${keyField.replaceAll('~', '~0').replaceAll('/', '~1')}`,
          'Row keys must be unique nonempty strings up to 256 characters.',
        );
      keys.push(key);
      seen.add(key);
    }
  }
  const { keyField: _key, ...data } = doc.data;
  void _key;
  const presentation = doc.presentation
    ? {
        ...doc.presentation,
        ...(doc.presentation.theme
          ? { theme: { id: doc.presentation.theme, version: '1' } }
          : {}),
      }
    : undefined;
  const normalized = {
    ...doc,
    schemaVersion: '0.2',
    data,
    ...(presentation ? { presentation } : {}),
  };
  const result = compileChart02(normalized, registry);
  if (!result.ok) return result;
  const plan = result.value;
  plan.profile = 'basic-0.3';
  plan.eventVersion = '0.3';
  if (keyField && !plan.aggregatePoints)
    plan.rowKeys = plan.rowIndices.map((indices) =>
      indices.map((index) => keys[index] ?? null),
    );
  plan.interactionKey = JSON.stringify([
    doc.chart.type,
    doc.chart.encoding,
    'secondary' in doc.chart ? doc.chart.secondary : null,
  ]);
  return { ok: true, value: plan };
}

/** Explicit migration; never silently drops unsupported fields or native options. */
export function migrateIntentTo03(
  input: unknown,
  registry: DataRegistry = {},
): Result<ChartDocument03> {
  const checked = validateChart(input);
  if (!checked.ok) return checked;
  if (checked.value.schemaVersion === '0.3')
    return validateChart03(checked.value);
  if (checked.value.mode !== 'intent')
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/mode',
      'Native documents remain on 0.1.',
    );
  const prior = compileChart02(checked.value, registry);
  if (!prior.ok) return prior;
  const doc = checked.value;
  const presentation = 'presentation' in doc ? doc.presentation : undefined;
  const migrated = {
    ...doc,
    schemaVersion: '0.3',
    ...(presentation
      ? {
          presentation: {
            ...presentation,
            ...(presentation.theme ? { theme: presentation.theme.id } : {}),
          },
        }
      : {}),
  };
  const validated = validateChart03(migrated);
  if (!validated.ok) return validated;
  return validated;
}
