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
  identityKey,
  newPlan,
  sourceBudget,
  validId,
  validateKeys,
} from './chart-03-common.js';
import { themeTokens } from './presentation.js';
export function compileSankey(
  doc: Extract<ChartDocument03, { chart: { type: 'sankey' } }>,
  registry: DataRegistry,
): Result<RenderPlan> {
  const nodes = resolveTable(doc.data.nodes, registry),
    links = resolveTable(doc.data.links, registry);
  if (!nodes.ok) return nodes;
  if (!links.ok) return links;
  const n = nodes.value.table,
    l = links.value.table,
    e = doc.chart.encoding;
  for (const check of [
    fieldsExist(n, [e.nodeId.field, e.nodeLabel.field]),
    fieldsExist(l, [e.source.field, e.target.field, e.value.field]),
    validateKeys(n, doc.data.nodes.keyField),
    validateKeys(l, doc.data.links.keyField),
    sourceBudget(n, l),
  ])
    if (!check.ok) return check;
  if (n.rows.length > 200 || l.rows.length > 1000)
    return failure(
      'INVALID_SANKEY',
      '/data',
      'Sankey supports at most 200 nodes and 1000 edges.',
    );
  const ids = new Map<string, number>(),
    adj = new Map<string, string[]>(),
    indegree = new Map<string, number>(),
    incoming = new Map<string, number>(),
    outgoing = new Map<string, number>();
  for (const [i, row] of n.rows.entries()) {
    const id = row[e.nodeId.field];
    if (
      !validId(id) ||
      ids.has(id) ||
      typeof row[e.nodeLabel.field] !== 'string'
    )
      return failure(
        'INVALID_SANKEY',
        `/data/nodes/rows/${i}`,
        'Node IDs must be unique nonempty strings and labels must be strings.',
      );
    ids.set(id, i);
    adj.set(id, []);
    indegree.set(id, 0);
    incoming.set(id, 0);
    outgoing.set(id, 0);
  }
  const pairs = new Set<string>(),
    active = new Set<string>(),
    dataLinks = [];
  const identities: NonNullable<RenderPlan['markIdentities']> = {};
  for (const [i, row] of l.rows.entries()) {
    const from = row[e.source.field],
      to = row[e.target.field],
      value = row[e.value.field];
    if (
      typeof from !== 'string' ||
      typeof to !== 'string' ||
      !ids.has(from) ||
      !ids.has(to) ||
      from === to ||
      typeof value !== 'number' ||
      value < 0
    )
      return failure(
        'INVALID_SANKEY',
        `/data/links/rows/${i}`,
        'Edges need existing different endpoints and finite nonnegative weights.',
      );
    const key = identityKey('edge', from, to);
    if (pairs.has(key))
      return failure(
        'INVALID_SANKEY',
        `/data/links/rows/${i}`,
        'Duplicate directed endpoint pairs are not allowed.',
      );
    pairs.add(key);
    adj.get(from)!.push(to);
    indegree.set(to, indegree.get(to)! + 1);
    incoming.set(to, incoming.get(to)! + value);
    outgoing.set(from, outgoing.get(from)! + value);
    if (
      !Number.isFinite(incoming.get(to)) ||
      !Number.isFinite(outgoing.get(from))
    )
      return failure(
        'NUMERIC_OVERFLOW',
        '/data/links',
        'Flow totals must remain finite.',
      );
    identities[key] = {
      identity: 'edge',
      edgeId: key,
      sourceId: from,
      targetId: to,
      rowIndex: i,
    };
    if (value > 0) {
      active.add(from);
      active.add(to);
      dataLinks.push({
        id: key,
        source: identityKey('node', from),
        target: identityKey('node', to),
        value,
      });
    }
  }
  const queue = [...ids.keys()].filter((id) => indegree.get(id) === 0);
  let visited = 0;
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]!;
    visited++;
    for (const to of adj.get(id)!) {
      indegree.set(to, indegree.get(to)! - 1);
      if (indegree.get(to) === 0) queue.push(to);
    }
  }
  if (visited !== ids.size)
    return failure(
      'INVALID_SANKEY',
      '/data/links',
      'Directed cycles (including zero-weight edges) are not supported.',
    );
  const plan = newPlan(
    doc,
    n,
    JSON.stringify([nodes.value.revision, links.value.revision]),
    `Sankey chart; ${n.rows.length} nodes and ${l.rows.length} source edges. Zero-weight edges and nodes without positive flow are not drawn but remain in the tables. Flow conservation and percentages are not inferred.`,
  );
  const tokens = themeTokens[doc.presentation?.theme ?? 'light'];
  plan.option.series = [
    {
      type: 'sankey',
      id: 'sankey',
      top: 60,
      bottom: 24,
      left: 24,
      right: 120,
      nodeWidth: 16,
      nodeGap: 12,
      draggable: false,
      layoutIterations: 32,
      label: {
        formatter: '{b}',
        show: true,
        color: tokens.text,
        overflow: 'truncate',
        width: 96,
      },
      lineStyle: { color: 'source', opacity: 0.4 },
      data: [...ids]
        .filter(([id]) => active.has(id))
        .map(([id, i]) => ({
          id: identityKey('node', id),
          name: String(n.rows[i]![e.nodeLabel.field]),
        })),
      links: dataLinks,
    },
  ];
  for (const [id, i] of ids)
    identities[identityKey('node', id)] = {
      identity: 'node',
      nodeId: id,
      rowIndex: i,
    };
  plan.markIdentities = identities;
  plan.flowBalance = [...ids.keys()].map((nodeId) => ({
    nodeId,
    incoming: incoming.get(nodeId)!,
    outgoing: outgoing.get(nodeId)!,
    difference: incoming.get(nodeId)! - outgoing.get(nodeId)!,
  }));
  plan.accessibility!.rendered = {
    columns: ['Source ID', 'Target ID', 'Value', 'Drawn'],
    rows: l.rows.map((row) => [
      row[e.source.field]!,
      row[e.target.field]!,
      row[e.value.field]!,
      Number(row[e.value.field]) > 0,
    ]),
  };
  plan.accessibility!.tables = [
    {
      title: 'Source links',
      columns: [...l.fields],
      rows: l.rows.map((row) => l.fields.map((f) => row[f] ?? null)),
    },
    {
      title: 'Flow balance (incoming minus outgoing; no conservation assumed)',
      columns: ['Node ID', 'Incoming', 'Outgoing', 'Difference'],
      rows: plan.flowBalance.map((n) => [
        n.nodeId,
        n.incoming,
        n.outgoing,
        n.difference,
      ]),
    },
  ];
  return { ok: true, value: plan };
}
