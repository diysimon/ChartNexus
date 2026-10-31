import { compileChart } from '@chartnexus/core';
import { fingerprint, scoreIndependent } from './independent-evaluation.mjs';

export const semanticScoreVersion = 'reference-keyfield-equivalence-v1';

// This is a reporting-only correction, never input to model requests or repairs.
// A valid optional row identity can wrap marks in {id,value} without changing
// source identity or plotted values. Keep the strict score and original render.
export function scoreReferenceSemantics(task, candidate, catalog = {}) {
  const registry = task.registry ?? {};
  const strict = scoreIndependent(task, candidate, catalog, registry);
  if (task.kind === 'invalid' || !strict.compiled) return strict;
  const normalized = structuredClone(candidate);
  let changed = false;
  const removeOptionalKey = (source) => {
    if (source?.kind === 'reference' && Object.hasOwn(source, 'keyField')) {
      delete source.keyField;
      changed = true;
    }
  };
  removeOptionalKey(normalized.data);
  if (normalized.data?.kind === 'graph') {
    removeOptionalKey(normalized.data.nodes);
    removeOptionalKey(normalized.data.links);
  }
  // Exact expected source identity must still match. Never erase a required
  // key, revision, field, inline row, or identity asserted by the task.
  if (!changed || fingerprint(normalized.data) !== task.expected.dataHash)
    return strict;
  // Check original keys for missing fields, duplicates, etc. before normalization.
  if (!compileChart(candidate, registry, catalog).ok) return strict;
  return scoreIndependent(task, normalized, catalog, registry);
}

export function rescoreAttempt(task, attempt, catalog = {}) {
  if (attempt.score.error || !attempt.document) return attempt;
  const score = scoreReferenceSemantics(task, attempt.document, catalog);
  if (task.kind !== 'invalid') {
    score.rendered = attempt.rendered?.ok === true;
    score.correct &&= attempt.validation?.ok === true && score.rendered;
  }
  return { ...attempt, strictScore: attempt.score, score };
}
