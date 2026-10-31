import san from 'san';
import {
  mountChart,
  createUpdateController,
  type UpdateController,
  type UpdateReceipt,
  type ChartRuntime,
  type SelectionEvent,
  type ChatPresentationSettings,
} from '@chartnexus/runtime';
import type { DataRegistry, Diagnostic } from '@chartnexus/schema';

export interface CosuiOptions {
  registry?: DataRegistry;
  chatPresentation?: ChatPresentationSettings;
  orderedUpdates?: boolean;
  onUpdateReceipt?: (receipt: UpdateReceipt) => void;
  onSelect?: (event: SelectionEvent) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
}

/** A trusted component for registration in Cosmic Dynamic UI's components map. */
export function createCosuiChart(options: CosuiOptions = {}) {
  return class ChartNexusCosui extends san.Component<{ document: unknown }> {
    static template =
      '<div class="chartnexus-cosui" style="width:100%;height:320px"></div>';
    chart: ChartRuntime | undefined;
    controller: UpdateController | undefined;
    attached() {
      if (!(this.el instanceof HTMLElement)) return;
      const result = mountChart(
        this.el,
        (event) => {
          this.fire('chart-select', event);
          options.onSelect?.(event);
        },
        options.chatPresentation
          ? { chatPresentation: options.chatPresentation }
          : {},
      );
      if (!result.ok) {
        options.onDiagnostics?.(result.diagnostics);
        this.fire('chart-diagnostics', result.diagnostics);
        return;
      }
      this.chart = result.value;
      if (options.orderedUpdates)
        this.controller = createUpdateController(result.value);
      this.updateChart();
      this.watch('document', () => this.updateChart());
    }
    updateChart() {
      if (!this.chart) return;
      const result = this.controller
        ? this.controller.commit(this.data.get('document'), options.registry)
        : this.chart.update(this.data.get('document'), options.registry);
      if (result.ok && this.controller) {
        const receipt = result.value as UpdateReceipt;
        options.onUpdateReceipt?.(receipt);
        this.fire('chart-receipt', receipt);
      }
      const diagnostics = result.ok ? [] : result.diagnostics;
      options.onDiagnostics?.(diagnostics);
      this.fire('chart-diagnostics', diagnostics);
    }
    disposed() {
      this.controller?.dispose();
      this.controller = undefined;
      this.chart?.dispose();
      this.chart = undefined;
    }
  };
}
