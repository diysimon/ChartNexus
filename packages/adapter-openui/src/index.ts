import type { MapRegistry } from '@chartnexus/schema';
import { createElement, useEffect, useRef, useState } from 'react';
import { defineComponent, useIsStreaming } from '@openuidev/react-lang';
import { z } from 'zod/v4';
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

export interface OpenUIChartOptions {
  registry?: DataRegistry;
  maps?: MapRegistry;
  chatPresentation?: ChatPresentationSettings;
  orderedUpdates?: boolean;
  onUpdateReceipt?: (receipt: UpdateReceipt) => void;
  onSelect?: (event: SelectionEvent) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
}

/** Register this component in an OpenUI library. `document` is JSON, never code. */
export function createOpenUIChart(options: OpenUIChartOptions = {}) {
  const contract = getChartInputContract({
    chatPresentation: Boolean(options.chatPresentation),
    orderedUpdates: Boolean(options.orderedUpdates),
  });
  return defineComponent({
    name: 'ChartNexusChart',
    description: contract.description,
    props: z.object({
      document: z.string().describe(contract.description),
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
  const applyCurrent = useRef<(override?: unknown) => void>(() => {});
  const pendingInput = useRef<unknown>(undefined);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const streaming = useIsStreaming();
  useEffect(() => {
    if (!container.current) return;
    const coordinator = observeChartMount(
      container.current,
      (value) => {
        runtime.current = value;
        if (optionsRef.current.orderedUpdates)
          controller.current = createUpdateController(value);
        applyCurrent.current(pendingInput.current);
        pendingInput.current = undefined;
      },
      (items) => {
        setDiagnostics(items);
        optionsRef.current.onDiagnostics?.(items);
      },
      (event) => optionsRef.current.onSelect?.(event),
      optionsRef.current,
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
    if (streaming && override === undefined) return;
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
      input = override ?? JSON.parse(document);
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
    if (!runtime.current) {
      const checked = validatePendingInput(
        input,
        optionsRef.current,
        optionsRef.current.registry,
      );
      if (checked.ok) {
        if (checked.value) pendingInput.current = structuredClone(input);
      } else {
        setDiagnostics(checked.diagnostics);
        optionsRef.current.onDiagnostics?.(checked.diagnostics);
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
  };
  useEffect(() => applyCurrent.current(), [document, streaming]);
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

export {
  getChartInputContract,
  type ChartInputProfile,
} from '@chartnexus/runtime';
