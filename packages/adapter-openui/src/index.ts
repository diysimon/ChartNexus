import { createElement, useEffect, useRef, useState } from 'react';
import { defineComponent, useIsStreaming } from '@openuidev/react-lang';
import { z } from 'zod/v4';
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

export interface OpenUIChartOptions {
  registry?: DataRegistry;
  orderedUpdates?: boolean;
  onUpdateReceipt?: (receipt: UpdateReceipt) => void;
  onSelect?: (event: SelectionEvent) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
}

/** Register this component in an OpenUI library. `document` is JSON, never code. */
export function createOpenUIChart(options: OpenUIChartOptions = {}) {
  return defineComponent({
    name: 'ChartNexusChart',
    description: options.orderedUpdates
      ? 'Render a ChartNexus ordered update operation as a JSON string; the host supplies its revision and operation ID.'
      : 'Render a ChartNexus ChartDocument. Pass the complete document as a JSON string. Use schemaVersion 0.1 and either intent or echarts mode.',
    props: z.object({
      document: z
        .string()
        .describe(
          options.orderedUpdates
            ? 'JSON-encoded ChartNexus operation with operationId, baseRevision, complete and document when complete.'
            : 'Complete JSON-encoded ChartDocument, not JavaScript. Keep its id stable during updates.',
        ),
    }),
    component: ({ props }) =>
      createElement(Chart, { document: props.document, options }),
  });
}

function Chart({
  document,
  options,
}: {
  document: string;
  options: OpenUIChartOptions;
}) {
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<ChartRuntime | null>(null);
  const controller = useRef<UpdateController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const streaming = useIsStreaming();
  useEffect(() => {
    if (!container.current) return;
    const result = mountChart(container.current, (event) =>
      optionsRef.current.onSelect?.(event),
    );
    if (result.ok) {
      runtime.current = result.value;
      if (optionsRef.current.orderedUpdates)
        controller.current = createUpdateController(result.value);
    } else {
      setDiagnostics(result.diagnostics);
      optionsRef.current.onDiagnostics?.(result.diagnostics);
    }
    return () => {
      controller.current?.dispose();
      controller.current = null;
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, []);
  useEffect(() => {
    if (streaming || !runtime.current) return;
    if (new TextEncoder().encode(document).byteLength > 1024 * 1024) {
      const result = failure(
        'INPUT_TOO_LARGE',
        '',
        'The chart document exceeds the 1 MiB limit.',
      );
      if (!result.ok) {
        setDiagnostics(result.diagnostics);
        optionsRef.current.onDiagnostics?.(result.diagnostics);
      }
      return;
    }
    let input: unknown;
    try {
      input = JSON.parse(document);
    } catch {
      const result = failure(
        'INVALID_JSON',
        '',
        'The chart document is not valid JSON.',
      );
      if (!result.ok) {
        setDiagnostics(result.diagnostics);
        optionsRef.current.onDiagnostics?.(result.diagnostics);
      }
      return;
    }
    const result = controller.current
      ? controller.current.commit(input, optionsRef.current.registry)
      : runtime.current.update(input, optionsRef.current.registry);
    if (result.ok && controller.current)
      optionsRef.current.onUpdateReceipt?.(result.value as UpdateReceipt);
    const next = result.ok ? [] : result.diagnostics;
    setDiagnostics(next);
    optionsRef.current.onDiagnostics?.(next);
  }, [document, streaming]);
  return createElement(
    'div',
    { className: 'chartnexus-openui' },
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
