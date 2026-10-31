import {
  failure,
  type ChartDocument02,
  type DataRegistry,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { record } from './guard.js';

export function compileCombo(
  doc: ChartDocument02,
  registry: DataRegistry,
  compileChart02: (
    input: unknown,
    registry?: DataRegistry,
  ) => Result<RenderPlan>,
): Result<RenderPlan> {
  const { secondary, ...rest } = doc.chart;
  if (
    !secondary ||
    secondary.field === rest.encoding.y.field ||
    rest.encoding.x.type !== 'ordinal' ||
    rest.encoding.series ||
    rest.aggregate ||
    rest.stack !== undefined ||
    rest.orientation !== undefined ||
    rest.area !== undefined ||
    rest.donut !== undefined ||
    (rest.sort && rest.sort.by !== 'category')
  )
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart',
      'Combo requires distinct bar and line fields, ordinal categories and no grouping, aggregation, stack, variants or value sort.',
    );
  const firstUnit = rest.encoding.y.unit;
  const secondUnit = secondary.unit;
  const unitKey = (unit: typeof firstUnit) =>
    !unit
      ? ''
      : unit.kind === 'currency'
        ? `currency:${unit.code}`
        : unit.kind === 'percent'
          ? `percent:${unit.scale}`
          : `unit:${unit.label}`;
  const dualAxis = secondary.axis === 'right';
  if (
    (!dualAxis && unitKey(firstUnit) !== unitKey(secondUnit)) ||
    (dualAxis && (!firstUnit || !secondUnit))
  )
    return failure(
      'INVALID_ENCODING',
      '/chart/secondary/unit',
      'Shared axis requires equal units or both omitted; right axis requires explicit units for both measures.',
    );
  const primary = compileChart02(
    { ...doc, chart: { ...rest, type: 'bar' } },
    registry,
  );
  if (!primary.ok) return primary;
  const second = compileChart02(
    {
      ...doc,
      chart: {
        ...rest,
        type: 'line',
        encoding: {
          ...rest.encoding,
          y: {
            field: secondary.field,
            type: 'quantitative',
            ...(secondUnit ? { unit: secondUnit } : {}),
          },
        },
      },
    },
    registry,
  );
  if (!second.ok) return second;
  const primarySeries = primary.value.option.series;
  const secondarySeries = second.value.option.series;
  if (!Array.isArray(primarySeries) || !Array.isArray(secondarySeries))
    return failure(
      'INVALID_DATA',
      '/chart',
      'Combination chart requires valid series.',
    );
  primary.value.option.series = [
    ...primarySeries.map((item) =>
      record(item) ? { ...item, id: 'series:combo:bar' } : item,
    ),
    ...secondarySeries.map((item) =>
      record(item)
        ? {
            ...item,
            id: 'series:combo:line',
            ...(dualAxis ? { yAxisIndex: 1 } : {}),
          }
        : item,
    ),
  ];
  const axis = primary.value.option.yAxis;
  if (dualAxis) {
    const rightAxis = second.value.option.yAxis;
    if (!record(axis) || !record(rightAxis))
      return failure(
        'INVALID_DATA',
        '/chart/secondary',
        'Combination chart requires two value axes.',
      );
    primary.value.option.yAxis = [axis, { ...rightAxis, position: 'right' }];
    if (record(primary.value.option.grid))
      primary.value.option.grid = { ...primary.value.option.grid, right: 72 };
  } else if (record(axis) && typeof axis.name === 'string') {
    const suffix = axis.name.slice(rest.encoding.y.field.length);
    axis.name = `${rest.encoding.y.field} / ${secondary.field}${suffix}`;
  }
  primary.value.rowIndices = [
    ...primary.value.rowIndices,
    ...second.value.rowIndices,
  ];
  return primary;
}
