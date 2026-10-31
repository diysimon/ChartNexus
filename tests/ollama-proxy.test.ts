import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, test, vi } from 'vitest';
import { createOllamaHandler } from '../examples/playground/ollama-proxy.mjs';

async function request(
  {
    path = '/api/local-ollama/generate',
    method = 'POST',
    host = '127.0.0.1:5180',
    origin = 'http://127.0.0.1:5180',
    body = JSON.stringify({ model: 'local', prompt: 'draw 1' }),
  } = {},
  fetcher: typeof fetch = vi.fn(),
) {
  const req = Readable.from([Buffer.from(body)]) as IncomingMessage;
  req.url = path;
  req.method = method;
  req.headers = {
    host,
    ...(origin ? { origin } : {}),
    'content-type': 'application/json',
  };
  let status = 0,
    payload: unknown;
  const res = Object.assign(new EventEmitter(), {
    destroyed: false,
    writableEnded: false,
    writeHead(code: number) {
      status = code;
      return this;
    },
    end(text: string) {
      payload = JSON.parse(text);
      this.writableEnded = true;
    },
  }) as unknown as ServerResponse;
  let next = false;
  await createOllamaHandler(fetcher)(req, res, () => {
    next = true;
  });
  return { status, payload, next };
}
describe('local Ollama proxy', () => {
  test('allows only same-origin localhost, bounds inputs and avoids arbitrary model endpoints', async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      expect(String(url)).toBe('http://127.0.0.1:11434/api/chat');
      return new Response(
        JSON.stringify({
          message: { content: '{"a":1}' },
          done_reason: 'stop',
        }),
      );
    }) as unknown as typeof fetch;
    expect(
      (await request({ origin: 'https://evil.example' }, fetcher)).status,
    ).toBe(403);
    expect(
      (
        await request(
          { host: 'evil.example:5180', origin: 'http://evil.example:5180' },
          fetcher,
        )
      ).status,
    ).toBe(403);
    expect((await request({ origin: '' }, fetcher)).status).toBe(403);
    expect(
      (
        await request(
          {
            body: JSON.stringify({
              model: 'm',
              prompt: 'x',
              url: 'https://evil.example',
            }),
          },
          fetcher,
        )
      ).status,
    ).toBe(400);
    expect(
      (await request({ body: 'x'.repeat(1_048_577) }, fetcher)).status,
    ).toBe(413);
    expect(await request({}, fetcher)).toMatchObject({
      status: 200,
      payload: { content: '{"a":1}' },
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  test('distinguishes malformed upstream responses and timeouts', async () => {
    const invalid = vi.fn(
      async () => new Response('not-json'),
    ) as unknown as typeof fetch;
    expect(await request({}, invalid)).toMatchObject({
      status: 502,
      payload: { error: 'INVALID_UPSTREAM_JSON' },
    });
    const timeout = vi.fn(async () => {
      throw new DOMException('timeout', 'TimeoutError');
    }) as unknown as typeof fetch;
    expect(await request({}, timeout)).toMatchObject({
      status: 502,
      payload: { error: 'OLLAMA_TIMEOUT' },
    });
  });
  test('returns truthful unavailable state and rejects invalid previous charts', async () => {
    const offline = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await request({}, offline)).toMatchObject({
      status: 502,
      payload: { error: 'OLLAMA_UNAVAILABLE' },
    });
    expect(
      await request(
        { body: JSON.stringify({ model: 'm', prompt: 'x', previous: {} }) },
        offline,
      ),
    ).toMatchObject({ status: 400, payload: { error: 'INVALID_PREVIOUS' } });
    expect(offline).toHaveBeenCalledTimes(1);
  });
});
