import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import corpus from '../resources/evaluation/tasks.json';
import bar from '../resources/recipes/bar.json';

const script = resolve('scripts/evaluate.mjs');
const references = (): Record<string, unknown> =>
  Object.fromEntries(
    corpus.tasks.map((task) => [
      task.id,
      task.expected.result === 'diagnostic'
        ? {
            diagnosticCode: task.expected.diagnosticCode,
            diagnosticPath: task.expected.diagnosticPath,
          }
        : structuredClone(task.reference),
    ]),
  );

describe('offline evaluation baseline', () => {
  test('contains twenty unique bilingual synthetic development tasks', () => {
    expect(corpus.tasks).toHaveLength(20);
    expect(new Set(corpus.tasks.map((task) => task.id)).size).toBe(20);
    for (const task of corpus.tasks) {
      expect(task.prompt.en.length).toBeGreaterThan(10);
      expect(task.prompt['zh-CN'].length).toBeGreaterThan(5);
      expect(task.split).toBe('development');
      expect(task.provenance).toMatchObject({
        origin: 'project-authored-synthetic',
        productionData: false,
      });
    }
    const result = JSON.parse(
      execFileSync(process.execPath, [script, '--self-check'], {
        encoding: 'utf8',
      }),
    );
    expect(result).toMatchObject({ passed: 20, total: 20 });
  });
  test('accepts an equivalent document and rejects a changed value, missing and unknown IDs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'chartnexus-eval-'));
    try {
      const file = join(dir, 'candidates.json');
      const candidates = references();
      const barCandidate = structuredClone(bar);
      barCandidate.id = 'another-id';
      candidates['create-bar'] = barCandidate;
      writeFileSync(file, JSON.stringify(candidates));
      let run = spawnSync(process.execPath, [script, '--candidates', file], {
        encoding: 'utf8',
      });
      expect(run.status).toBe(0);
      expect(JSON.parse(run.stdout).passed).toBe(20);
      barCandidate.data.rows[0]!.revenue = 999;
      delete candidates['create-line'];
      candidates['reject-unknown-field'] = {
        diagnosticCode: 'INVALID_DATA',
        diagnosticPath: '/chart/encoding',
      };
      writeFileSync(file, JSON.stringify(candidates));
      run = spawnSync(process.execPath, [script, '--candidates', file], {
        encoding: 'utf8',
      });
      const report = JSON.parse(run.stdout);
      expect(run.status).toBe(1);
      expect(
        report.results.find((item: { id: string }) => item.id === 'create-bar'),
      ).toMatchObject({ passed: false, reason: 'ASSERTION_FAILED' });
      expect(
        report.results.find(
          (item: { id: string }) => item.id === 'create-line',
        ),
      ).toMatchObject({ passed: false, reason: 'MISSING_CANDIDATE' });
      expect(
        report.results.find(
          (item: { id: string }) => item.id === 'reject-unknown-field',
        ),
      ).toMatchObject({ passed: false, reason: 'DIAGNOSTIC_MISMATCH' });
      candidates.unknown = candidates['create-bar'];
      writeFileSync(file, JSON.stringify(candidates));
      run = spawnSync(process.execPath, [script, '--candidates', file], {
        encoding: 'utf8',
      });
      expect(run.status).toBe(2);
      expect(run.stderr).toContain('Unknown task IDs');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
