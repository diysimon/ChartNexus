import type { MapRegistry } from '@chartnexus/schema';
import { createElement, useEffect, useRef, useState } from 'react';
import { createComponentImplementation } from '@a2ui/react/v0_9';
import { CommonSchemas } from '@a2ui/web_core/v0_9';
import { z } from 'zod';
import {
  observeChartMount,
  validatePendingInput,
  getChartInputContract,
  createUpdateController,
  type UpdateController,
  type UpdateReceipt,
  type ChartRuntime,
  type SelectionEvent,
  type ChatPresentationSettings,
} from '@chartnexus/runtime';
import {
  failure,
  type DataRegistry,
  type Diagnostic,
} from '@chartnexus/schema';

export interface A2uiChartOptions {
  registry?: DataRegistry;
  maps?: MapRegistry;
  chatPresentation?: ChatPresentationSettings;
  /** Opt into ChartNexus operation envelopes in the document binding. */
  orderedUpdates?: boolean;
  onUpdateReceipt?: (receipt: UpdateReceipt) => void;
  onSelect?: (event: SelectionEvent) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
}
export function createA2uiChart(options: A2uiChartOptions = {}) {
  const contract = getChartInputContract({
    chatPresentation: Boolean(options.chatPresentation),
    orderedUpdates: Boolean(options.orderedUpdates),
  });
  const api = {
    name: 'ChartNexusChart',
    schema: z.object({
      document: CommonSchemas.DynamicString.describe(contract.description),
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
  const applyCurrent = useRef<(override?: unknown) => void>(() => {});
  const pendingInput = useRef<unknown>(undefined);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  useEffect(() => {
    if (!container.current) return;
    const coordinator = observeChartMount(
      container.current,
      (value) => {
        runtime.current = value;
        if (options.orderedUpdates)
          controller.current = createUpdateController(value);
        applyCurrent.current(pendingInput.current);
        pendingInput.current = undefined;
      },
      (items) => {
        setDiagnostics(items);
        options.onDiagnostics?.(items);
      },
      (event) => options.onSelect?.(event),
      options,
    );
    return () => {
      coordinator.dispose();
      controller.current?.dispose();
      controller.current = null;
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, []);
  applyCurrent.current = (override) => {
    if (document === undefined || document === null) return;
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
      input = override ?? JSON.parse(document);
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
    if (!runtime.current) {
      const checked = validatePendingInput(input, options, options.registry);
      if (checked.ok) {
        if (checked.value) pendingInput.current = structuredClone(input);
      } else {
        setDiagnostics(checked.diagnostics);
        options.onDiagnostics?.(checked.diagnostics);
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
  };
  useEffect(() => applyCurrent.current(), [document]);
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

export {
  getChartInputContract,
  type ChartInputProfile,
} from '@chartnexus/runtime';
