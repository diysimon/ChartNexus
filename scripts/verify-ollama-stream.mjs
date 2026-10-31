import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readOllamaStream } from '@chartnexus/runtime';
import { compileChart } from '@chartnexus/core';
import { createOllamaHandler } from '../examples/playground/ollama-proxy.mjs';
const model = process.argv[2] ?? 'qwen3.5:9b';
const handler = createOllamaHandler();
const server = createServer((req, res) => {
  void handler(req, res, () => {
    res.writeHead(404);
    res.end();
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const tags = await (await fetch('http://127.0.0.1:11434/api/tags')).json();
const attempts = [];
let repair;
let final;
try {
  for (let attempt = 0; attempt < 3; attempt++) {
    let fragments = 0;
    const start = Date.now();
    const response = await fetch(origin + '/api/local-ollama/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({
        model,
        prompt:
          'Create a bar chart with id local-stream. Categories A and B, values exactly 3 and 5 respectively. Use fields category and value, preserve input order. Do not aggregate or sort.',
        ...(repair ? { repair } : {}),
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok || !response.body)
      throw new Error(`Proxy HTTP ${response.status}`);
    const streamed = await readOllamaStream(response.body, {
      operationId: `local-${attempt}`,
      baseRevision: 0,
      onFragment() {
        fragments++;
      },
      signal: AbortSignal.timeout(120000),
    });
    const compiled = streamed.ok
      ? compileChart(streamed.value.document)
      : streamed;
    const values = compiled.ok
      ? compiled.value.option.series?.[0]?.data
      : undefined;
    const fidelity = JSON.stringify(values) === '[3,5]';
    attempts.push({
      attempt,
      fragments,
      durationMs: Date.now() - start,
      terminalValid: streamed.ok,
      compiled: compiled.ok,
      dataFidelity: fidelity,
      ...(!compiled.ok ? { diagnostics: compiled.diagnostics } : {}),
    });
    if (streamed.ok && compiled.ok && fidelity) {
      final = streamed.value.document;
      break;
    }
    repair = JSON.stringify({
      invalidDocument: streamed.ok ? streamed.value.document : null,
      diagnostics: compiled.ok
        ? 'Preserve exact values [3,5]'
        : compiled.diagnostics,
    });
  }
  const controller = new AbortController();
  const response = await fetch(origin + '/api/local-ollama/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ model, prompt: 'Create a bar chart: A=3, B=5.' }),
    signal: controller.signal,
  });
  const cancelled = await readOllamaStream(response.body, {
    operationId: 'cancelled',
    baseRevision: 1,
    signal: controller.signal,
    onFragment() {
      controller.abort();
    },
  });
  const cancellation =
    !cancelled.ok && cancelled.diagnostics[0]?.code === 'CANCELLED';
  const report = {
    date: '2026-10-31',
    node: process.version,
    model: tags.models.find((entry) => entry.name === model),
    transport:
      'real local Ollama -> same-origin proxy -> incremental UTF-8 NDJSON -> terminal check -> compile',
    attempts,
    cancellation,
    document: final ?? null,
    passed: Boolean(final) && cancellation,
    scope:
      'One synthetic smoke case; not a model benchmark or every-model claim.',
  };
  await writeFile(
    'specs/0034-chat-host-quality/ollama-verification.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(
    JSON.stringify({ passed: report.passed, attempts, cancellation }),
  );
  if (!report.passed) process.exitCode = 1;
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
