import { createElement, useEffect, useRef, useState } from 'react';
import { createComponentImplementation } from '@a2ui/react/v0_9';
import { CommonSchemas } from '@a2ui/web_core/v0_9';
import { z } from 'zod';
import {
  mountChart,
  createUpdateController,
  type UpdateController,
  type UpdateReceipt,
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
  /** Opt into ChartNexus operation envelopes in the document binding. */
  orderedUpdates?: boolean;
  onUpdateReceipt?: (receipt: UpdateReceipt) => void;
  onSelect?: (event: SelectionEvent) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
}
export function createA2uiChart(options: A2uiChartOptions = {}) {
  const api = {
    name: 'ChartNexusChart',
    schema: z.object({
      document: CommonSchemas.DynamicString.describe(
        options.orderedUpdates
          ? 'A JSON-encoded ChartNexus update operation with operationId, baseRevision, complete and a complete document.'
          : 'A JSON-encoded ChartDocument. Use schemaVersion 0.1 and a stable id.',
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
  const controller = useRef<UpdateController | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  useEffect(() => {
    if (!container.current) return;
    const result = mountChart(container.current, (event) =>
      options.onSelect?.(event),
    );
    if (result.ok) {
      runtime.current = result.value;
      if (options.orderedUpdates)
        controller.current = createUpdateController(result.value);
    } else {
      setDiagnostics(result.diagnostics);
      options.onDiagnostics?.(result.diagnostics);
    }
    return () => {
      controller.current?.dispose();
      controller.current = null;
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
    const result = controller.current
      ? controller.current.commit(input, options.registry)
      : runtime.current.update(input, options.registry);
    if (result.ok && controller.current)
      options.onUpdateReceipt?.(result.value as UpdateReceipt);
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
export { createChartStreamBuffer } from './stream-buffer.js';
export type {
  ChartStreamBuffer,
  BufferedChartOperation,
} from './stream-buffer.js';
