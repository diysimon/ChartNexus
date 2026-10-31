import { readFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { compileChart } from '@chartnexus/core';

const source = new URL('../resources/evaluation/tasks.json', import.meta.url);
const corpus = JSON.parse(await readFile(source, 'utf8'));
function resolvePointer(root, pointer) {
  if (pointer === '') return root;
  if (!pointer.startsWith('/')) return undefined;
  let value = root;
  for (const token of pointer.slice(1).split('/')) {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    if (
      value === null ||
      typeof value !== 'object' ||
      !Object.hasOwn(value, key)
    )
      return undefined;
    value = value[key];
  }
  return value;
}
export function evaluate(candidates) {
  if (
    !candidates ||
    typeof candidates !== 'object' ||
    Array.isArray(candidates)
  )
    throw new Error('Candidates must be an object keyed by task ID.');
  const known = new Set(corpus.tasks.map((task) => task.id));
  const extras = Object.keys(candidates).filter((key) => !known.has(key));
  if (extras.length) throw new Error(`Unknown task IDs: ${extras.join(', ')}`);
  const results = corpus.tasks.map((task) => {
    if (!Object.hasOwn(candidates, task.id))
      return {
        id: task.id,
        passed: false,
        compiled: false,
        reason: 'MISSING_CANDIDATE',
      };
    const candidate = candidates[task.id];
    const expected = task.expected;
    const compiled = compileChart(
      expected.result === 'diagnostic' ? task.inputDocument : candidate,
    );
    if (expected.result === 'diagnostic') {
      const matchesCode =
        !compiled.ok &&
        compiled.diagnostics.some(
          (item) =>
            item.code === expected.diagnosticCode &&
            item.path === expected.diagnosticPath,
        );
      const claimed =
        candidate &&
        typeof candidate === 'object' &&
        !Array.isArray(candidate) &&
        candidate.diagnosticCode === expected.diagnosticCode &&
        candidate.diagnosticPath === expected.diagnosticPath;
      const assertionFailures = expected.assertions
        .filter(
          (assertion) =>
            !isDeepStrictEqual(
              resolvePointer(task.inputDocument, assertion.pointer),
              assertion.equals,
            ),
        )
        .map((assertion) => assertion.pointer);
      return {
        id: task.id,
        passed: matchesCode && claimed && assertionFailures.length === 0,
        compiled: compiled.ok,
        reason:
          matchesCode && claimed
            ? assertionFailures.length
              ? 'ASSERTION_FAILED'
              : 'EXPECTED_DIAGNOSTIC'
            : 'DIAGNOSTIC_MISMATCH',
        assertionFailures,
      };
    }
    if (!compiled.ok)
      return {
        id: task.id,
        passed: false,
        compiled: false,
        reason: 'COMPILE_FAILED',
        diagnostics: compiled.diagnostics.map((item) => item.code),
      };
    const assertionFailures = expected.assertions
      .filter(
        (assertion) =>
          !isDeepStrictEqual(
            resolvePointer(
              assertion.target === 'document' ? candidate : compiled.value,
              assertion.pointer,
            ),
            assertion.equals,
          ),
      )
      .map((assertion) => assertion.pointer);
    return {
      id: task.id,
      passed: assertionFailures.length === 0,
      compiled: true,
      reason: assertionFailures.length ? 'ASSERTION_FAILED' : 'PASS',
      assertionFailures,
    };
  });
  return {
    corpusVersion: corpus.version,
    purpose: 'offline candidate checks; not a live-model evaluation',
    total: results.length,
    passed: results.filter((item) => item.passed).length,
    results,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let candidates;
  if (args.length === 1 && args[0] === '--self-check')
    candidates = Object.fromEntries(
      corpus.tasks.map((task) => [
        task.id,
        task.expected.result === 'diagnostic'
          ? {
              diagnosticCode: task.expected.diagnosticCode,
              diagnosticPath: task.expected.diagnosticPath,
            }
          : task.reference,
      ]),
    );
  else if (args.length === 2 && args[0] === '--candidates') {
    if ((await stat(args[1])).size > 25 * 1024 * 1024)
      throw new Error('Candidate file exceeds 25 MiB.');
    const text = await readFile(args[1], 'utf8');
    candidates = JSON.parse(text);
  } else
    throw new Error(
      'Usage: node scripts/evaluate.mjs --self-check | --candidates path.json',
    );
  const result = evaluate(candidates);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.passed !== result.total) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    process.stderr.write(`Evaluation error: ${error.message}\n`);
    process.exitCode = 2;
  });
