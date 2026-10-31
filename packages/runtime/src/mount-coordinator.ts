import { mapCatalog } from '@chartnexus/echarts';
import type { MapRegistry } from '@chartnexus/schema';
import { compileChart, compileChatChart, inspectJson } from '@chartnexus/core';
import { type DataRegistry, type Result } from '@chartnexus/schema';
import { createUpdateController } from './update-controller.js';
import {
  mountChart,
  type ChartRuntime,
  type SelectionEvent,
  type ChatPresentationSettings,
} from './index.js';
import { failure, type Diagnostic } from '@chartnexus/schema';

/** Adapters wait for a measurable host. mountChart retains its immediate Result contract. */
export function observeChartMount(
  container: HTMLElement,
  onReady: (runtime: ChartRuntime) => void,
  onDiagnostics: (diagnostics: Diagnostic[]) => void = () => {},
  onSelect?: (event: SelectionEvent) => void,
  options: {
    chatPresentation?: ChatPresentationSettings;
    maps?: MapRegistry;
  } = {},
) {
  let state: 'waiting-for-size' | 'ready' | 'disposed' = 'waiting-for-size';
  let runtime: ChartRuntime | undefined;
  const report = (diagnostics: Diagnostic[]) => {
    try {
      onDiagnostics(diagnostics);
    } catch {
      /* Host callback cannot leak the observer. */
    }
  };
  const attempt = () => {
    if (state !== 'waiting-for-size') return;
    const size = container.getBoundingClientRect();
    if (size.width === 0 || size.height === 0) return;
    const mounted = mountChart(container, onSelect, {
      ...options,
      onDiagnostics: report,
    });
    if (!mounted.ok) {
      report(mounted.diagnostics);
      return;
    }
    runtime = mounted.value;
    state = 'ready';
    observer.disconnect();
    try {
      onReady(runtime);
    } catch {
      const error = failure(
        'HOST_CALLBACK_FAILED',
        '',
        'Mount callback failed.',
      );
      if (!error.ok) report(error.diagnostics);
    }
  };
  const observer = new ResizeObserver(attempt);
  observer.observe(container);
  queueMicrotask(attempt);
  return {
    getState: () => state,
    dispose() {
      if (state === 'disposed') return;
      state = 'disposed';
      observer.disconnect();
      runtime?.dispose();
      runtime = undefined;
    },
  };
}

/** Validate a pending complete input without claiming a render or consuming an operation ID. */
export function validatePendingInput(
  input: unknown,
  options: {
    chatPresentation?: ChatPresentationSettings;
    orderedUpdates?: boolean;
    maps?: MapRegistry;
  },
  registry?: DataRegistry,
): Result<boolean> {
  const safe = inspectJson({ input, ...(registry ? { registry } : {}) });
  if (!safe.ok) return safe;
  const update = (document: unknown) => {
    const result = options.chatPresentation
      ? compileChatChart(
          document,
          options.chatPresentation,
          registry,
          mapCatalog(options.maps),
        )
      : compileChart(document, registry, mapCatalog(options.maps));
    return result.ok ? { ok: true as const, value: { revision: 1 } } : result;
  };
  if (!options.orderedUpdates) {
    const result = update(input);
    return result.ok ? { ok: true, value: true } : result;
  }
  const temporary = createUpdateController({
    update,
    getRevision: () => 0,
    resize: () => ({ ok: true, value: true }),
    dispose() {},
  });
  const result = temporary.commit(input, registry);
  temporary.dispose();
  return result.ok
    ? { ok: true, value: result.value.status !== 'pending' }
    : result;
}
