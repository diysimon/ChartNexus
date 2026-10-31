import * as echarts from 'echarts';
import {
  compileChart,
  compileChatChart,
  limits,
  type ChatPresentationSettings,
} from '@chartnexus/core';
import {
  failure,
  type AggregatePoint,
  type DataRegistry,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';

interface SelectionEventBase {
  chartId: string;
  chartRevision: number;
  dataRevision: string;
  type: 'select';
  seriesIndex: number;
  dataIndex: number;
}
export type SelectionEvent = SelectionEventBase &
  (
    | { identity: 'position'; rowIndex: number | null }
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
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
    };
    if (previous.aggregatePoints) {
      const aggregate =
        previous.aggregatePoints[params.seriesIndex]?.[params.dataIndex];
      if (aggregate)
        onSelect({ ...base, identity: 'aggregate', rowIndex: null, aggregate });
      return;
    }
    const rowIndex =
      previous.rowIndices[params.seriesIndex]?.[params.dataIndex];
    onSelect({
      ...base,
      identity: 'position',
      rowIndex: rowIndex === undefined || rowIndex < 0 ? null : rowIndex,
    });
  });
  const observer = new ResizeObserver(() => {
    if (!disposed && validSize()) chart.resize();
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
            : compileChatChart(input, options.chatPresentation, registry);
        if (chat && !chat.ok) return chat;
        const result = chat
          ? { ok: true as const, value: chat.value.plan }
          : compileChart(input, registry);
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
        try {
          chart.setOption(result.value.option, { notMerge: true });
        } catch {
          chart.clear();
          if (previous) {
            try {
              chart.setOption(previous.option, { notMerge: true });
            } catch {
              return failure(
                'RENDER_RECOVERY_FAILED',
                '',
                'Rendering and restoration failed. Recreate the runtime.',
              );
            }
          }
          return failure(
            'RENDER_FAILED',
            '',
            'Update failed; the previous valid plan was restored.',
          );
        }
        previous = result.value;
        revision++;
        return { ok: true, value: { revision } };
      },
      resize() {
        if (disposed)
          return failure('DISPOSED', '', 'Chart runtime is disposed.');
        if (!validSize())
          return failure(
            'INVALID_SIZE',
            '',
            'Container has invalid dimensions.',
          );
        chart.resize();
        return { ok: true, value: true };
      },
      dispose() {
        if (!disposed) {
          disposed = true;
          observer.disconnect();
          chart.dispose();
          owners.delete(container);
          previous = undefined;
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
