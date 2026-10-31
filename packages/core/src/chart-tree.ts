import {
  failure,
  type ChartDocument03,
  type DataRegistry,
  type JsonValue,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { resolveTable } from './data.js';
import {
  fieldsExist,
  identityKey,
  newPlan,
  sourceBudget,
  validId,
  validateKeys,
} from './chart-03-common.js';
import { themeTokens } from './presentation.js';
export function compileTree(
  doc: Extract<ChartDocument03, { chart: { type: 'tree' } }>,
  registry: DataRegistry,
): Result<RenderPlan> {
  const resolved = resolveTable(doc.data, registry);
  if (!resolved.ok) return resolved;
  const { table, revision } = resolved.value,
    c = doc.chart,
    e = c.encoding;
  const check = fieldsExist(table, [
    e.id.field,
    e.parentId.field,
    e.label.field,
  ]);
  if (!check.ok) return check;
  const budget = sourceBudget(table);
  if (!budget.ok) return budget;
  const keys = validateKeys(table, doc.data.keyField);
  if (!keys.ok) return keys;
  if (table.rows.length < 1 || table.rows.length > 1000)
    return failure('INVALID_TREE', '/data', 'A tree requires 1–1000 nodes.');
  const ids = new Map<string, number>(),
    parents = new Map<string, string | null>(),
    children = new Map<string, string[]>();
  for (const [i, row] of table.rows.entries()) {
    const id = row[e.id.field],
      parent = row[e.parentId.field],
      label = row[e.label.field];
    if (
      !validId(id) ||
      ids.has(id) ||
      (parent !== null && !validId(parent)) ||
      typeof label !== 'string'
    )
      return failure(
        'INVALID_TREE',
        `/data/rows/${i}`,
        'Use unique nonempty IDs, string labels and null only for the root parent.',
      );
    ids.set(id, i);
    parents.set(id, parent);
    children.set(id, []);
  }
  const roots: string[] = [];
  for (const [id, parent] of parents) {
    if (parent === null) roots.push(id);
    else {
      if (!ids.has(parent) || id === parent)
        return failure(
          'INVALID_TREE',
          '/data',
          'Parent does not exist or is the node itself.',
        );
      children.get(parent)!.push(id);
    }
  }
  if (roots.length !== 1)
    return failure('INVALID_TREE', '/data', 'Exactly one root is required.');
  const order: string[] = [],
    depths = new Map<string, number>(),
    stack: [string, number][] = [[roots[0]!, 0]];
  while (stack.length) {
    const [id, depth] = stack.pop()!;
    if (depth > 16 || depths.has(id))
      return failure(
        'INVALID_TREE',
        '/data',
        'Tree must be acyclic and at most depth 16 (root depth 0).',
      );
    depths.set(id, depth);
    order.push(id);
    for (const child of [...children.get(id)!].reverse())
      stack.push([child, depth + 1]);
  }
  if (order.length !== ids.size)
    return failure(
      'INVALID_TREE',
      '/data',
      'Every node must be reachable from the root; disconnected cycles are invalid.',
    );
  const tokens = themeTokens[doc.presentation?.theme ?? 'light'];
  const plan = newPlan(
    doc,
    table,
    revision,
    `Tree overview; ${ids.size} source nodes, initially expanded through depth ${c.initialDepth ?? 2}; collapsed descendants remain in the full table. Node count is not a value sum.`,
  );
  const nodes = new Map<string, Record<string, JsonValue>>(),
    collapsed: Record<string, boolean> = {},
    identities: NonNullable<RenderPlan['markIdentities']> = {};
  for (const id of [...order].reverse()) {
    const index = ids.get(id)!,
      key = identityKey('node', id),
      label = table.rows[index]![e.label.field] as string;
    collapsed[key] = (depths.get(id) ?? 0) >= (c.initialDepth ?? 2);
    nodes.set(id, {
      id: key,
      name: label,
      collapsed: collapsed[key]!,
      children: children.get(id)!.map((child) => nodes.get(child)!),
      label: {
        show: true,
        position: 'top',
        distance: 8,
        color: tokens.text,
        overflow: 'truncate',
        width: 96,
      },
    });
    identities[key] = { identity: 'node', nodeId: id, rowIndex: index };
  }
  plan.option.title = {
    ...(plan.option.title as Record<string, JsonValue>),
    subtext: `Tree overview · initial depth ${c.initialDepth ?? 2}`,
    subtextStyle: { color: tokens.text },
  };
  plan.option.series = [
    {
      type: 'tree',
      id: 'tree',
      data: [nodes.get(roots[0]!)!],
      top: 60,
      bottom: 32,
      left: 80,
      right: 100,
      initialTreeDepth: -1,
      expandAndCollapse: true,
      animation: false,
      symbolSize: 8,
      lineStyle: { color: tokens.axis },
      label: { show: true, color: tokens.text },
      leaves: { label: { show: true, color: tokens.text } },
    },
  ];
  plan.markIdentities = identities;
  plan.treeState = {
    topologyKey: JSON.stringify(
      [...parents].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
    nodeOrder: ['', ...order.map((id) => identityKey('node', id))],
    collapsed,
  };
  plan.notices = [
    {
      code: 'TREE_OVERVIEW',
      severity: 'info',
      path: '/chart/initialDepth',
      message:
        'Collapsed tree overview; the full source hierarchy is available in the data table and SVG metadata.',
    },
  ];
  return { ok: true, value: plan };
}
