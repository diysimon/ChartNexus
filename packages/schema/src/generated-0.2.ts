/* Generated from chart-document-0.2.schema.json. Do not edit. */

/**
 * Experimental ChartNexus 0.2 intent profile; no network resolution.
 */
export interface ChartDocument02 {
  schemaVersion: '0.2';
  id: string;
  mode: 'intent';
  data:
    | {
        kind: 'inline';
        /**
         * @minItems 1
         * @maxItems 100
         */
        fields: [string, ...string[]];
        /**
         * @maxItems 10000
         */
        rows: {
          [k: string]: string | number | boolean | null;
        }[];
      }
    | {
        kind: 'reference';
        id: string;
        revision: string;
      };
  chart: {
    type: 'bar' | 'line' | 'pie' | 'scatter';
    encoding: {
      x: {
        field: string;
        type: 'ordinal' | 'quantitative' | 'temporal';
        temporalKind?: 'date';
      };
      y: {
        field: string;
        type: 'ordinal' | 'quantitative';
        unit?:
          | {
              kind: 'currency';
              code: string;
            }
          | {
              kind: 'percent';
              scale: 'percent' | 'ratio';
            }
          | {
              kind: 'unit';
              label: string;
            };
      };
      series?: {
        field: string;
      };
    };
    stack?: boolean;
    title?: string;
    orientation?: 'vertical' | 'horizontal';
    area?: boolean;
    donut?: boolean;
    sort?: {
      by: 'category' | 'value';
      order: 'ascending' | 'descending';
      nulls: 'first' | 'last';
    };
    aggregate?: {
      op: 'sum' | 'mean' | 'count';
    };
  };
  presentation?: {
    theme?: {
      id: 'light' | 'dark';
      version: '1';
    };
    dataLabels?: {
      show: boolean;
    };
    legend?: {
      show: boolean;
      position?: 'top' | 'bottom';
    };
  };
}
