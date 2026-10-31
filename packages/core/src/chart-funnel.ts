import {
  failure,
  type ChartDocument02,
  type DataRegistry,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { record } from './guard.js';

export function compileFunnel(
  doc: ChartDocument02,
  registry: DataRegistry,
  compileChart02: (
    input: unknown,
    registry?: DataRegistry,
  ) => Result<RenderPlan>,
): Result<RenderPlan> {
  if (
    doc.chart.donut !== undefined ||
    doc.chart.area !== undefined ||
    doc.chart.orientation !== undefined ||
    doc.chart.stack !== undefined ||
    doc.chart.secondary !== undefined
  )
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart',
      'Funnel does not support these chart variants.',
    );
  const result = compileChart02(
    { ...doc, chart: { ...doc.chart, type: 'pie' } },
    registry,
  );
  if (!result.ok) return result;
  if (Array.isArray(result.value.option.series))
    result.value.option.series = result.value.option.series.map((series) =>
      record(series)
        ? {
            ...Object.fromEntries(
              Object.entries(series).filter(
                ([key]) =>
                  !['stillShowZeroSum', 'showEmptyCircle'].includes(key),
              ),
            ),
            type: 'funnel',
            sort: 'none',
          }
        : series,
    );
  // Funnel reuses pie data validation, not its share-specific presentation.
  if (result.value.dataState === 'no-share') {
    if (record(result.value.option.title))
      delete result.value.option.title.subtext;
    delete result.value.option.aria;
  }
  delete result.value.dataState;
  delete result.value.notices;
  return result;
}
