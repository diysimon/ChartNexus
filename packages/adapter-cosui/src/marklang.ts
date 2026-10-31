import marklang from 'marklang';
import { compileChart } from '@chartnexus/core';
import { mountChart, type ChartRuntime } from '@chartnexus/runtime';
import { failure, type Diagnostic, type Result } from '@chartnexus/schema';
import type { CosuiOptions } from './index.js';

/** The host supplies complete, trusted/sanitized Markdown; do not pass arbitrary HTML. */
export function createMarklangCharts(
  container: HTMLElement,
  options: CosuiOptions = {},
) {
  let charts: ChartRuntime[] = [];
  let disposed = false;
  function report<T>(result: Result<T>): Result<T> {
    options.onDiagnostics?.(result.ok ? [] : result.diagnostics);
    return result;
  }
  return {
    update(source: string, complete: boolean): Result<{ rendered: number }> {
      if (disposed)
        return report(failure('DISPOSED', '', 'Markdown host is disposed.'));
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
      for (const item of pending) {
        const result = compileChart(item.document, options.registry);
        if (!result.ok) return report(result);
      }
      for (const chart of charts) chart.dispose();
      charts = [];
      container.replaceChildren(...Array.from(stage.childNodes));
      const errors: Diagnostic[] = [];
      for (const item of pending) {
        const mounted = mountChart(item.node, options.onSelect);
        if (!mounted.ok) {
          errors.push(...mounted.diagnostics);
          continue;
        }
        const result = mounted.value.update(item.document, options.registry);
        if (!result.ok) {
          errors.push(...result.diagnostics);
          mounted.value.dispose();
          continue;
        }
        charts.push(mounted.value);
      }
      return errors.length
        ? report({ ok: false, diagnostics: errors })
        : report({ ok: true, value: { rendered: charts.length } });
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        charts.forEach((chart) => chart.dispose());
        charts = [];
        container.replaceChildren();
      }
    },
  };
}
/** Use upstream serialization for a named ml-data block. */
export function marklangDataSource(name: string, data: unknown): string {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name))
    throw new Error('Invalid Marklang data name.');
  return marklang.dataToSource(name, data);
}
