import { createElement, useEffect, useRef, useState } from 'react';
import { createComponentImplementation } from '@a2ui/react/v0_9';
import { CommonSchemas } from '@a2ui/web_core/v0_9';
import { z } from 'zod';
import {
  mountChart,
  type ChartRuntime,
  type SelectionEvent,
} from '@chartnexus/runtime';
import {
  failure,
  type DataRegistry,
  type Diagnostic,
} from '@chartnexus/schema';

export interface A2uiChartOptions {
  registry?: DataRegistry;
  onSelect?: (event: SelectionEvent) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
}
export function createA2uiChart(options: A2uiChartOptions = {}) {
  const api = {
    name: 'ChartNexusChart',
    schema: z.object({
      document: CommonSchemas.DynamicString.describe(
        'A JSON-encoded ChartDocument. Use schemaVersion 0.1 and a stable id.',
      ),
    }),
  };
  return createComponentImplementation(api, ({ props }) =>
    createElement(Chart, { document: props.document, options }),
  );
}
function Chart({
  document,
  options,
}: {
  document: string | null | undefined;
  options: A2uiChartOptions;
}) {
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<ChartRuntime | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  useEffect(() => {
    if (!container.current) return;
    const result = mountChart(container.current, (event) =>
      options.onSelect?.(event),
    );
    if (result.ok) runtime.current = result.value;
    else {
      setDiagnostics(result.diagnostics);
      options.onDiagnostics?.(result.diagnostics);
    }
    return () => {
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, []);
  useEffect(() => {
    if (!runtime.current || document === undefined || document === null) return;
    let input: unknown;
    if (new TextEncoder().encode(document).byteLength > 1024 * 1024) {
      const result = failure(
        'INPUT_TOO_LARGE',
        '',
        'Document exceeds the 1 MiB limit.',
      );
      if (!result.ok) {
        setDiagnostics(result.diagnostics);
        options.onDiagnostics?.(result.diagnostics);
      }
      return;
    }
    try {
      input = JSON.parse(document);
    } catch {
      const result = failure(
        'INVALID_JSON',
        '',
        'Document must be valid JSON.',
      );
      if (!result.ok) {
        setDiagnostics(result.diagnostics);
        options.onDiagnostics?.(result.diagnostics);
      }
      return;
    }
    const result = runtime.current.update(input, options.registry);
    const next = result.ok ? [] : result.diagnostics;
    setDiagnostics(next);
    options.onDiagnostics?.(next);
  }, [document]);
  return createElement(
    'div',
    null,
    createElement('div', {
      ref: container,
      'data-chartnexus-chart': '',
      style: { width: '100%', height: 320 },
    }),
    diagnostics.length
      ? createElement(
          'pre',
          { role: 'alert' },
          diagnostics.map((item) => `${item.code}: ${item.message}`).join('\n'),
        )
      : null,
  );
}

export { A2uiSurface } from '@a2ui/react/v0_9';
export { Catalog, MessageProcessor } from '@a2ui/web_core/v0_9';
