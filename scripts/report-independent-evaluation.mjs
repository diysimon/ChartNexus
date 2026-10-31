import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fingerprint, wilson } from './independent-evaluation.mjs';
const directory = resolve(process.argv[2] ?? 'outputs/m4-baseline-v1');
const output = resolve(process.argv[3] ?? join(directory, 'aggregate.json'));
const freeze = JSON.parse(
  await readFile(join(directory, 'freeze.json'), 'utf8'),
);
const corpus = JSON.parse(
  await readFile(join(directory, 'corpus.json'), 'utf8'),
);
const metric = (attempts, key) => {
  const eligible = attempts.filter((a) => typeof a.score[key] === 'boolean'),
    successes = eligible.filter((a) => a.score[key]).length;
  return {
    successes,
    total: eligible.length,
    rate: eligible.length ? successes / eligible.length : null,
    wilson95: wilson(successes, eligible.length),
  };
};
const models = [];
for (const model of freeze.models) {
  let attempts = [];
  try {
    const lines = (
      await readFile(
        join(
          directory,
          `${model.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_')}.attempts.jsonl`,
        ),
        'utf8',
      )
    ).split('\n');
    if (lines.at(-1) !== '') lines.pop();
    attempts = lines.filter(Boolean).map(JSON.parse);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const tasks = [];
  for (const task of corpus.tasks)
    for (let repeat = 0; repeat < freeze.seeds.length; repeat++) {
      const rows = attempts.filter(
        (a) => a.id === task.id && a.repeat === repeat,
      );
      // A valid-but-incorrect output is terminal: no oracle-assisted extra attempts.
      const last = rows.at(-1),
        terminal =
          !!last &&
          (last.score.correct ||
            rows.length === 3 ||
            (!last.score.error &&
              last.validation?.ok &&
              (!last.rendered || last.rendered.ok)));
      tasks.push({
        id: task.id,
        repeat,
        kind: task.kind,
        split: task.split,
        attempts: rows.length,
        terminal,
        initial: rows[0]?.score.correct ?? false,
        afterRepair: rows.some((a) => a.score.correct),
        failures:
          terminal && !rows.some((a) => a.score.correct)
            ? rows.map((a) => ({
                attempt: a.attempt,
                error: a.score.error ?? null,
                diagnostics: a.score.diagnostics?.map((d) => d.code) ?? [],
                dataFidelity: a.score.dataFidelity ?? null,
                renderedFidelity: a.score.renderedFidelity ?? null,
                taskCorrect: a.score.taskCorrect ?? null,
              }))
            : [],
      });
    }
  const first = attempts.filter((a) => a.attempt === 0),
    latencies = attempts.map((a) => a.latencyMs).sort((a, b) => a - b);
  const byKind = Object.fromEntries(
    ['chart', 'edit', 'invalid', 'recovery'].map((kind) => {
      const rows = tasks.filter((t) => t.kind === kind),
        complete = rows.filter((t) => t.terminal);
      return [
        kind,
        {
          planned: rows.length,
          completed: complete.length,
          initial: complete.filter((t) => t.initial).length,
          afterRepair: complete.filter((t) => t.afterRepair).length,
        },
      ];
    }),
  );
  models.push({
    name: model.name,
    digest: model.digest,
    quantization: model.details?.quantization_level,
    planned: tasks.length,
    completed: tasks.filter((t) => t.terminal).length,
    pending: tasks.filter((t) => !t.terminal).length,
    firstPass: Object.fromEntries(
      [
        'jsonValid',
        'structuralValid',
        'compiled',
        'dataFidelity',
        'renderedFidelity',
        'taskCorrect',
        'correct',
      ].map((key) => [key, metric(first, key)]),
    ),
    afterRepair: {
      successes: tasks.filter((t) => t.afterRepair).length,
      total: tasks.length,
      wilson95: wilson(tasks.filter((t) => t.afterRepair).length, tasks.length),
    },
    repairs: attempts.filter((a) => a.attempt > 0).length,
    attempts: attempts.length,
    responseTokens: attempts.reduce((n, a) => n + (a.raw?.eval_count ?? 0), 0),
    latency: latencies.length
      ? {
          medianMs: latencies[Math.floor(latencies.length / 2)],
          p95Ms: latencies[Math.ceil(latencies.length * 0.95) - 1],
        }
      : null,
    byKind,
    failures: tasks
      .filter((t) => t.failures.length)
      .map(({ id, repeat, failures }) => ({ id, repeat, failures })),
  });
}
const complete = models.every((m) => m.pending === 0);
const report = {
  status: complete ? 'complete' : 'in-progress',
  generated: new Date().toISOString(),
  mode: freeze.mode,
  freezeHash: fingerprint(freeze),
  corpusHash: freeze.corpusHash,
  sourceHash: freeze.sourceHash,
  settings: freeze.settings,
  seeds: freeze.seeds,
  ollama: freeze.ollama,
  models,
  acceptance: complete
    ? 'Compare full results with the proposed targets; completion alone is not passing.'
    : 'No acceptance decision from an incomplete run.',
  confidenceNote:
    'Descriptive attempt-level Wilson intervals; repeats are correlated. Pending tasks are explicit. Private prompts, data, expected answers and model text are excluded.',
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    status: report.status,
    output,
    completed: models.map((m) => ({
      name: m.name,
      completed: m.completed,
      planned: m.planned,
    })),
  }),
);
