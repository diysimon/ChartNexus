import marklang from 'marklang';
import { inspectJson } from '@chartnexus/core';
import {
  mountChart,
  validatePendingInput,
  type ChartRuntime,
} from '@chartnexus/runtime';
import { failure, type Diagnostic, type Result } from '@chartnexus/schema';
import type { CosuiOptions } from './index.js';

/** The host supplies complete, trusted/sanitized Markdown; do not pass arbitrary HTML. */
export function createMarklangCharts(
  container: HTMLElement,
  options: CosuiOptions = {},
) {
  let charts: ChartRuntime[] = [];
  let disposed = false;
  let pendingSource: string | undefined;
  let pendingFrame: number | undefined;
  function report<T>(result: Result<T>): Result<T> {
    try {
      options.onDiagnostics?.(result.ok ? [] : result.diagnostics);
    } catch {
      /* A host callback cannot invalidate a transaction. */
    }
    return result;
  }
  const host = {
    update(
      source: string,
      complete: boolean,
    ): Result<{ rendered: number; pending?: true }> {
      if (disposed)
        return report(failure('DISPOSED', '', 'Markdown host is disposed.'));
      if (options.orderedUpdates)
        return report(
          failure(
            'UNSUPPORTED_CAPABILITY',
            '/orderedUpdates',
            'Marklang does not accept operation envelopes.',
          ),
        );
      if (!complete) return { ok: true, value: { rendered: charts.length } };
      if (new TextEncoder().encode(source).byteLength > 1024 * 1024)
        return report(
          failure('INPUT_TOO_LARGE', '', 'Markdown exceeds the 1 MiB limit.'),
        );
      const pending: { node: HTMLElement; document: unknown }[] = [];
      const stage = document.createElement('div');
      const dataNames = new Set<string>();
      let invalidNames = false;
      function inspectNode(value: unknown): void {
        if (typeof value !== 'object' || value === null) return;
        const node = value as {
          name?: unknown;
          attributes?: { name?: unknown };
          children?: unknown[];
        };
        if (node.name === 'ml-data') {
          const name = node.attributes?.name;
          if (
            typeof name !== 'string' ||
            !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name) ||
            dataNames.has(name)
          )
            invalidNames = true;
          else dataNames.add(name);
        }
        if (Array.isArray(node.children)) node.children.forEach(inspectNode);
      }

      try {
        marklang({
          transformers: { mdast: { root: ({ node }) => inspectNode(node) } },
          directives: {
            'ml-chartnexus': (info) => {
              const node = document.createElement('div');
              node.style.width = '100%';
              node.style.height = '320px';
              node.dataset.chartnexusChart = '';
              pending.push({ node, document: info.properties?.data });
              return node;
            },
          },
        }).renderToElement(source, stage);
      } catch {
        return report(
          failure(
            'INVALID_MARKDOWN',
            '',
            'Could not parse the Markdown document.',
          ),
        );
      }
      if (invalidNames)
        return report(
          failure(
            'INVALID_DATA_NAME',
            '',
            'Data names must be unique and contain only letters, digits, underscores, or hyphens.',
          ),
        );
      if (pending.length > 16)
        return report(
          failure('TOO_MANY_CHARTS', '', 'At most 16 charts may be rendered.'),
        );
      const budget = inspectJson({
        documents: pending.map((item) => item.document),
        registry: options.registry ?? {},
      });
      if (!budget.ok) return report(budget);
      for (const item of pending) {
        const result = validatePendingInput(
          item.document,
          options,
          options.registry,
        );
        if (!result.ok) return report(result);
      }
      const bounds = container.getBoundingClientRect();
      if (bounds.width === 0) {
        pendingSource = source;
        // A hide/show within one frame can keep the last observed size unchanged.
        // Restart observation so the pending transaction receives an initial size.
        sizeObserver.unobserve(container);
        sizeObserver.observe(container);
        return { ok: true, value: { rendered: charts.length, pending: true } };
      }
      pendingSource = undefined;
      const style = getComputedStyle(container);
      const contentWidth =
        container.clientWidth -
        parseFloat(style.paddingLeft || '0') -
        parseFloat(style.paddingRight || '0');
      if (bounds.width <= 0 || bounds.width > 4096)
        return report(
          failure(
            'INVALID_SIZE',
            '',
            'Marklang requires a measurable container before a transaction.',
          ),
        );
      stage.style.cssText = `position:fixed;left:-10000px;top:0;width:${contentWidth}px;visibility:hidden;pointer-events:none`;
      stage.setAttribute('aria-hidden', 'true');
      stage.dataset.chartnexusStaging = '';
      document.body.append(stage);
      const staged: ChartRuntime[] = [];
      const rollback = (diagnostics: Diagnostic[]) => {
        staged.forEach((chart) => chart.dispose());
        stage.remove();
        return report<never>({ ok: false as const, diagnostics });
      };
      for (const item of pending) {
        const mounted = mountChart(item.node, options.onSelect, options);
        if (!mounted.ok) return rollback(mounted.diagnostics);
        staged.push(mounted.value);
        const result = mounted.value.update(item.document, options.registry);
        if (!result.ok) return rollback(result.diagnostics);
      }
      const old = charts;
      container.replaceChildren(...Array.from(stage.childNodes));
      stage.remove();
      charts = staged;
      old.forEach((chart) => chart.dispose());
      return report({ ok: true, value: { rendered: charts.length } });
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        pendingSource = undefined;
        sizeObserver.disconnect();
        if (pendingFrame !== undefined) cancelAnimationFrame(pendingFrame);
        pendingFrame = undefined;
        charts.forEach((chart) => chart.dispose());
        charts = [];
        container.replaceChildren();
      }
    },
  };
  const sizeObserver = new ResizeObserver(() => {
    if (
      disposed ||
      pendingSource === undefined ||
      container.getBoundingClientRect().width === 0
    )
      return;
    if (pendingFrame !== undefined) return;
    // Staging changes the observed container height. Commit on the next frame
    // so it cannot create undelivered notifications inside ResizeObserver.
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = undefined;
      if (
        disposed ||
        pendingSource === undefined ||
        container.getBoundingClientRect().width === 0
      )
        return;
      const source = pendingSource;
      pendingSource = undefined;
      host.update(source, true);
    });
  });
  sizeObserver.observe(container);
  return host;
}
/** Use upstream serialization for a named ml-data block. */
export function marklangDataSource(name: string, data: unknown): string {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name))
    throw new Error('Invalid Marklang data name.');
  return marklang.dataToSource(name, data);
}
