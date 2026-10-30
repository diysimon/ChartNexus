import * as echarts from 'echarts';
import { compileChart, limits } from '@chartnexus/core';
import {
  failure,
  type DataRegistry,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';

export interface SelectionEvent {
  chartId: string;
  chartRevision: number;
  dataRevision: string;
  type: 'select';
  identity: 'position';
  seriesIndex: number;
  dataIndex: number;
  rowIndex: number | null;
}
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
    const rowIndex =
      previous.rowIndices[params.seriesIndex]?.[params.dataIndex];
    onSelect({
      chartId: previous.chartId,
      chartRevision: revision,
      dataRevision: previous.dataRevision,
      type: 'select',
      identity: 'position',
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
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
        const result = compileChart(input, registry);
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
