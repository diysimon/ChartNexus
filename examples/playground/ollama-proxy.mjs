import { chartDocumentSchema, chartDocument02Schema } from '@chartnexus/schema';
import { capabilities, compileChart } from '@chartnexus/core';

const limit = 1_048_576;
const system = `You generate charts for ChartNexus. Return only one valid ChartDocument JSON object, no Markdown or explanations. Use schemaVersion 0.1. Use only capabilities and schema below. Support mode intent or echarts. Do not invent data, use callbacks, code, external URLs, transforms or unsupported features. Preserve numeric values, nulls and field names. For a requested edit update the previous document, keeping its id. If the user did not provide the necessary data, return {} rather than inventing numbers.\nSCHEMA:\n${JSON.stringify(chartDocumentSchema)}\nCAPABILITIES:\n${JSON.stringify(capabilities)}`;
function send(res, status, payload) {
  if (res.destroyed) return;
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}
function sameOrigin(req, requireOrigin) {
  const host = req.headers.host;
  if (!host || !/^(?:localhost|127\.0\.0\.1):\d+$/.test(host)) return false;
  const origin = req.headers.origin;
  return origin ? origin === `http://${host}` : !requireOrigin;
}
async function bodyJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('REQUEST_TOO_LARGE');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('INVALID_JSON');
  }
}
async function readResponse(response) {
  if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}`);
  if (Number(response.headers.get('content-length') ?? 0) > 2 * limit)
    throw new Error('RESPONSE_TOO_LARGE');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('EMPTY_RESPONSE');
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2 * limit) throw new Error('RESPONSE_TOO_LARGE');
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('INVALID_UPSTREAM_JSON');
  }
}
export function createOllamaHandler(fetcher = fetch) {
  return async (req, res, next) => {
    if (
      req.url !== '/api/local-ollama/models' &&
      req.url !== '/api/local-ollama/generate' &&
      req.url !== '/api/local-ollama/stream'
    )
      return next();
    const models = req.url.endsWith('/models');
    const streaming = req.url.endsWith('/stream');
    if (!sameOrigin(req, !models))
      return send(res, 403, { error: 'ORIGIN_REJECTED' });
    if (req.method !== (models ? 'GET' : 'POST'))
      return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    try {
      if (models) {
        const result = await readResponse(
          await fetcher('http://127.0.0.1:11434/api/tags', {
            signal: AbortSignal.timeout(5000),
          }),
        );
        const names = Array.isArray(result.models)
          ? result.models
              .map((item) => item.name)
              .filter(
                (name) =>
                  typeof name === 'string' && /^[\w.:/-]{1,128}$/.test(name),
              )
              .slice(0, 100)
          : [];
        return send(res, 200, { models: names });
      }
      if (
        !String(req.headers['content-type'] ?? '')
          .toLowerCase()
          .startsWith('application/json')
      )
        return send(res, 415, { error: 'CONTENT_TYPE' });
      const input = await bodyJson(req);
      if (
        !input ||
        typeof input !== 'object' ||
        Array.isArray(input) ||
        Object.keys(input).some(
          (key) => !['model', 'prompt', 'previous', 'repair'].includes(key),
        ) ||
        typeof input.model !== 'string' ||
        !/^[\w.:/-]{1,128}$/.test(input.model) ||
        typeof input.prompt !== 'string' ||
        !input.prompt.trim() ||
        input.prompt.length > 12000
      )
        return send(res, 400, { error: 'INVALID_REQUEST' });
      if (input.previous !== undefined && !compileChart(input.previous).ok)
        return send(res, 400, { error: 'INVALID_PREVIOUS' });
      if (
        input.repair !== undefined &&
        (typeof input.repair !== 'string' || input.repair.length > 30000)
      )
        return send(res, 400, { error: 'INVALID_REQUEST' });
      const messages = [
        {
          role: 'system',
          content: streaming
            ? `Return only one ChartDocument JSON object. Use schemaVersion 0.2, mode intent. Preserve supplied values and stable id. Do not invent data, code or callbacks. SCHEMA: ${JSON.stringify(chartDocument02Schema)}`
            : system,
        },
        {
          role: 'user',
          content: JSON.stringify({
            request: input.prompt,
            ...(input.repair ? { repair: input.repair } : {}),
            ...(input.previous === undefined
              ? {}
              : { previousDocument: input.previous }),
          }),
        },
      ];
      const controller = new AbortController();
      res.once('close', () => {
        if (!res.writableEnded) controller.abort();
      });
      const response = await fetcher('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: input.model,
          messages,
          stream: streaming,
          think: false,
          format: 'json',
          options: { temperature: 0.2, num_predict: 2048 },
        }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(120000),
        ]),
      });
      if (streaming) {
        if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}`);
        if (!response.body) throw new Error('EMPTY_RESPONSE');
        res.writeHead(200, {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        });
        let bytes = 0;
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > 4 * limit) throw new Error('RESPONSE_TOO_LARGE');
            if (res.destroyed) {
              controller.abort();
              break;
            }
            if (!res.write(value))
              await new Promise((resolve) => {
                const finish = () => {
                  res.off('drain', finish);
                  res.off('close', finish);
                  resolve();
                };
                res.once('drain', finish);
                res.once('close', finish);
              });
          }
          res.end();
        } finally {
          try {
            await reader.cancel();
          } catch {}
          reader.releaseLock();
        }
        return;
      }
      const output = await readResponse(response);
      if (typeof output.message?.content !== 'string')
        return send(res, 502, { error: 'INVALID_MODEL_RESPONSE' });
      return send(res, 200, {
        content: output.message.content,
        doneReason:
          typeof output.done_reason === 'string' ? output.done_reason : null,
      });
    } catch (error) {
      if (res.headersSent) {
        res.end(JSON.stringify({ error: 'UPSTREAM_STREAM_FAILED' }) + '\n');
        return;
      }
      const code = error instanceof Error ? error.message : '';
      if (code === 'REQUEST_TOO_LARGE') return send(res, 413, { error: code });
      if (code === 'INVALID_JSON') return send(res, 400, { error: code });
      const timeout = error instanceof Error && error.name === 'TimeoutError';
      const known =
        /^OLLAMA_HTTP_\d+$/.test(code) ||
        ['RESPONSE_TOO_LARGE', 'INVALID_UPSTREAM_JSON'].includes(code);
      return send(res, 502, {
        error: timeout ? 'OLLAMA_TIMEOUT' : known ? code : 'OLLAMA_UNAVAILABLE',
      });
    }
  };
}
export function ollamaProxy() {
  return {
    name: 'chartnexus-local-ollama',
    configureServer(server) {
      server.middlewares.use(createOllamaHandler());
    },
  };
}
