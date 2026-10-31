import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { createAgentService } from '@chartnexus/agent';
import { createMapAsset } from '@chartnexus/echarts';
import { fingerprint } from './independent-evaluation.mjs';

const args = process.argv.slice(2);
const directory = resolve(args[0] ?? 'outputs/m4-holdout-v2');
const output = resolve(args[1] ?? join(directory, 'render-replay.json'));
const limit = args.includes('--limit')
  ? Number(args[args.indexOf('--limit') + 1])
  : Infinity;
if (limit !== Infinity && (!Number.isSafeInteger(limit) || limit < 1))
  throw new Error('Invalid replay limit');
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const freeze = await json(join(directory, 'freeze.json'));
const corpus = await json(join(directory, 'corpus.json'));
if (fingerprint(freeze.sources) !== freeze.sourceHash)
  throw new Error('Frozen source manifest drift');
if (fingerprint(corpus) !== freeze.corpusHash) throw new Error('Corpus drift');
if (limit === Infinity) {
  if ((await json(join(directory, 'status.json'))).status !== 'complete')
    throw new Error('Full replay requires a completed run');
  const summary = await json(join(directory, 'summary.json'));
  if (
    freeze.models.some(
      (model) =>
        summary.models[model.name]?.completed !==
        freeze.taskCount * freeze.seeds.length,
    )
  )
    throw new Error('Incomplete model rounds');
}
// The only reviewed post-run runtime change is restoring native marker modules.
// A compiler/schema/runner change requires a separate evaluation, not this replay.
const allowed = new Set([
  'packages/echarts/src/engine.ts',
  'packages/echarts/dist/engine.js',
]);
const finalSources = [],
  changes = [];
for (const [file, previous] of freeze.sources) {
  const current = fingerprint(await readFile(file, 'utf8'));
  finalSources.push([file, current]);
  if (current !== previous) {
    if (!allowed.has(file))
      throw new Error(`Unreviewed frozen source change: ${file}`);
    changes.push({ file, previous, current });
  }
}
const prepared = createMapAsset(await json('examples/maps/two-regions.json'));
if (!prepared.ok) throw new Error('Map fixture failed');
const maps = { [prepared.value.id]: prepared.value };
const tasks = new Map(corpus.tasks.map((task) => [task.id, task]));
const candidates = [],
  identities = new Set();
for (const model of freeze.models) {
  let lines;
  try {
    lines = (
      await readFile(
        join(
          directory,
          `${model.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_')}.attempts.jsonl`,
        ),
        'utf8',
      )
    ).split('\n');
  } catch (error) {
    if (limit !== Infinity && error.code === 'ENOENT') continue;
    throw error;
  }
  if (lines.at(-1) !== '') {
    if (limit === Infinity) throw new Error('Incomplete attempt record');
    lines = lines.slice(0, -1);
  }
  for (const line of lines.filter(Boolean)) {
    const row = JSON.parse(line);
    if (!row.rendered?.ok) continue;
    const identity = JSON.stringify([
      model.name,
      row.id,
      row.repeat,
      row.attempt,
    ]);
    if (
      identities.has(identity) ||
      !tasks.has(row.id) ||
      !row.document ||
      !/^[a-f0-9]{64}$/.test(row.svgHash)
    )
      throw new Error('Invalid/duplicate rendered attempt');
    identities.add(identity);
    candidates.push({ ...row, model: model.name });
  }
}
if (!candidates.length) throw new Error('No rendered candidates');
let matched = 0;
const failures = [];
const selected = candidates.slice(0, limit);
for (const [index, candidate] of selected.entries()) {
  const task = tasks.get(candidate.id);
  const service = createAgentService({ maps, registry: task.registry ?? {} });
  const rendered = await service.execute('render_chart', {
    document: candidate.document,
  });
  const actual = rendered.ok
    ? createHash('sha256').update(rendered.value.svg).digest('hex')
    : null;
  if (actual === candidate.svgHash) matched++;
  else
    failures.push({
      model: candidate.model,
      id: candidate.id,
      repeat: candidate.repeat,
      attempt: candidate.attempt,
      expectedHash: candidate.svgHash,
      actualHash: actual,
      diagnostics: rendered.ok ? [] : rendered.diagnostics.map((d) => d.code),
    });
  if ((index + 1) % 25 === 0)
    console.log(`Replayed ${index + 1}/${selected.length}`);
}
const report = {
  status: failures.length
    ? 'fail'
    : limit === Infinity
      ? 'pass'
      : 'preflight-only',
  generated: new Date().toISOString(),
  node: process.version,
  mode: freeze.mode,
  toolHash: fingerprint(await readFile(import.meta.filename, 'utf8')),
  corpusHash: freeze.corpusHash,
  evaluatedSourceHash: freeze.sourceHash,
  finalSourceHash: fingerprint(finalSources),
  reviewedSourceChanges: changes,
  unchangedFrozenFiles: freeze.sources.length - changes.length,
  originalRenderCount: candidates.length,
  replayed: selected.length,
  matchingSvgHashes: matched,
  failures,
  scope:
    'Full mode replays every originally successful render, including semantically incorrect candidates; limited mode is preflight only. Original requests, scores, timings and failures remain unchanged. Native marker compatibility is verified separately.',
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    status: report.status,
    replayed: selected.length,
    matchingSvgHashes: matched,
    output,
  }),
);
if (failures.length) process.exitCode = 1;
