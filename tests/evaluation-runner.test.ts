import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
test('frozen evaluator resumes without duplicate attempts and refuses changed corpora', () => {
  const output = mkdtempSync(join(tmpdir(), 'chartnexus-eval-'));
  const corpusPath = join(output, 'corpus-input.json');
  const corpus = JSON.parse(
    readFileSync('resources/evaluation/development-03.json', 'utf8'),
  );
  corpus.tasks = corpus.tasks.slice(0, 1);
  writeFileSync(corpusPath, JSON.stringify(corpus));
  const args = [
    'scripts/run-independent-evaluation.mjs',
    '--self-test',
    '--corpus',
    corpusPath,
    '--models',
    'harness-selftest',
    '--output',
    output,
  ];
  execFileSync(process.execPath, args, { stdio: 'pipe', timeout: 30000 });
  const log = readFileSync(
    join(output, 'harness-selftest.attempts.jsonl'),
    'utf8',
  );
  const summary = JSON.parse(
    readFileSync(join(output, 'summary.json'), 'utf8'),
  );
  expect(summary.models['harness-selftest']).toMatchObject({
    completed: 3,
    pending: 0,
    initial: { successes: 0 },
    afterRepair: { successes: 0 },
  });
  expect(log.trim().split('\n')).toHaveLength(9);
  execFileSync(process.execPath, [...args, '--resume'], {
    stdio: 'pipe',
    timeout: 30000,
  });
  expect(
    readFileSync(join(output, 'harness-selftest.attempts.jsonl'), 'utf8'),
  ).toBe(log);
  const changed = JSON.parse(readFileSync(corpusPath, 'utf8'));
  changed.tasks[0].request.prompt += ' Changed request.';
  const path = join(output, 'changed.json');
  writeFileSync(path, JSON.stringify(changed));
  const changedArgs = [...args, '--resume'];
  changedArgs[changedArgs.indexOf('--corpus') + 1] = path;
  const result = spawnSync(process.execPath, changedArgs, {
    encoding: 'utf8',
    timeout: 30000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('corpusHash drift');
  expect(
    readFileSync(join(output, 'harness-selftest.attempts.jsonl'), 'utf8'),
  ).toBe(log);
}, 60000);
