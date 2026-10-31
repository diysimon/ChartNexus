import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  appendFile,
  open,
  unlink,
} from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unlinkSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { createAgentService } from '@chartnexus/agent';
import { projectChartSchema03 } from '@chartnexus/schema';
import { createMapAsset, mapCatalog } from '@chartnexus/echarts';
import {
  fingerprint,
  validateCorpus,
  requestForModel,
  scoreIndependent,
  summarizeIndependent,
  repairFeedback,
} from './independent-evaluation.mjs';
const args = process.argv.slice(2),
  arg = (key, fallback) =>
    args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const corpusPath = arg('--corpus');
if (!corpusPath)
  throw new Error(
    'Supply --corpus PRIVATE.json; never put heldout answers in resources',
  );
const corpus = validateCorpus(JSON.parse(await readFile(corpusPath, 'utf8')));
const output = resolve(arg('--output', 'outputs/independent-evaluation'));
await mkdir(output, { recursive: true });
const lockPath = join(output, 'run.lock');
try {
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  let live = false;
  try {
    process.kill(lock.pid, 0);
    live = true;
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
  if (live)
    throw new Error('Evaluation already running in this output directory');
  await unlink(lockPath);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const lock = await open(lockPath, 'wx');
await lock.writeFile(JSON.stringify({ pid: process.pid }));
await lock.close();
process.once('exit', (code) => {
  if (code !== 0)
    writeFileSync(
      join(output, 'status.json'),
      JSON.stringify({
        status: 'interrupted-or-failed',
        exitCode: code,
        updated: new Date().toISOString(),
      }) + '\n',
    );
  try {
    unlinkSync(lockPath);
  } catch {
    /* retained output remains resumable */
  }
});
await writeFile(
  join(output, 'status.json'),
  JSON.stringify(
    { status: 'running', pid: process.pid, started: new Date().toISOString() },
    null,
    2,
  ) + '\n',
);

const prepared = createMapAsset(
  JSON.parse(await readFile('examples/maps/two-regions.json', 'utf8')),
);
if (!prepared.ok) throw new Error('Map fixture failed');
const maps = { [prepared.value.id]: prepared.value },
  catalog = mapCatalog(maps);
const system =
  'Return ONLY JSON. Produce a ChartNexus schemaVersion 0.3 intent document satisfying the user request and supplied exact data. Do not infer facts, alter data, execute code, or add unsupported options. If the user asks to diagnose an invalid document, return only {"diagnosticCode":"...","diagnosticPath":"..."}. Otherwise use the provided projected schema. Retain nulls, zeroes, identities and units. JSON object field order is immaterial; data array order is significant. The host can provide up to two validation repairs.';
const interruption = new AbortController();
process.once('SIGINT', () => interruption.abort());
process.once('SIGTERM', () => interruption.abort());
const endpoint = 'http://127.0.0.1:11434';
async function api(path, body) {
  if (args.includes('--self-test')) {
    if (path === '/api/tags')
      return {
        models: [
          {
            name: 'harness-selftest',
            digest: 'synthetic',
            details: { quantization_level: 'none' },
          },
        ],
      };
    if (path === '/api/version') return { version: 'synthetic-no-network' };
    return {
      done: true,
      done_reason: 'stop',
      message: { content: '{}' },
      eval_count: 1,
      prompt_eval_count: 1,
    };
  }
  const response = await fetch(endpoint + path, {
    method: body ? 'POST' : 'GET',
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { 'content-type': 'application/json' },
        }
      : {}),
    signal: AbortSignal.any([AbortSignal.timeout(90000), interruption.signal]),
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const reader = response.body.getReader();
  let text = '',
    size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2 * 1024 * 1024)
        throw new Error('Ollama response exceeds 2MiB');
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally {
    await reader.cancel();
  }
}
const tags = (await api('/api/tags')).models,
  version = await api('/api/version');
const models = arg('--models', tags.map((x) => x.name).join(',')).split(',');
const settings = { temperature: 0.2, num_predict: 2048, num_ctx: 32768 };
const sources = [];
async function walk(dir) {
  for (const name of (await readdir(dir, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    if (['node_modules'].includes(name.name)) continue;
    const p = join(dir, name.name);
    if (name.isDirectory()) await walk(p);
    else if (/\.(ts|js|json|mjs)$/.test(p))
      sources.push([p, fingerprint(await readFile(p, 'utf8'))]);
  }
}
await walk('packages');
for (const file of [
  'scripts/run-independent-evaluation.mjs',
  'scripts/independent-evaluation.mjs',
  'resources/diagnostics.json',
  'examples/maps/two-regions.json',
])
  sources.push([file, fingerprint(await readFile(file, 'utf8'))]);
sources.push([
  'pnpm-lock.yaml',
  fingerprint(await readFile('pnpm-lock.yaml', 'utf8')),
]);
let freeze = {
  mode: args.includes('--self-test')
    ? 'synthetic-harness-check'
    : 'local-ollama',
  corpusHash: fingerprint(corpus),
  sourceHash: fingerprint(sources),
  sources,
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  promptHash: fingerprint(system),
  ollama: version,
  settings,
  seeds: [42, 43, 44],
  models: models.map((name) => {
    const m = tags.find((m) => m.name === name);
    if (!m) throw new Error(`Missing model ${name}`);
    return m;
  }),
  taskCount: corpus.tasks.length,
  created: new Date().toISOString(),
};
if (args.includes('--resume')) {
  const previous = JSON.parse(
    await readFile(join(output, 'freeze.json'), 'utf8'),
  );
  for (const key of [
    'mode',
    'corpusHash',
    'sourceHash',
    'promptHash',
    'settings',
    'seeds',
    'taskCount',
    'ollama',
  ])
    if (fingerprint(previous[key]) !== fingerprint(freeze[key]))
      throw new Error(`Resume refused: ${key} drift`);
  if (
    fingerprint(previous.models.map((m) => [m.name, m.digest])) !==
    fingerprint(freeze.models.map((m) => [m.name, m.digest]))
  )
    throw new Error('Resume refused: model drift');
  freeze = previous;
} else {
  await writeFile(
    join(output, 'freeze.json'),
    JSON.stringify(freeze, null, 2) + '\n',
    { flag: 'wx' },
  );
  await writeFile(
    join(output, 'corpus.json'),
    JSON.stringify(corpus, null, 2) + '\n',
    { flag: 'wx' },
  );
}
async function assertFrozen() {
  for (const [file, hash] of freeze.sources)
    if (fingerprint(await readFile(file, 'utf8')) !== hash)
      throw new Error(`Frozen implementation changed: ${file}`);
}
const summaries = {};
for (const model of freeze.models) {
  if (interruption.signal.aborted) break;
  const records = [],
    key = model.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
  let saved = [];
  if (args.includes('--resume')) {
    try {
      saved = (await readFile(join(output, `${key}.attempts.jsonl`), 'utf8'))
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(JSON.parse);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  for (let repeat = 0; repeat < 3 && !interruption.signal.aborted; repeat++)
    for (const task of corpus.tasks) {
      if (interruption.signal.aborted) {
        console.log('Interrupted; use --resume with the same frozen files.');
        process.exitCode = 130;
        break;
      }
      await assertFrozen();
      const registry = task.registry ?? {};
      const service = createAgentService({ maps, registry });
      const schemas = (
        task.schemaTypes ??
        task.expected.allowedTypes ?? ['bar']
      ).map(projectChartSchema03);
      const messages = [
        {
          role: 'system',
          content:
            system +
            '\nSchema:' +
            JSON.stringify(schemas) +
            '\nDiagnostics:' +
            (await readFile('resources/diagnostics.json', 'utf8')),
        },
        { role: 'user', content: JSON.stringify(requestForModel(task)) },
      ];
      const record = {
        id: task.id,
        family: task.family,
        kind: task.kind,
        split: task.split,
        repeat,
        attempts: saved
          .filter((a) => a.id === task.id && a.repeat === repeat)
          .sort((a, b) => a.attempt - b.attempt),
      };
      for (const prior of record.attempts) {
        const feedback = repairFeedback(prior);
        if (!feedback) break;
        messages.push(
          { role: 'assistant', content: prior.raw?.message?.content ?? '' },
          { role: 'user', content: JSON.stringify({ validation: feedback }) },
        );
      }
      for (
        let attempt = record.attempts.length;
        attempt < 3 &&
        !record.attempts.some((a) => a.score.correct) &&
        (!record.attempts.length || repairFeedback(record.attempts.at(-1)));
        attempt++
      ) {
        const started = performance.now();
        let raw, document, score, validation, rendered;
        try {
          raw = await api('/api/chat', {
            model: model.name,
            stream: false,
            think: false,
            format: 'json',
            options: { ...settings, seed: freeze.seeds[repeat] },
            messages,
            keep_alive: '30m',
          });
          if (raw.done !== true || raw.done_reason === 'length')
            throw new Error(`Incomplete output: ${raw.done_reason}`);
          document = JSON.parse(raw.message?.content);
          score = scoreIndependent(task, document, catalog, registry);
          if (task.kind === 'invalid')
            validation = await service.execute('validate_chart', {
              document: task.request.inputDocument,
            });
          if (task.kind !== 'invalid') {
            validation = await service.execute('validate_chart', { document });
            if (validation.ok) {
              rendered = await service.execute('render_chart', { document });
              score.rendered = rendered.ok;
              score.correct &&= rendered.ok;
            }
          }
        } catch (error) {
          score = {
            jsonValid: !!document,
            structuralValid: false,
            correct: false,
            error: String(error.message),
          };
        }
        record.attempts.push({
          raw,
          document,
          score,
          validation,
          rendered: rendered
            ? {
                ok: rendered.ok,
                ...(!rendered.ok ? { diagnostics: rendered.diagnostics } : {}),
              }
            : undefined,
          svgHash: rendered?.ok
            ? createHash('sha256').update(rendered.value.svg).digest('hex')
            : undefined,
          latencyMs: performance.now() - started,
        });
        await appendFile(
          join(output, `${key}.attempts.jsonl`),
          JSON.stringify({
            id: task.id,
            repeat,
            attempt,
            ...record.attempts.at(-1),
          }) + '\n',
        );
        if (score.correct || interruption.signal.aborted) break;
        // Never send oracle differences or expected values to the model.
        const feedback = repairFeedback({ validation, score, rendered });
        if (!feedback) break;
        messages.push(
          { role: 'assistant', content: raw?.message?.content ?? '' },
          { role: 'user', content: JSON.stringify({ validation: feedback }) },
        );
      }
      if (interruption.signal.aborted) {
        console.log(
          'Interrupted; partial attempts retained. Resume with --resume.',
        );
        process.exitCode = 130;
        break;
      }
      records.push(record);
      summaries[model.name] = {
        ...summarizeIndependent(records, corpus.tasks.length * 3),
        byKind: Object.fromEntries(
          ['chart', 'edit', 'invalid', 'recovery'].map((kind) => [
            kind,
            summarizeIndependent(
              records.filter((r) => r.kind === kind),
              corpus.tasks.filter((t) => t.kind === kind).length * 3,
            ),
          ]),
        ),
      };
      await writeFile(
        join(output, 'summary.json'),
        JSON.stringify(
          { freezeHash: fingerprint(freeze), models: summaries },
          null,
          2,
        ) + '\n',
      );
      console.log(
        `${model.name} ${records.length}/${corpus.tasks.length * 3} ${task.id} ${record.attempts.at(-1).score.correct ? 'PASS' : 'FAIL'} (${record.attempts.length} attempts)`,
      );
    }
}

await writeFile(
  join(output, 'status.json'),
  JSON.stringify(
    {
      status: interruption.signal.aborted ? 'interrupted' : 'complete',
      updated: new Date().toISOString(),
    },
    null,
    2,
  ) + '\n',
);
