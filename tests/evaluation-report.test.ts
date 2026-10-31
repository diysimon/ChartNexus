import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';

test('aggregate reports preserve pending denominators and distinguish diagnostic code/path errors without leaking private text', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chartnexus-report-'));
  try {
    writeFileSync(
      join(directory, 'freeze.json'),
      JSON.stringify({
        models: [{ name: 'test-model' }],
        seeds: [42, 43, 44],
        mode: 'synthetic',
      }),
    );
    writeFileSync(
      join(directory, 'corpus.json'),
      JSON.stringify({
        tasks: [
          {
            id: 'diagnostic-1',
            kind: 'invalid',
            split: 'heldout',
            request: { prompt: 'PRIVATE_SENTINEL' },
            expected: {
              diagnosticCode: 'REVISION_CONFLICT',
              diagnosticPath: '/data/revision',
            },
          },
        ],
      }),
    );
    const attempt = {
      id: 'diagnostic-1',
      repeat: 0,
      attempt: 0,
      document: {
        diagnosticCode: 'REVISION_CONFLICT',
        diagnosticPath: 'wrong.path',
      },
      score: { correct: false, structuralValid: true },
      validation: { ok: false },
      raw: { message: { content: 'PRIVATE_SENTINEL' } },
      latencyMs: 5,
    };
    const log = join(directory, 'test-model.attempts.jsonl');
    const output = join(directory, 'aggregate.json');
    const report = () => {
      execFileSync(
        process.execPath,
        ['scripts/report-independent-evaluation.mjs', directory, output],
        { stdio: 'pipe', timeout: 15000 },
      );
      const text = readFileSync(output, 'utf8');
      expect(text).not.toContain('PRIVATE_SENTINEL');
      return JSON.parse(text);
    };
    writeFileSync(log, JSON.stringify(attempt) + '\n');
    const partial = report();
    expect(partial.status).toBe('in-progress');
    expect(partial.models[0]).toMatchObject({
      planned: 3,
      completed: 0,
      pending: 3,
      afterRepair: { successes: 0, total: 3, rate: 0 },
      diagnosticDetails: { first: { observed: 1, codeMatch: 1, pathMatch: 0 } },
    });
    const attempts = Array.from({ length: 3 }, (_, repeat) =>
      Array.from({ length: 3 }, (_, index) => ({
        ...attempt,
        repeat,
        attempt: index,
      })),
    ).flat();
    writeFileSync(
      log,
      attempts.map((a) => JSON.stringify(a)).join('\n') + '\n',
    );
    // Native JSON parse failures may embed a snippet of the private response.
    const finalAttempt = attempts[attempts.length - 1]!;
    Object.assign(finalAttempt.score, {
      error: 'Unexpected token in JSON: PRIVATE_SENTINEL',
    });
    writeFileSync(
      log,
      attempts.map((a) => JSON.stringify(a)).join('\n') + '\n',
    );
    const complete = report();
    expect(complete.status).toBe('complete');
    expect(complete.models[0]).toMatchObject({
      completed: 3,
      pending: 0,
      repairs: 6,
      diagnosticDetails: { last: { observed: 3, codeMatch: 3, pathMatch: 0 } },
    });
    expect(complete.models[0].failures).toHaveLength(3);
    expect(complete.models[0].failures[2].failures[2].error).toBe(
      'INVALID_JSON',
    );
    expect(complete.models[0].failures[0].failures[2]).toMatchObject({
      diagnosticCodeMatch: true,
      diagnosticPathMatch: false,
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
