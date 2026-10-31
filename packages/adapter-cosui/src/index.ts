import san from 'san';
import {
  mountChart,
  type ChartRuntime,
  type SelectionEvent,
} from '@chartnexus/runtime';
import type { DataRegistry, Diagnostic } from '@chartnexus/schema';

export interface CosuiOptions {
  registry?: DataRegistry;
  onSelect?: (event: SelectionEvent) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
}

/** A trusted component for registration in Cosmic Dynamic UI's components map. */
export function createCosuiChart(options: CosuiOptions = {}) {
  return class ChartNexusCosui extends san.Component<{ document: unknown }> {
    static template =
      '<div class="chartnexus-cosui" style="width:100%;height:320px"></div>';
    chart: ChartRuntime | undefined;
    attached() {
      if (!(this.el instanceof HTMLElement)) return;
      const result = mountChart(this.el, (event) => {
        this.fire('chart-select', event);
        options.onSelect?.(event);
      });
      if (!result.ok) {
        options.onDiagnostics?.(result.diagnostics);
        this.fire('chart-diagnostics', result.diagnostics);
        return;
      }
      this.chart = result.value;
      this.updateChart();
      this.watch('document', () => this.updateChart());
    }
    updateChart() {
      if (!this.chart) return;
      const result = this.chart.update(
        this.data.get('document'),
        options.registry,
      );
      const diagnostics = result.ok ? [] : result.diagnostics;
      options.onDiagnostics?.(diagnostics);
      this.fire('chart-diagnostics', diagnostics);
    }
    disposed() {
      this.chart?.dispose();
      this.chart = undefined;
    }
  };
}
