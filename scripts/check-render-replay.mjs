import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createAgentService } from '@chartnexus/agent';
import { fingerprint } from './independent-evaluation.mjs';
const directory = await mkdtemp(join(tmpdir(), 'chartnexus-replay-'));
try {
  const document = JSON.parse(
    await readFile('resources/recipes/bar.json', 'utf8'),
  );
  const rendered = await createAgentService().execute('render_chart', {
    document,
  });
  assert.equal(rendered.ok, true);
  const corpus = { tasks: [{ id: 'replay-task', registry: {} }] };
  const freeze = {
    mode: 'synthetic-replay-check',
    models: [{ name: 'replay-check' }],
    sources: [],
    sourceHash: fingerprint([]),
    corpusHash: fingerprint(corpus),
    taskCount: 1,
    seeds: [42],
  };
  const write = async (name, value) =>
    writeFile(join(directory, name), JSON.stringify(value) + '\n');
  await write('freeze.json', freeze);
  await write('corpus.json', corpus);
  await write('status.json', { status: 'complete' });
  await write('summary.json', { models: { 'replay-check': { completed: 1 } } });
  const row = {
    id: 'replay-task',
    repeat: 0,
    attempt: 0,
    document,
    score: { correct: false },
    rendered: { ok: true },
    svgHash: createHash('sha256').update(rendered.value.svg).digest('hex'),
    raw: { message: { content: 'PRIVATE_SENTINEL' } },
  };
  await write('replay-check.attempts.jsonl', row);
  const output = join(directory, 'report.json');
  const run = (extra = []) =>
    spawnSync(
      process.execPath,
      ['scripts/replay-frozen-renders.mjs', directory, output, ...extra],
      { encoding: 'utf8', timeout: 15000 },
    );
  const passed = run();
  assert.equal(passed.status, 0, passed.stderr);
  let text = await readFile(output, 'utf8');
  assert.ok(!text.includes('PRIVATE_SENTINEL'));
  let report = JSON.parse(text);
  assert.equal(report.status, 'pass');
  assert.equal(report.replayed, 1);
  assert.equal(report.matchingSvgHashes, 1);
  await write('status.json', { status: 'running' });
  const incomplete = run();
  assert.equal(incomplete.status, 1);
  assert.match(incomplete.stderr, /completed run/);
  const preflight = run(['--limit', '1']);
  assert.equal(preflight.status, 0, preflight.stderr);
  report = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(report.status, 'preflight-only');
  await write('status.json', { status: 'complete' });
  row.svgHash = '0'.repeat(64);
  await write('replay-check.attempts.jsonl', row);
  const tampered = run();
  assert.equal(tampered.status, 1, tampered.stderr);
  report = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(report.status, 'fail');
  assert.equal(report.matchingSvgHashes, 0);
  assert.equal(report.failures.length, 1);
  console.log(
    'Render replay verifies identical SVGs, includes incorrect-but-rendered candidates, rejects mismatched hashes, and distinguishes incomplete/preflight runs.',
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
