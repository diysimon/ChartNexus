import { createHash } from 'node:crypto';
import { compileChart } from '@chartnexus/core';

export function dataHash(rows) {
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}
/** Only the prompt crosses the model boundary; answers never enter retrieval resources. */
export function modelTask(task) {
  if (
    !['development', 'heldout'].includes(task.split) ||
    typeof task.id !== 'string' ||
    typeof task.family !== 'string' ||
    typeof task.prompt !== 'string'
  )
    throw new Error('Invalid evaluation task.');
  return { id: task.id, prompt: task.prompt };
}
export function scoreAttempt(task, document) {
  modelTask(task);
  const result = compileChart(document);
  const rows =
    document?.data?.kind === 'inline' ? document.data.rows : undefined;
  const dataFidelity =
    Array.isArray(rows) && dataHash(rows) === task.expectedDataHash;
  // Compare compiled numeric marks independently from chart choice. Bar/line/pie may all be valid.
  const values = result.ok
    ? (result.value.option.series ?? []).flatMap((series) =>
        (series.data ?? []).map((point) =>
          typeof point === 'number' || point === null
            ? point
            : Array.isArray(point)
              ? point.at(-1)
              : point.value,
        ),
      )
    : [];
  const renderedFidelity =
    JSON.stringify(values) === JSON.stringify(task.expectedValues);
  return {
    compiled: result.ok,
    dataFidelity,
    renderedFidelity,
    correct: result.ok && dataFidelity && renderedFidelity,
    ...(!result.ok ? { diagnostics: result.diagnostics } : {}),
  };
}
export function summarizeRun(tasks, candidates, metadata) {
  if (!metadata.model || !metadata.settings || !metadata.compilerRevision)
    throw new Error('Freeze model/settings/compiler revision.');
  const ids = new Set();
  const results = [];
  for (const task of tasks) {
    if (ids.has(task.id)) throw new Error('Duplicate task.');
    ids.add(task.id);
    const attempts = candidates.filter((item) => item.id === task.id);
    if (attempts.length > 3)
      throw new Error('At most initial plus two repairs.');
    const scored = attempts.map((item) => scoreAttempt(task, item.document));
    results.push({
      id: task.id,
      family: task.family,
      split: task.split,
      attempts: scored,
      initial: scored[0]?.correct ?? false,
      repaired: scored.some((item) => item.correct),
    });
  }
  if (candidates.some((item) => !ids.has(item.id)))
    throw new Error('Unknown candidate task.');
  return {
    metadata,
    total: tasks.length,
    initial: results.filter((item) => item.initial).length,
    afterRepair: results.filter((item) => item.repaired).length,
    results,
  };
}
