/* Generated from chart-document-0.3.schema.json. Do not edit. */

/**
 * Experimental 0.3 contract. Four reserved branches require separately advertised renderer capabilities.
 */
export type ChartDocument03 =
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        dataLabels?: {
          show: boolean;
        };
        legend?: {
          show: boolean;
          position?: 'top' | 'bottom';
        };
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
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
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'bar';
        title?: string;
        encoding: {
          x: {
            field: string;
            type: 'ordinal';
          };
          y: {
            field: string;
            type: 'quantitative';
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
        orientation?: 'vertical' | 'horizontal';
        sort?: {
          by: 'category' | 'value';
          order: 'ascending' | 'descending';
          nulls: 'first' | 'last';
        };
        aggregate?: {
          op: 'sum' | 'mean' | 'count';
        };
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        dataLabels?: {
          show: boolean;
        };
        legend?: {
          show: boolean;
          position?: 'top' | 'bottom';
        };
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
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
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'line';
        title?: string;
        encoding: {
          x: {
            [k: string]: unknown;
          };
          y: {
            field: string;
            type: 'quantitative';
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
        area?: boolean;
        sort?: {
          by: 'category' | 'value';
          order: 'ascending' | 'descending';
          nulls: 'first' | 'last';
        };
        aggregate?: {
          op: 'sum' | 'mean' | 'count';
        };
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        dataLabels?: {
          show: boolean;
        };
        legend?: {
          show: boolean;
          position?: 'top' | 'bottom';
        };
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
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
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'pie';
        title?: string;
        encoding: {
          x: {
            field: string;
            type: 'ordinal';
          };
          y: {
            field: string;
            type: 'quantitative';
          };
        };
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
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        dataLabels?: {
          show: boolean;
        };
        legend?: {
          show: boolean;
          position?: 'top' | 'bottom';
        };
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
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
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'scatter';
        title?: string;
        encoding: {
          x: {
            field: string;
            type: 'quantitative';
          };
          y: {
            field: string;
            type: 'quantitative';
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
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        dataLabels?: {
          show: boolean;
        };
        legend?: {
          show: boolean;
          position?: 'top' | 'bottom';
        };
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
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
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'combo';
        title?: string;
        encoding: {
          x: {
            field: string;
            type: 'ordinal';
          };
          y: {
            field: string;
            type: 'quantitative';
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
        };
        secondary: {
          field: string;
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
          axis?: 'shared' | 'right';
        };
        sort?: {
          by: 'category';
          order: 'ascending' | 'descending';
          nulls: 'first' | 'last';
        };
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        dataLabels?: {
          show: boolean;
        };
        legend?: {
          show: boolean;
          position?: 'top' | 'bottom';
        };
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
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
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'funnel';
        title?: string;
        encoding: {
          x: {
            field: string;
            type: 'ordinal';
          };
          y: {
            field: string;
            type: 'quantitative';
          };
        };
        sort?: {
          by: 'category' | 'value';
          order: 'ascending' | 'descending';
          nulls: 'first' | 'last';
        };
        aggregate?: {
          op: 'sum' | 'mean' | 'count';
        };
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
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
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'heatmap';
        title?: string;
        encoding: {
          x: {
            field: string;
            type: 'ordinal';
          };
          y: {
            field: string;
            type: 'ordinal';
          };
        };
        heatmap: {
          field: string;
          min: number;
          max: number;
        };
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        dataLabels?: {
          show: boolean;
        };
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
      data:
        | {
            kind: 'inline';
            /**
             * @minItems 1
             * @maxItems 100
             */
            fields: [string, ...string[]];
            /**
             * @maxItems 6
             */
            rows:
              | []
              | [
                  {
                    [k: string]: string | number | boolean | null;
                  },
                ]
              | [
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                ]
              | [
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                ]
              | [
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                ]
              | [
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                ]
              | [
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                  {
                    [k: string]: string | number | boolean | null;
                  },
                ];
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'radar';
        title?: string;
        encoding: {
          item: {
            field: string;
          };
        };
        /**
         * @minItems 3
         * @maxItems 8
         */
        indicators:
          | [
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
            ]
          | [
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
            ]
          | [
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
            ]
          | [
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
            ]
          | [
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
            ]
          | [
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
              {
                field: string;
                label: string;
                min: number;
                max: number;
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
              },
            ];
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
      data:
        | {
            kind: 'inline';
            /**
             * @minItems 1
             * @maxItems 100
             */
            fields: [string, ...string[]];
            /**
             * @maxItems 1000
             */
            rows: {
              [k: string]: string | number | boolean | null;
            }[];
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'tree';
        title?: string;
        encoding: {
          id: {
            field: string;
          };
          parentId: {
            field: string;
          };
          label: {
            field: string;
          };
        };
        /**
         * Initial expanded depth from the real root (0). SVG exports a labelled overview.
         */
        initialDepth?: number;
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
      data: {
        kind: 'graph';
        nodes:
          | {
              kind: 'inline';
              /**
               * @minItems 1
               * @maxItems 100
               */
              fields: [string, ...string[]];
              /**
               * @maxItems 200
               */
              rows: {
                [k: string]: string | number | boolean | null;
              }[];
              keyField?: string;
            }
          | {
              kind: 'reference';
              id: string;
              revision: string;
              keyField?: string;
            };
        links:
          | {
              kind: 'inline';
              /**
               * @minItems 1
               * @maxItems 100
               */
              fields: [string, ...string[]];
              /**
               * @maxItems 1000
               */
              rows: {
                [k: string]: string | number | boolean | null;
              }[];
              keyField?: string;
            }
          | {
              kind: 'reference';
              id: string;
              revision: string;
              keyField?: string;
            };
      };
      chart: {
        type: 'sankey';
        title?: string;
        encoding: {
          nodeId: {
            field: string;
          };
          nodeLabel: {
            field: string;
          };
          source: {
            field: string;
          };
          target: {
            field: string;
          };
          value: {
            field: string;
          };
        };
      };
    }
  | {
      schemaVersion: '0.3';
      id: string;
      mode: 'intent';
      presentation?: {
        theme?: 'light' | 'dark';
        dataLabels?: {
          show: boolean;
        };
        /**
         * Display intent applied only when the host opts into the chat presentation profile; host policy may override it.
         */
        detailLevel?:
          | 'minimal'
          | 'simple'
          | 'standard'
          | 'detailed'
          | 'comprehensive';
      };
      data:
        | {
            kind: 'inline';
            /**
             * @minItems 1
             * @maxItems 100
             */
            fields: [string, ...string[]];
            /**
             * @maxItems 1000
             */
            rows: {
              [k: string]: string | number | boolean | null;
            }[];
            keyField?: string;
          }
        | {
            kind: 'reference';
            id: string;
            revision: string;
            keyField?: string;
          };
      chart: {
        type: 'map';
        title?: string;
        encoding: {
          region: {
            field: string;
          };
          value: {
            field: string;
          };
        };
        mapRef: {
          id: string;
          revision: string;
        };
        colorDomain: {
          min: number;
          max: number;
        };
      };
    };
