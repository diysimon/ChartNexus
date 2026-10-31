import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { compileChart, validateChart03 } from '@chartnexus/core';

const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
export const fingerprint = (value) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
export function pointer(value, path) {
  if (path === '') return value;
  if (!path.startsWith('/')) throw new Error('Expected JSON pointer');
  for (const token of path.slice(1).split('/')) {
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
export function validateCorpus(corpus) {
  if (
    corpus.version !== '1' ||
    !Array.isArray(corpus.tasks) ||
    !corpus.tasks.length
  )
    throw new Error('Invalid corpus');
  const ids = new Set(),
    families = new Map();
  for (const task of corpus.tasks) {
    if (
      !task.id ||
      ids.has(task.id) ||
      !task.family ||
      !['development', 'heldout'].includes(task.split) ||
      !['chart', 'edit', 'invalid', 'recovery'].includes(task.kind)
    )
      throw new Error('Invalid/duplicate task');
    ids.add(task.id);
    if (families.has(task.family) && families.get(task.family) !== task.split)
      throw new Error('Family leakage');
    families.set(task.family, task.split);
    if (
      !task.request ||
      typeof task.request.prompt !== 'string' ||
      !task.expected
    )
      throw new Error('Missing request/oracle');
    if (task.kind === 'invalid') {
      if (
        !task.expected.diagnosticCode ||
        typeof task.expected.diagnosticPath !== 'string'
      )
        throw new Error('Missing diagnostic oracle');
    } else if (
      !task.expected.dataHash ||
      !task.expected.allowedTypes?.length ||
      !task.expected.assertions?.some((a) => a.target === 'plan') ||
      !task.expected.assertions.every(
        (a) =>
          ['plan', 'document'].includes(a.target) &&
          typeof a.pointer === 'string' &&
          Object.hasOwn(a, 'equals'),
      )
    )
      throw new Error('Missing independent data/mark oracle');
  }
  return corpus;
}
// A whitelist is essential: private oracle/provenance can never become a prompt.
export function requestForModel(task) {
  const result = { prompt: task.request.prompt };
  for (const key of [
    'data',
    'previousDocument',
    'inputDocument',
    'mapCatalog',
    'dataCatalog',
  ])
    if (Object.hasOwn(task.request, key)) result[key] = task.request[key];
  return structuredClone(result);
}
export function scoreIndependent(task, candidate, catalog = {}, registry = {}) {
  if (task.kind === 'invalid') {
    const correct =
      candidate?.diagnosticCode === task.expected.diagnosticCode &&
      candidate?.diagnosticPath === task.expected.diagnosticPath &&
      Object.keys(candidate).every((k) =>
        ['diagnosticCode', 'diagnosticPath'].includes(k),
      );
    return {
      jsonValid: true,
      structuralValid:
        typeof candidate?.diagnosticCode === 'string' &&
        typeof candidate?.diagnosticPath === 'string' &&
        Object.keys(candidate).every((k) =>
          ['diagnosticCode', 'diagnosticPath'].includes(k),
        ),
      compiled: false,
      dataFidelity: null,
      renderedFidelity: null,
      taskCorrect: correct,
      correct,
    };
  }
  const structuralValid = validateChart03(candidate, candidate?.chart?.type).ok;
  const result = compileChart(candidate, registry, catalog);
  const dataFidelity =
    !!candidate?.data && fingerprint(candidate.data) === task.expected.dataHash;
  const assertions = task.expected.assertions.map((a) => ({
    ...a,
    passed: isDeepStrictEqual(
      pointer(
        a.target === 'plan'
          ? result.ok
            ? result.value
            : undefined
          : candidate,
        a.pointer,
      ),
      a.equals,
    ),
  }));
  const renderedFidelity =
    result.ok &&
    assertions.filter((a) => a.target === 'plan').every((a) => a.passed);
  const taskCorrect =
    task.expected.allowedTypes.includes(candidate?.chart?.type) &&
    assertions.filter((a) => a.target === 'document').every((a) => a.passed);
  return {
    jsonValid: true,
    structuralValid,
    compiled: result.ok,
    dataFidelity,
    renderedFidelity,
    taskCorrect,
    correct:
      structuralValid &&
      result.ok &&
      dataFidelity &&
      renderedFidelity &&
      taskCorrect,
    ...(!result.ok ? { diagnostics: result.diagnostics } : {}),
    failedAssertions: assertions
      .filter((a) => !a.passed)
      .map((a) => ({ target: a.target, pointer: a.pointer })),
  };
}
export function wilson(successes, total) {
  if (!total) return null;
  const z = 1.959963984540054,
    p = successes / total,
    d = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / d,
    half =
      (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) /
      d;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
export function summarizeIndependent(records, expectedTotal) {
  const metric = (fn) => {
    const successes = records.filter(fn).length;
    return {
      successes,
      total: expectedTotal,
      rate: successes / expectedTotal,
      wilson95: wilson(successes, expectedTotal),
    };
  };
  return {
    expectedTotal,
    completed: records.length,
    pending: expectedTotal - records.length,
    initialStructure: metric((r) => r.attempts[0]?.score.structuralValid),
    initial: metric((r) => r.attempts[0]?.score.correct),
    afterRepair: metric((r) => r.attempts.some((a) => a.score.correct)),
    failureIds: records
      .filter((r) => !r.attempts.some((a) => a.score.correct))
      .map((r) => ({ id: r.id, repeat: r.repeat })),
    confidenceNote:
      'Descriptive attempt-level Wilson intervals; repeated tasks are correlated, not independent population samples.',
  };
}

/** Production-observable feedback only; oracle failures never trigger retries. */
export function repairFeedback(attempt) {
  if (attempt.validation && !attempt.validation.ok)
    return attempt.validation.diagnostics;
  if (attempt.rendered && !attempt.rendered.ok)
    return attempt.rendered.diagnostics;
  if (attempt.score.error)
    return [
      {
        code: 'INVALID_RESPONSE',
        message:
          'Response was incomplete or invalid JSON; return a complete response within the supplied schema and output budget.',
      },
    ];
  return null;
}
