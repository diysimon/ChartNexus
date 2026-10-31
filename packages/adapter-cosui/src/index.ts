import type { MapRegistry } from '@chartnexus/schema';
import san from 'san';
import {
  observeChartMount,
  validatePendingInput,
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
  maps?: MapRegistry;
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
    pendingInput: unknown;
    controller: UpdateController | undefined;
    coordinator: ReturnType<typeof observeChartMount> | undefined;
    attached() {
      if (!(this.el instanceof HTMLElement)) return;
      this.watch('document', () => this.updateChart());
      this.updateChart();
      this.coordinator = observeChartMount(
        this.el,
        (runtime) => {
          this.chart = runtime;
          if (options.orderedUpdates)
            this.controller = createUpdateController(runtime);
          this.updateChart(this.pendingInput);
          this.pendingInput = undefined;
        },
        (diagnostics) => {
          options.onDiagnostics?.(diagnostics);
          this.fire('chart-diagnostics', diagnostics);
        },
        (event) => {
          this.fire('chart-select', event);
          options.onSelect?.(event);
        },
        options,
      );
    }
    updateChart(override?: unknown) {
      const input = override ?? this.data.get('document');
      if (!this.chart) {
        const checked = validatePendingInput(input, options, options.registry);
        if (checked.ok) {
          if (checked.value) this.pendingInput = structuredClone(input);
        } else options.onDiagnostics?.(checked.diagnostics);
        return;
      }
      const result = this.controller
        ? this.controller.commit(input, options.registry)
        : this.chart.update(input, options.registry);
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
      this.coordinator?.dispose();
      this.coordinator = undefined;
      this.controller?.dispose();
      this.controller = undefined;
      this.chart?.dispose();
      this.chart = undefined;
    }
  };
}

export {
  getChartInputContract,
  type ChartInputProfile,
} from '@chartnexus/runtime';
