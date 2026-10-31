import {
  failure,
  type ChartDocument03,
  type DataTable,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { inspectJson } from './guard.js';
import { themeTokens } from './presentation.js';
export type NewDocument = Extract<
  ChartDocument03,
  { chart: { type: 'radar' | 'tree' | 'sankey' | 'map' } }
>;
export const pointer = (s: string) =>
  s.replaceAll('~', '~0').replaceAll('/', '~1');
export const identityKey = (kind: string, ...ids: string[]) =>
  JSON.stringify([kind, ...ids]);
export const validId = (s: unknown): s is string =>
  typeof s === 'string' && s.length > 0 && s.length <= 256;
export function fieldsExist(
  table: DataTable,
  fields: string[],
  path = '/chart/encoding',
): Result<true> {
  return fields.every((f) => table.fields.includes(f))
    ? { ok: true, value: true }
    : failure(
        'UNKNOWN_FIELD',
        path,
        'All encoded fields must be declared in the source table.',
      );
}
export function validateKeys(
  table: DataTable,
  field?: string,
): Result<string[]> {
  if (!field) return { ok: true, value: [] };
  if (!table.fields.includes(field))
    return failure(
      'UNKNOWN_FIELD',
      '/data/keyField',
      'Key field must be declared.',
    );
  const keys: string[] = [],
    seen = new Set<string>();
  for (const [i, row] of table.rows.entries()) {
    const key = row[field];
    if (!validId(key) || seen.has(key))
      return failure(
        'INVALID_ROW_KEY',
        `/data/rows/${i}/${pointer(field)}`,
        'Row keys must be unique nonempty strings up to 256 characters.',
      );
    seen.add(key);
    keys.push(key);
  }
  return { ok: true, value: keys };
}
export function sourceBudget(...tables: DataTable[]): Result<true> {
  const result = inspectJson(tables);
  return result.ok ? { ok: true, value: true } : result;
}
export function newPlan(
  doc: NewDocument,
  table: DataTable,
  revision: string,
  summary: string,
): RenderPlan {
  const tokens = themeTokens[doc.presentation?.theme ?? 'light'];
  return {
    chartId: doc.id,
    dataRevision: revision,
    compilerVersion: '0.0.1',
    profile: 'basic-0.3',
    eventVersion: '0.3',
    rowIndices: [],
    interactionKey: JSON.stringify([
      doc.chart.type,
      doc.chart.encoding,
      'indicators' in doc.chart ? doc.chart.indicators : null,
    ]),
    option: {
      animation: false,
      backgroundColor: 'transparent',
      textStyle: { color: tokens.text },
      color: [...tokens.colors],
      title: { text: doc.chart.title ?? '', textStyle: { color: tokens.text } },
      tooltip: {
        renderMode: 'richText',
        backgroundColor: tokens.tooltip,
        textStyle: { color: tokens.text },
      },
      legend: { show: false },
      series: [],
    },
    accessibility: {
      summary: `${doc.chart.title ? doc.chart.title + '. ' : ''}${summary}`,
      columns: [...table.fields],
      rows: table.rows.map((row) => table.fields.map((f) => row[f] ?? null)),
    },
  };
}
export function unitLabel(unit: {
  kind: string;
  label?: string;
  code?: string;
  scale?: string;
}): string {
  return unit.kind === 'currency'
    ? (unit.code ?? '')
    : unit.kind === 'percent'
      ? unit.scale === 'ratio'
        ? 'ratio (1 = 100%)'
        : '%'
      : (unit.label ?? '');
}
