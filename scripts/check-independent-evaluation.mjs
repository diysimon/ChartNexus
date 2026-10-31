import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMapAsset, mapCatalog } from '@chartnexus/echarts';
import {
  validateCorpus,
  requestForModel,
  scoreIndependent,
  summarizeIndependent,
  fingerprint,
  wilson,
  repairFeedback,
} from './independent-evaluation.mjs';
const corpus = validateCorpus(
  JSON.parse(
    await readFile('resources/evaluation/development-03.json', 'utf8'),
  ),
);
const prepared = createMapAsset(
  JSON.parse(await readFile('examples/maps/two-regions.json', 'utf8')),
);
assert(prepared.ok);
const catalog = mapCatalog({ [prepared.value.id]: prepared.value });
assert.equal(corpus.tasks.length, 10);
for (const task of corpus.tasks) {
  assert(scoreIndependent(task, task.reference, catalog).correct, task.id);
  assert(
    !JSON.stringify(requestForModel({ ...task, secret: 'oracle' })).includes(
      'expected',
    ),
  );
  const mutated = structuredClone(task.reference);
  mutated.data.kind === 'graph'
    ? mutated.data.links.rows[0].weight++
    : mutated.data.rows.reverse();
  assert(
    !scoreIndependent(task, mutated, catalog).correct,
    `mutation ${task.id}`,
  );
}
const one = corpus.tasks[0];
assert.throws(
  () => validateCorpus({ ...corpus, tasks: [one, one] }),
  /duplicate/,
);
assert.throws(
  () =>
    validateCorpus({
      ...corpus,
      tasks: [one, { ...one, id: 'second', split: 'heldout' }],
    }),
  /leakage/,
);
assert.throws(
  () =>
    validateCorpus({
      ...corpus,
      tasks: [{ ...one, expected: { ...one.expected, assertions: [] } }],
    }),
  /oracle/,
);
assert.equal(fingerprint({ b: 2, a: 1 }), fingerprint({ a: 1, b: 2 }));
assert.notEqual(fingerprint([1, 2]), fingerprint([2, 1]));
const summary = summarizeIndependent(
  [
    {
      id: 'test',
      repeat: 0,
      attempts: [
        { score: { correct: false, structuralValid: true } },
        { score: { correct: true } },
      ],
    },
  ],
  1,
);
assert.equal(summary.initial.successes, 0);
assert.equal(summary.afterRepair.successes, 1);
assert.equal(summary.initialStructure.successes, 1);
assert(wilson(0, 3)[1] > 0);
assert(wilson(3, 3)[0] < 1);
assert.equal(wilson(0, 0), null);
const invalid = {
  kind: 'invalid',
  expected: { diagnosticCode: 'INVALID_DATA', diagnosticPath: '/data' },
};
assert(
  scoreIndependent(invalid, {
    diagnosticCode: 'INVALID_DATA',
    diagnosticPath: '/data',
  }).correct,
);
assert(
  !scoreIndependent(invalid, {
    diagnosticCode: 'INVALID_DATA',
    diagnosticPath: '/data',
    document: {},
  }).correct,
);
console.log(
  '10 public 0.3 references plus mutation, split, oracle-boundary and statistics checks passed.',
);

assert.equal(
  repairFeedback({
    validation: { ok: true },
    score: { correct: false, failedAssertions: ['secret'] },
  }),
  null,
);
assert.deepEqual(
  repairFeedback({
    validation: { ok: false, diagnostics: [{ code: 'UNKNOWN_FIELD' }] },
    score: { correct: false },
  }),
  [{ code: 'UNKNOWN_FIELD' }],
);

// Registry metadata can cross the prompt boundary; host rows and oracle cannot.
const refTask = structuredClone(one);
const refDocument = structuredClone(one.reference);
const hostTable = {
  fields: refDocument.data.fields,
  rows: refDocument.data.rows,
};
refDocument.data = {
  kind: 'reference',
  id: 'synthetic-host-table',
  revision: 'v1',
};
refTask.registry = {
  'synthetic-host-table': { revision: 'v1', table: hostTable },
};
refTask.request = {
  prompt: 'Synthetic reference boundary test',
  dataCatalog: [
    { id: 'synthetic-host-table', revision: 'v1', fields: hostTable.fields },
  ],
};
refTask.expected.dataHash = fingerprint(refDocument.data);
assert(
  scoreIndependent(refTask, refDocument, catalog, refTask.registry).correct,
);
assert(!scoreIndependent(refTask, refDocument, catalog, {}).correct);
const corrupt = structuredClone(refTask.registry);
corrupt['synthetic-host-table'].table.rows.reverse();
assert(!scoreIndependent(refTask, refDocument, catalog, corrupt).correct);
assert(!JSON.stringify(requestForModel(refTask)).includes('"rows"'));
assert(!('registry' in requestForModel(refTask)));
