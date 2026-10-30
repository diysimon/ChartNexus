import chartDocumentSchema from './chart-document.schema.json' with { type: 'json' };
export { chartDocumentSchema };
export type { ChartDocument } from './generated.js';
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
export interface Diagnostic {
  code: string;
  severity: 'error';
  path: string;
  message: string;
  recoverable: boolean;
}
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; diagnostics: Diagnostic[] };
export interface DataTable {
  readonly fields: readonly string[];
  readonly rows: readonly Readonly<
    Record<string, string | number | boolean | null>
  >[];
}
export interface DataEntry {
  readonly revision: string;
  readonly table: DataTable;
}
export type DataRegistry = Readonly<Record<string, DataEntry>>;
export interface RenderPlan {
  chartId: string;
  dataRevision: string;
  option: Record<string, JsonValue>;
  compilerVersion: '0.0.1';
  profile: 'basic-0.1';
  rowIndices: number[][];
}
export function failure(
  code: string,
  path: string,
  message: string,
): Result<never> {
  return {
    ok: false,
    diagnostics: [
      { code, path, message, severity: 'error', recoverable: true },
    ],
  };
}
