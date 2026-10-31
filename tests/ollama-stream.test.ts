import { expect, test } from 'vitest';
import { readOllamaStream } from '@chartnexus/runtime';
const encoder = new TextEncoder();
function stream(text: string, size = 7) {
  const bytes = encoder.encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += size)
        controller.enqueue(bytes.slice(i, i + size));
      controller.close();
    },
  });
}
const frames = (content: string, reason = 'stop') =>
  JSON.stringify({ message: { content }, done: false }) +
  '\n' +
  JSON.stringify({ done: true, done_reason: reason }) +
  '\n';
test('UTF-8 split at every byte retains one exact JSON document and host operation', async () => {
  const document = { title: '中文😀', value: 0 };
  const result = await readOllamaStream(
    stream(frames(JSON.stringify(document)), 1),
    { operationId: 'host-1', baseRevision: 4 },
  );
  expect(result).toEqual({
    ok: true,
    value: { operationId: 'host-1', baseRevision: 4, complete: true, document },
  });
});
test.each([
  [
    JSON.stringify({ message: { content: '{}' }, done: false }) + '\n',
    'INCOMPLETE_STREAM',
  ],
  [frames('{}', 'length'), 'TRUNCATED_GENERATION'],
  [frames('{}{}'), 'INVALID_JSON'],
  [frames('{bad'), 'INVALID_JSON'],
  [frames('{}') + JSON.stringify({ done: false }) + '\n', 'INVALID_STREAM'],
  ['{bad frame}\n', 'INVALID_STREAM'],
  [JSON.stringify({ error: 'failed' }) + '\n', 'MODEL_ERROR'],
])(
  'rejects invalid/truncated transport without completion: %s',
  async (text, code) => {
    expect(
      await readOllamaStream(stream(text), {
        operationId: 'x',
        baseRevision: 0,
      }),
    ).toMatchObject({ ok: false, diagnostics: [{ code }] });
  },
);
test('cancellation closes blocked read and ignores late fragments', async () => {
  const abort = new AbortController();
  let closed = false;
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          JSON.stringify({ message: { content: '{}' }, done: false }) + '\n',
        ),
      );
    },
    cancel() {
      closed = true;
    },
  });
  const result = readOllamaStream(source, {
    operationId: 'x',
    baseRevision: 0,
    signal: abort.signal,
  });
  abort.abort();
  expect(await result).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'CANCELLED' }],
  });
  expect(closed).toBe(true);
});
test('invalid UTF-8 is rejected, not silently replaced', async () => {
  const source = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new Uint8Array([0xff]));
      c.close();
    },
  });
  expect(
    await readOllamaStream(source, { operationId: 'x', baseRevision: 0 }),
  ).toMatchObject({ ok: false, diagnostics: [{ code: 'INVALID_STREAM' }] });
});
