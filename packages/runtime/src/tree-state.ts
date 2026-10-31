import type { JsonValue, RenderPlan } from '@chartnexus/schema';
const object = (v: unknown): v is Record<string, JsonValue> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
export function applyTreeState(
  plan: RenderPlan,
  collapsed: Record<string, boolean>,
): void {
  if (!plan.treeState) return;
  function visit(value: JsonValue): void {
    if (!object(value)) return;
    if (typeof value.id === 'string' && Object.hasOwn(collapsed, value.id))
      value.collapsed = collapsed[value.id]!;
    if (Array.isArray(value.children)) value.children.forEach(visit);
  }
  if (Array.isArray(plan.option.series))
    for (const series of plan.option.series)
      if (
        object(series) &&
        series.type === 'tree' &&
        Array.isArray(series.data)
      )
        series.data.forEach(visit);
  plan.treeState.collapsed = { ...collapsed };
}
export function retainTreeState(
  previous: RenderPlan | undefined,
  next: RenderPlan,
): void {
  if (!previous?.treeState || !next.treeState) return;
  if (
    previous.interactionKey === next.interactionKey &&
    previous.treeState.topologyKey === next.treeState.topologyKey
  ) {
    const retained = Object.fromEntries(
      Object.entries(next.treeState.collapsed).map(([id, initial]) => [
        id,
        previous.treeState!.collapsed[id] ?? initial,
      ]),
    );
    applyTreeState(next, retained);
  } else
    next.notices = [
      ...(next.notices ?? []),
      {
        code: 'STATE_RESET',
        severity: 'info',
        path: '/chart',
        message: 'Tree expansion reset because topology or encoding changed.',
      },
    ];
}
