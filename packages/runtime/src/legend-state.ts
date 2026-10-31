import type { JsonValue, RenderPlan } from '@chartnexus/schema';
function record(value: unknown): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function legendEntries(
  plan: RenderPlan,
): { key: string; name: string }[] {
  const series = Array.isArray(plan.option.series)
    ? plan.option.series.filter(record)
    : [];
  return series.flatMap((item) =>
    item.type === 'pie' || item.type === 'funnel' || item.type === 'radar'
      ? Array.isArray(item.data)
        ? item.data.flatMap((point) =>
            record(point) && typeof point.name === 'string'
              ? [
                  {
                    key: JSON.stringify(['item', point.name]),
                    name: point.name,
                  },
                ]
              : [],
          )
        : []
      : typeof item.name === 'string'
        ? [{ key: String(item.id ?? item.name), name: item.name }]
        : [],
  );
}
export function retainLegend(
  previous: RenderPlan | undefined,
  next: RenderPlan,
  selection: Record<string, boolean>,
): Record<string, boolean> {
  const entries = legendEntries(next);
  const selected: Record<string, boolean> = {};
  const compatible =
    previous?.interactionKey !== undefined &&
    previous.interactionKey === next.interactionKey;
  const old = new Map(
    previous
      ? legendEntries(previous).map((item) => [item.key, item.name])
      : [],
  );
  for (const entry of entries)
    selected[entry.name] =
      compatible && old.has(entry.key)
        ? selection[old.get(entry.key)!] !== false
        : true;
  if (previous?.interactionKey && next.interactionKey && !compatible)
    next.notices = [
      ...(next.notices ?? []),
      {
        code: 'STATE_RESET',
        severity: 'info',
        path: '/chart',
        message: 'Legend selection reset because chart semantics changed.',
      },
    ];
  if (record(next.option.legend))
    next.option.legend = { ...next.option.legend, selected };
  return selected;
}

/** zrender clones legend.selected via hasOwnProperty; reserved names need rendering-only aliases. */
export function prepareLegendNames(plan: RenderPlan): void {
  const entries = legendEntries(plan);
  const occupied = new Set(entries.map((item) => item.name));
  const aliases = new Map<string, string>();
  for (const name of ['__proto__', 'constructor', 'hasOwnProperty']) {
    if (!occupied.has(name)) continue;
    let alias = '\u200b' + name;
    while (occupied.has(alias)) alias = '\u200b' + alias;
    occupied.add(alias);
    aliases.set(name, alias);
  }
  if (!aliases.size) return;
  plan.legendLabels = Object.fromEntries(
    [...aliases].map(([raw, alias]) => [alias, raw]),
  );
  if (record(plan.option.legend) && Array.isArray(plan.option.legend.data))
    plan.option.legend.data = plan.option.legend.data.map((name) =>
      typeof name === 'string' ? (aliases.get(name) ?? name) : name,
    );
  if (Array.isArray(plan.option.series))
    plan.option.series = plan.option.series.map((series) => {
      if (!record(series)) return series;
      return {
        ...series,
        ...(typeof series.name === 'string'
          ? { name: aliases.get(series.name) ?? series.name }
          : {}),
        ...(Array.isArray(series.data)
          ? {
              data: series.data.map((point) =>
                record(point) && typeof point.name === 'string'
                  ? { ...point, name: aliases.get(point.name) ?? point.name }
                  : point,
              ),
            }
          : {}),
      };
    });
}
