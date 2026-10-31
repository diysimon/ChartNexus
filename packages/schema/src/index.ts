import chartDocument03Schema from './chart-document-0.3.schema.json' with { type: 'json' };
export { chartDocument03Schema };
export type { ChartDocument03 } from './generated-0.3.js';
import chartDocumentSchema from './chart-document.schema.json' with { type: 'json' };
import nativeStrictBasicSchema from './native-strict-basic-0.1.schema.json' with { type: 'json' };
import chartDocument02Schema from './chart-document-0.2.schema.json' with { type: 'json' };
export { chartDocumentSchema, chartDocument02Schema, nativeStrictBasicSchema };
export type { ChartDocument02 } from './generated-0.2.js';
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
export interface AggregatePoint {
  operation: 'sum' | 'mean' | 'count';
  category: string;
  series: string | null;
  sourceCount: number;
  nonNullCount: number;
}
export interface ChartNotice {
  code:
    | 'NO_SHARE_DATA'
    | 'LAYOUT_FALLBACK'
    | 'LABEL_DENSITY_LIMIT'
    | 'STATE_RESET'
    | 'TREE_OVERVIEW';
  severity: 'info';
  params?: Record<string, JsonValue>;
  path: string;
  message: string;
}
export interface SeriesMetadata {
  id: string;
  groupField: string;
  groupValue: string;
  displayName: string;
}
export interface RenderPlan {
  chartId: string;
  dataRevision: string;
  option: Record<string, JsonValue>;
  compilerVersion: '0.0.1';
  profile: 'basic-0.1' | 'basic-0.2' | 'basic-0.3';
  rowKeys?: (string | null)[][];
  markIdentities?: Record<string, MarkIdentity>;
  treeState?: {
    topologyKey: string;
    nodeOrder: string[];
    collapsed: Record<string, boolean>;
  };
  map?: MapMetadata;
  flowBalance?: {
    nodeId: string;
    incoming: number;
    outgoing: number;
    difference: number;
  }[];
  eventVersion?: '0.3';
  interactionKey?: string;
  /** Runtime render names for JavaScript-reserved legend keys; labels remain original. */
  legendLabels?: Record<string, string>;
  accessibility?: ChartAccessibility;
  presentationVersion?: '1';
  rowIndices: number[][];
  aggregatePoints?: (AggregatePoint | null)[][];
  /** Exceptional intent pie state; absent for ordinary data and other charts. */
  dataState?: 'empty' | 'no-share';
  notices?: ChartNotice[];
  /** Group identity is independent of its potentially disambiguated display label. */
  seriesMetadata?: SeriesMetadata[];
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

export interface ChartAccessibility {
  summary: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  sourceKeys?: string[];
  tables?: {
    title: string;
    columns: string[];
    rows: (string | number | boolean | null)[][];
  }[];
  rendered?: {
    columns: string[];
    rows: (string | number | boolean | null)[][];
  };
}
/** Exact branch projection from the canonical union, never an independently authored schema. */
export function projectChartSchema03(chartType: string) {
  const branch = chartDocument03Schema.oneOf.find(
    (branch) => branch.properties.chart.properties.type.const === chartType,
  );
  if (!branch) return undefined;
  const copy: typeof branch = JSON.parse(JSON.stringify(branch));
  return { $schema: chartDocument03Schema.$schema, ...copy };
}

/** Host-owned map metadata; geometry never enters model documents or core compilation. */
export interface MapMetadata {
  id: string;
  revision: string;
  hash: string;
  regionKeys: string[];
  coordinateSystem: 'WGS84';
  license: string;
  provenance: string;
}
export type MapCatalog = Readonly<Record<string, MapMetadata>>;
export interface MapAsset extends MapMetadata {
  geoJSON: {
    type: 'FeatureCollection';
    features: {
      type: 'Feature';
      properties: { name: string };
      geometry:
        | { type: 'Polygon'; coordinates: number[][][] }
        | { type: 'MultiPolygon'; coordinates: number[][][][] };
    }[];
  };
}
export type MapRegistry = Readonly<Record<string, MapAsset>>;
export type MarkIdentity =
  | { identity: 'node'; nodeId: string; rowIndex: number }
  | {
      identity: 'edge';
      edgeId: string;
      sourceId: string;
      targetId: string;
      rowIndex: number;
    }
  | { identity: 'region'; regionId: string; rowIndex: number | null };
