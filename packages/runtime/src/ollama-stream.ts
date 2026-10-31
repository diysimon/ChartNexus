import { failure, type Result } from '@chartnexus/schema';
import {
  createChartStreamBuffer,
  type BufferedChartOperation,
} from './stream-buffer.js';

/** Read bounded Ollama /api/chat NDJSON. A parseable document without done:true/stop never commits. */
export async function readOllamaStream(
  stream: ReadableStream<Uint8Array>,
  settings: {
    operationId: string;
    baseRevision: number;
    signal?: AbortSignal;
    onFragment?: (text: string) => void;
  },
): Promise<Result<BufferedChartOperation>> {
  const buffer = createChartStreamBuffer(
    settings.operationId,
    settings.baseRevision,
  );
  if (!buffer.ok) return buffer;
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let pending = '',
    bytes = 0,
    terminal = false,
    failed = false;
  const abort = () => {
    failed = true;
    buffer.value.cancel();
    void reader.cancel().catch(() => {});
  };
  settings.signal?.addEventListener('abort', abort, { once: true });
  if (settings.signal?.aborted) abort();
  const line = (text: string): Result<true> => {
    if (!text.trim()) return { ok: true, value: true };
    if (terminal)
      return failure(
        'INVALID_STREAM',
        '',
        'Data received after terminal frame.',
      );
    let frame: unknown;
    try {
      frame = JSON.parse(text);
    } catch {
      return failure('INVALID_STREAM', '', 'Invalid NDJSON frame.');
    }
    if (!frame || typeof frame !== 'object' || Array.isArray(frame))
      return failure('INVALID_STREAM', '', 'Expected an object frame.');
    if ('error' in frame)
      return failure('MODEL_ERROR', '', 'Ollama reported an error.');
    if (!('done' in frame) || typeof frame.done !== 'boolean')
      return failure('INVALID_STREAM', '', 'Frame must declare completion.');
    if (
      'message' in frame &&
      frame.message &&
      typeof frame.message === 'object' &&
      'content' in frame.message
    ) {
      if (typeof frame.message.content !== 'string')
        return failure('INVALID_STREAM', '', 'Content must be text.');
      const appended = buffer.value.append(frame.message.content);
      if (!appended.ok) return appended;
      settings.onFragment?.(frame.message.content);
    }
    if (frame.done) {
      if (!('done_reason' in frame) || frame.done_reason !== 'stop')
        return failure(
          'TRUNCATED_GENERATION',
          '',
          'Generation did not finish normally.',
        );
      terminal = true;
    }
    return { ok: true, value: true };
  };
  try {
    while (!failed) {
      const next = await reader.read();
      if (failed) break;
      if (next.done) {
        pending += decoder.decode();
        break;
      }
      bytes += next.value.byteLength;
      if (bytes > 4 * 1024 * 1024)
        return failure('RESOURCE_LIMIT', '', 'Transport exceeds 4 MiB.');
      pending += decoder.decode(next.value, { stream: true });
      let newline: number;
      while ((newline = pending.indexOf('\n')) >= 0) {
        const result = line(pending.slice(0, newline));
        pending = pending.slice(newline + 1);
        if (!result.ok) return result;
      }
    }
    if (failed || settings.signal?.aborted)
      return failure('CANCELLED', '', 'Stream cancelled.');
    if (pending.trim()) {
      const result = line(pending);
      if (!result.ok) return result;
    }
    if (!terminal)
      return failure(
        'INCOMPLETE_STREAM',
        '',
        'Missing successful terminal frame.',
      );
    return buffer.value.finish();
  } catch {
    return failure(
      settings.signal?.aborted ? 'CANCELLED' : 'INVALID_STREAM',
      '',
      'Stream decoding or transport failed.',
    );
  } finally {
    buffer.value.cancel();
    settings.signal?.removeEventListener('abort', abort);
    try {
      await reader.cancel();
    } catch {
      /* Transport already closed. */
    }
    reader.releaseLock();
  }
}
