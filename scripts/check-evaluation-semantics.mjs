import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fingerprint, scoreIndependent } from './independent-evaluation.mjs';
import {
  rescoreAttempt,
  scoreReferenceSemantics,
} from './evaluation-semantics.mjs';
const data = { kind: 'reference', id: 'counts', revision: 'r1' };
const registry = {
  counts: {
    revision: 'r1',
    table: {
      fields: ['label', 'value', 'duplicate'],
      rows: [
        { label: 'A', value: 2, duplicate: 'same' },
        { label: 'B', value: 3, duplicate: 'same' },
      ],
    },
  },
};
const document = {
  schemaVersion: '0.3',
  id: 'identity-check',
  mode: 'intent',
  data,
  chart: {
    type: 'bar',
    encoding: {
      x: { field: 'label', type: 'ordinal' },
      y: { field: 'value', type: 'quantitative' },
    },
  },
};
const task = {
  kind: 'chart',
  registry,
  expected: {
    dataHash: fingerprint(data),
    allowedTypes: ['bar'],
    assertions: [
      { target: 'plan', pointer: '/option/series/0/data', equals: [2, 3] },
      {
        target: 'document',
        pointer: '/chart/encoding/y/field',
        equals: 'value',
      },
    ],
  },
};
const keyed = { ...document, data: { ...data, keyField: 'label' } };
assert.equal(scoreIndependent(task, keyed, {}, registry).correct, false);
assert.equal(scoreReferenceSemantics(task, document).correct, true);
assert.equal(scoreReferenceSemantics(task, keyed).correct, true);
for (const keyField of ['missing', 'duplicate'])
  assert.equal(
    scoreReferenceSemantics(task, { ...document, data: { ...data, keyField } })
      .correct,
    false,
  );
for (const data of [
  { ...keyed.data, id: 'wrong' },
  { ...keyed.data, revision: 'r2' },
])
  assert.equal(
    scoreReferenceSemantics(task, { ...document, data }).correct,
    false,
  );
const changed = structuredClone(task);
changed.registry.counts.table.rows[0].value = 200;
assert.equal(scoreReferenceSemantics(changed, keyed).correct, false);
const requiredKey = {
  ...task,
  expected: { ...task.expected, dataHash: fingerprint(keyed.data) },
};
assert.equal(scoreReferenceSemantics(requiredKey, document).correct, false);
const explicitKey = {
  ...task,
  expected: {
    ...task.expected,
    assertions: [
      ...task.expected.assertions,
      { target: 'document', pointer: '/data/keyField', equals: 'label' },
    ],
  },
};
assert.equal(scoreReferenceSemantics(explicitKey, keyed).correct, false);
const attempt = {
  document: keyed,
  score: scoreIndependent(task, keyed, {}, registry),
  validation: { ok: true },
  rendered: { ok: true },
  svgHash: 'original-render',
};
const before = structuredClone(attempt);
const result = rescoreAttempt(task, attempt);
assert.equal(result.score.correct, true);
assert.equal(result.strictScore.correct, false);
assert.equal(result.svgHash, 'original-render');
assert.deepEqual(attempt, before);
assert.equal(
  rescoreAttempt(task, { ...attempt, rendered: { ok: false } }).score.correct,
  false,
);
const error = { ...attempt, score: { error: 'deadline', correct: false } };
assert.deepEqual(rescoreAttempt(task, error), error);
// Graph references have independent node/link keys; normalization must not
// accept a changed graph version or a broken endpoint just because ids match.
const graph = JSON.parse(
  readFileSync('resources/recipes/sankey-03.json', 'utf8'),
);
const graphRegistry = {};
for (const part of ['nodes', 'links']) {
  const { fields, rows } = graph.data[part];
  graphRegistry[part] = { revision: 'r1', table: { fields, rows } };
  graph.data[part] = { kind: 'reference', id: part, revision: 'r1' };
}
const graphTask = {
  kind: 'chart',
  registry: graphRegistry,
  expected: {
    dataHash: fingerprint(graph.data),
    allowedTypes: ['sankey'],
    assertions: [
      { target: 'plan', pointer: '/option/series/0/links/0/value', equals: 12 },
      { target: 'plan', pointer: '/option/series/0/links/1/value', equals: 9 },
    ],
  },
};
graph.data.nodes.keyField = 'id';
assert.equal(scoreReferenceSemantics(graphTask, graph).correct, true);
const graphBroken = structuredClone(graphTask);
graphBroken.registry.links.table.rows[0].to = 'absent';
assert.equal(scoreReferenceSemantics(graphBroken, graph).correct, false);
const wrongGraph = structuredClone(graph);
wrongGraph.data.links.revision = 'r2';
assert.equal(scoreReferenceSemantics(graphTask, wrongGraph).correct, false);
// Inline identity/value fidelity stays strict.
const inline = {
  ...document,
  data: { kind: 'inline', ...registry.counts.table },
};
const inlineTask = {
  ...task,
  expected: { ...task.expected, dataHash: fingerprint(inline.data) },
};
assert.equal(scoreReferenceSemantics(inlineTask, inline).correct, true);
assert.equal(
  scoreReferenceSemantics(inlineTask, {
    ...inline,
    data: { ...inline.data, keyField: 'label' },
  }).correct,
  false,
);
console.log(
  'Reference identity correction: equivalent keys pass; invalid keys, wrong sources, changed marks, failed renders and errors remain failures.',
);
