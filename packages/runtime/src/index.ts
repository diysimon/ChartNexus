import { mapCatalog, registerPlanMap, renderOption } from '@chartnexus/echarts';
import { applyTreeState, retainTreeState } from './tree-state.js';
import { createAccessibleView } from './accessibility.js';
import {
  legendEntries,
  retainLegend,
  prepareLegendNames,
} from './legend-state.js';
import { echarts } from '@chartnexus/echarts';
import {
  compileChart,
  compileChatChart,
  limits,
  resolvePresentation,
  type ChatPresentationSettings,
} from '@chartnexus/core';
import {
  failure,
  type AggregatePoint,
  type Diagnostic,
  type DataRegistry,
  type MapRegistry,
  type MarkIdentity,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';

interface SelectionEventBase {
  eventVersion?: '0.3';
  chartId: string;
  chartRevision: number;
  dataRevision: string;
  type: 'select';
  seriesIndex: number;
  dataIndex: number;
}
export type SelectionEvent = SelectionEventBase &
  (
    | (MarkIdentity & { eventVersion: '0.3' })
    | { identity: 'position'; rowIndex: number | null }
    | { identity: 'key'; rowIndex: number; rowKey: string; eventVersion: '0.3' }
    | { identity: 'aggregate'; rowIndex: null; aggregate: AggregatePoint }
  );
export interface ChartRuntime {
  update(input: unknown, registry?: DataRegistry): Result<{ revision: number }>;
  resize(): Result<true>;
  dispose(): void;
  getRevision(): number;
}
const owners = new WeakSet<HTMLElement>();

export function mountChart(
  container: HTMLElement,
  onSelect?: (event: SelectionEvent) => void,
  options: {
    chatPresentation?: ChatPresentationSettings;
    maps?: MapRegistry;
    onDiagnostics?: (diagnostics: Diagnostic[]) => void;
  } = {},
): Result<ChartRuntime> {
  if (owners.has(container) || echarts.getInstanceByDom(container))
    return failure(
      'CONTAINER_OWNED',
      '',
      'Container already has a chart owner.',
    );
  function validSize(): boolean {
    const { width, height } = container.getBoundingClientRect();
    return (
      width > 0 &&
      height > 0 &&
      width <= limits.dimension &&
      height <= limits.dimension
    );
  }
  if (!validSize())
    return failure(
      'INVALID_SIZE',
      '',
      'Container must have a nonzero size up to 4096px.',
    );
  let chart: echarts.ECharts;
  try {
    chart = echarts.init(container, undefined, { renderer: 'svg' });
  } catch {
    return failure('RENDER_FAILED', '', 'Could not initialize ECharts.');
  }
  owners.add(container);
  let revision = 0,
    disposed = false;
  let previous: RenderPlan | undefined;
  let basePlan: RenderPlan | undefined;
  let selected: Record<string, boolean> = Object.create(null);
  let accessible: ReturnType<typeof createAccessibleView> | undefined;
  function report(code: string, message: string): void {
    try {
      const failed = failure(code, '', message);
      if (!failed.ok) options.onDiagnostics?.(failed.diagnostics);
    } catch {
      /* Host callback failures cannot invalidate a committed chart. */
    }
  }
  function emit(event: SelectionEvent): void {
    try {
      onSelect?.(event);
    } catch {
      report('HOST_CALLBACK_FAILED', 'Selection callback failed.');
    }
  }
  function layout(plan: RenderPlan): Result<RenderPlan> {
    if (options.chatPresentation === undefined)
      return { ok: true, value: plan };
    const size = container.getBoundingClientRect();
    return resolvePresentation(plan, {
      width: size.width,
      height: size.height,
      target: 'browser',
      theme:
        options.chatPresentation.theme ??
        (plan.option.textStyle &&
        typeof plan.option.textStyle === 'object' &&
        !Array.isArray(plan.option.textStyle) &&
        plan.option.textStyle.color === '#f3f4f6'
          ? 'dark'
          : 'light'),
    });
  }
  chart.on('legendselectchanged', (event: unknown) => {
    if (
      !event ||
      typeof event !== 'object' ||
      !('selected' in event) ||
      !event.selected ||
      typeof event.selected !== 'object'
    )
      return;
    selected = Object.fromEntries(
      Object.entries(event.selected).filter(
        ([, value]) => typeof value === 'boolean',
      ),
    );
    accessible?.select(selected);
  });
  chart.on('treeexpandandcollapse', (event: unknown) => {
    if (
      !basePlan?.treeState ||
      !previous?.treeState ||
      !event ||
      typeof event !== 'object' ||
      !('dataIndex' in event) ||
      typeof event.dataIndex !== 'number'
    )
      return;
    const id = basePlan.treeState.nodeOrder[event.dataIndex];
    if (!id) return;
    const state = {
      ...basePlan.treeState.collapsed,
      [id]: !basePlan.treeState.collapsed[id],
    };
    applyTreeState(basePlan, state);
    applyTreeState(previous, state);
  });
  function resize(): Result<true> {
    if (disposed) return failure('DISPOSED', '', 'Chart runtime is disposed.');
    if (!validSize())
      return failure('INVALID_SIZE', '', 'Container has invalid dimensions.');
    try {
      if (basePlan && options.chatPresentation) {
        const next = layout(basePlan);
        if (!next.ok) return next;
        retainLegend(basePlan, next.value, selected);
        chart.setOption(renderOption(next.value), { notMerge: true });
        chart.resize();
        previous = next.value;
        return { ok: true, value: true };
      }
      chart.resize();
      return { ok: true, value: true };
    } catch {
      try {
        if (previous)
          chart.setOption(renderOption(previous), { notMerge: true });
      } catch {
        return failure('RENDER_RECOVERY_FAILED', '', 'Resize recovery failed.');
      }
      return failure(
        'RENDER_FAILED',
        '',
        'Resize failed; data revision is unchanged.',
      );
    }
  }
  const accessibilitySnapshot = () => ({
    label: container.getAttribute('aria-label'),
    role: container.getAttribute('role'),
  });
  type AccessibilitySnapshot = ReturnType<typeof accessibilitySnapshot>;
  let beforeNoShare: AccessibilitySnapshot | undefined;
  function restoreAccessibility(snapshot: AccessibilitySnapshot): void {
    for (const [attribute, value] of [
      ['aria-label', snapshot.label],
      ['role', snapshot.role],
    ] as const) {
      if (value === null) container.removeAttribute(attribute);
      else container.setAttribute(attribute, value);
    }
  }
  chart.on('click', (params: unknown) => {
    if (!previous || !onSelect || typeof params !== 'object' || !params) return;
    if (
      !('seriesIndex' in params) ||
      !('dataIndex' in params) ||
      typeof params.seriesIndex !== 'number' ||
      typeof params.dataIndex !== 'number'
    )
      return;
    const base: SelectionEventBase = {
      chartId: previous.chartId,
      chartRevision: revision,
      dataRevision: previous.dataRevision,
      type: 'select',
      ...(previous.eventVersion ? { eventVersion: previous.eventVersion } : {}),
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
    };
    if (previous.markIdentities) {
      const point = 'data' in params ? params.data : undefined;
      if (
        point &&
        typeof point === 'object' &&
        'id' in point &&
        typeof point.id === 'string'
      ) {
        const identity = previous.markIdentities[point.id];
        if (identity) emit({ ...base, ...identity, eventVersion: '0.3' });
      }
      return;
    }
    if (previous.aggregatePoints) {
      const aggregate =
        previous.aggregatePoints[params.seriesIndex]?.[params.dataIndex];
      if (aggregate)
        emit({ ...base, identity: 'aggregate', rowIndex: null, aggregate });
      return;
    }
    const rowIndex =
      previous.rowIndices[params.seriesIndex]?.[params.dataIndex];
    const rowKey = previous.rowKeys?.[params.seriesIndex]?.[params.dataIndex];
    if (rowKey && rowIndex !== undefined && rowIndex >= 0) {
      emit({ ...base, identity: 'key', rowIndex, rowKey, eventVersion: '0.3' });
      return;
    }
    emit({
      ...base,
      identity: 'position',
      rowIndex: rowIndex === undefined || rowIndex < 0 ? null : rowIndex,
    });
  });
  const observer = new ResizeObserver(() => {
    if (!disposed && validSize()) {
      const result = resize();
      if (!result.ok)
        report(result.diagnostics[0]!.code, result.diagnostics[0]!.message);
    }
  });
  observer.observe(container);
  return {
    ok: true,
    value: {
      update(input, registry) {
        if (disposed)
          return failure('DISPOSED', '', 'Chart runtime is disposed.');
        const chat =
          options.chatPresentation === undefined
            ? undefined
            : compileChatChart(
                input,
                options.chatPresentation,
                registry,
                mapCatalog(options.maps),
              );
        if (chat && !chat.ok) return chat;
        const compiled = chat
          ? { ok: true as const, value: chat.value.plan }
          : compileChart(input, registry, mapCatalog(options.maps));
        if (!compiled.ok) return compiled;
        retainTreeState(basePlan, compiled.value);
        prepareLegendNames(compiled.value);
        const nextSelected = retainLegend(basePlan, compiled.value, selected);
        const result = layout(compiled.value);
        if (!result.ok) return result;
        if (previous && previous.chartId !== result.value.chartId)
          return failure(
            'CHART_ID_CONFLICT',
            '/id',
            'Create a new runtime for a different chart ID.',
          );
        if (!validSize())
          return failure(
            'INVALID_SIZE',
            '',
            'Container has invalid dimensions.',
          );
        const registered = registerPlanMap(compiled.value, options.maps);
        if (!registered.ok) return registered;
        const beforeUpdate = accessibilitySnapshot();
        try {
          chart.setOption(renderOption(result.value), { notMerge: true });
        } catch {
          try {
            chart.clear();
            if (previous) {
              chart.setOption(renderOption(previous), { notMerge: true });
            }
          } catch {
            restoreAccessibility(beforeUpdate);
            return failure(
              'RENDER_RECOVERY_FAILED',
              '',
              'Rendering and restoration failed. Recreate the runtime.',
            );
          }
          restoreAccessibility(beforeUpdate);
          return failure(
            'RENDER_FAILED',
            '',
            'Update failed; the previous valid plan was restored.',
          );
        }
        // ECharts leaves its ARIA attributes in the DOM when aria is absent
        // from the next option. Restore host attributes when leaving no-share.
        if (result.value.dataState === 'no-share') {
          beforeNoShare ??= beforeUpdate;
        } else if (beforeNoShare) {
          restoreAccessibility(beforeNoShare);
          beforeNoShare = undefined;
        }
        previous = result.value;
        basePlan = compiled.value;
        selected = nextSelected;
        if (previous.accessibility) {
          accessible ??= createAccessibleView(container);
          accessible.theme(
            basePlan.option.textStyle !== null &&
              typeof basePlan.option.textStyle === 'object' &&
              !Array.isArray(basePlan.option.textStyle) &&
              basePlan.option.textStyle.color === '#f3f4f6',
          );
          const legend = basePlan.option.legend;
          const visibleEntries =
            legend &&
            typeof legend === 'object' &&
            !Array.isArray(legend) &&
            legend.show !== false
              ? legendEntries(basePlan)
              : [];
          accessible.update(
            previous.accessibility,
            visibleEntries.map((item) => ({
              name: item.name,
              label: basePlan!.legendLabels?.[item.name] ?? item.name,
            })),
            selected,
            (name) => {
              try {
                chart.dispatchAction({ type: 'legendToggleSelect', name });
              } catch {
                report('RENDER_FAILED', 'Legend action failed.');
              }
            },
          );
        } else {
          accessible?.dispose();
          accessible = undefined;
        }
        revision++;
        return { ok: true, value: { revision } };
      },
      resize,
      dispose() {
        if (!disposed) {
          disposed = true;
          observer.disconnect();
          accessible?.dispose();
          try {
            chart.dispose();
          } catch {
            report('RENDER_FAILED', 'Disposal failed.');
          }
          if (beforeNoShare) restoreAccessibility(beforeNoShare);
          beforeNoShare = undefined;
          owners.delete(container);
          previous = undefined;
          basePlan = undefined;
        }
      },
      getRevision() {
        return revision;
      },
    },
  };
}

export { createUpdateController } from './update-controller.js';
export type { UpdateController, UpdateReceipt } from './update-controller.js';

export type { ChatPresentationSettings } from '@chartnexus/core';

export {
  getChartInputContract,
  type ChartInputProfile,
} from './input-contract.js';

export {
  observeChartMount,
  validatePendingInput,
} from './mount-coordinator.js';

export {
  createChartStreamBuffer,
  type ChartStreamBuffer,
  type BufferedChartOperation,
} from './stream-buffer.js';
export { readOllamaStream } from './ollama-stream.js';
