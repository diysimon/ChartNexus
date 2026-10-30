/* Generated from chart-document.schema.json. Do not edit. */

/**
 * Experimental ChartNexus document; no network resolution is performed.
 */
export type ChartDocument =
  | {
      schemaVersion: '0.1';
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
            type: 'ordinal' | 'quantitative';
          };
          y: {
            field: string;
            type: 'ordinal' | 'quantitative';
          };
          series?: {
            field: string;
          };
        };
        stack?: boolean;
        title?: string;
      };
    }
  | {
      schemaVersion: '0.1';
      id: string;
      mode: 'echarts';
      option: {
        [k: string]: unknown;
      };
    };
