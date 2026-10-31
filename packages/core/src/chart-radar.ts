import {
  failure,
  type ChartDocument03,
  type DataRegistry,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { resolveTable } from './data.js';
import {
  fieldsExist,
  newPlan,
  sourceBudget,
  validId,
  validateKeys,
  unitLabel,
} from './chart-03-common.js';
import { themeTokens } from './presentation.js';
export function compileRadar(
  doc: Extract<ChartDocument03, { chart: { type: 'radar' } }>,
  registry: DataRegistry,
): Result<RenderPlan> {
  const resolved = resolveTable(doc.data, registry);
  if (!resolved.ok) return resolved;
  const { table, revision } = resolved.value,
    c = doc.chart;
  const check = fieldsExist(table, [
    c.encoding.item.field,
    ...c.indicators.map((i) => i.field),
  ]);
  if (!check.ok) return check;
  const budget = sourceBudget(table);
  if (!budget.ok) return budget;
  const keys = validateKeys(table, doc.data.keyField);
  if (!keys.ok) return keys;
  if (
    table.rows.length < 1 ||
    table.rows.length > 6 ||
    new Set(c.indicators.map((i) => i.field)).size !== c.indicators.length ||
    c.indicators.some((i) => !Number.isFinite(i.max - i.min) || i.min >= i.max)
  )
    return failure(
      'INVALID_RADAR',
      '/chart/indicators',
      'Use 1–6 items and distinct indicators with finite min < max ranges.',
    );
  const names = new Set<string>();
  const data = [];
  for (const [index, row] of table.rows.entries()) {
    const name = row[c.encoding.item.field];
    if (!validId(name) || names.has(name))
      return failure(
        'INVALID_RADAR',
        `/data/rows/${index}`,
        'Radar item names must be unique nonempty strings.',
      );
    names.add(name);
    const values: number[] = [];
    for (const i of c.indicators) {
      const v = row[i.field];
      if (typeof v !== 'number' || v < i.min || v > i.max)
        return failure(
          'INVALID_RADAR',
          `/data/rows/${index}`,
          'Indicators require numeric values inside their explicit range; missing values are not imputed.',
        );
      values.push(v);
    }
    data.push({ id: JSON.stringify(['item', name]), name, value: values });
  }
  const tokens = themeTokens[doc.presentation?.theme ?? 'light'];
  const plan = newPlan(
    doc,
    table,
    revision,
    'Radar chart; independent explicit indicator ranges, no normalization. ' +
      c.indicators
        .map(
          (i) =>
            `${i.label}: ${i.min}..${i.max}${i.unit ? ' ' + unitLabel(i.unit) : ''}`,
        )
        .join('; '),
  );
  plan.option.radar = {
    indicator: c.indicators.map((i) => ({
      name: i.label,
      min: i.min,
      max: i.max,
    })),
    radius: '55%',
    axisName: { color: tokens.text },
    axisLine: { lineStyle: { color: tokens.axis } },
    splitLine: { lineStyle: { color: tokens.axis } },
    splitArea: { show: false },
  };
  plan.option.legend = {
    show: true,
    bottom: 0,
    data: [...names],
    textStyle: { color: tokens.text },
  };
  plan.option.series = [
    {
      type: 'radar',
      id: 'radar',
      data,
      label: {
        show: doc.presentation?.dataLabels?.show ?? false,
        color: tokens.text,
      },
    },
  ];
  plan.rowIndices = [table.rows.map((_, i) => i)];
  if (keys.value.length) plan.rowKeys = [keys.value];
  plan.accessibility!.columns = table.fields.map((f) => {
    const i = c.indicators.find((i) => i.field === f);
    return i?.unit ? `${f} (${unitLabel(i.unit)})` : f;
  });
  return { ok: true, value: plan };
}
