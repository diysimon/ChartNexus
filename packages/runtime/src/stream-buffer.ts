import { failure, type Result } from '@chartnexus/schema';

export interface BufferedChartOperation {
  operationId: string;
  baseRevision: number;
  complete: true;
  document: unknown;
}
export interface ChartStreamBuffer {
  append(fragment: string): Result<{ bytes: number }>;
  finish(): Result<BufferedChartOperation>;
  cancel(): void;
}
const MAX_BYTES = 1024 * 1024;
const MAX_FRAGMENTS = 16_384;

/** Buffers one decoded JSON document. Transport and publication belong to the host. */
export function createChartStreamBuffer(
  operationId: string,
  baseRevision: number,
): Result<ChartStreamBuffer> {
  if (
    typeof operationId !== 'string' ||
    !operationId ||
    operationId.length > 256 ||
    !Number.isSafeInteger(baseRevision) ||
    baseRevision < 0
  )
    return failure(
      'INVALID_OPERATION',
      '',
      'Provide a valid operation ID and base revision.',
    );
  let chunks: string[] = [];
  let bytes = 0;
  let lastCodeUnit = 0;
  let fragments = 0;
  let closed = false;
  const encoder = new TextEncoder();
  function end(): void {
    chunks = [];
    closed = true;
  }
  return {
    ok: true,
    value: {
      append(fragment) {
        if (closed)
          return failure('STREAM_CLOSED', '', 'Stream buffer is closed.');
        if (typeof fragment !== 'string' || ++fragments > MAX_FRAGMENTS) {
          end();
          return failure(
            'RESOURCE_LIMIT',
            '',
            'Invalid fragment or fragment count exceeded.',
          );
        }
        if (fragment.length > MAX_BYTES) {
          end();
          return failure(
            'RESOURCE_LIMIT',
            '',
            'Stream exceeds the 1 MiB document limit.',
          );
        }
        // Two individually encoded surrogate halves each become a three-byte replacement;
        // together they form one four-byte code point.
        const first = fragment.charCodeAt(0);
        const joinsPair =
          lastCodeUnit >= 0xd800 &&
          lastCodeUnit <= 0xdbff &&
          first >= 0xdc00 &&
          first <= 0xdfff;
        const nextBytes =
          bytes + encoder.encode(fragment).byteLength - (joinsPair ? 2 : 0);
        if (nextBytes > MAX_BYTES) {
          end();
          return failure(
            'RESOURCE_LIMIT',
            '',
            'Stream exceeds the 1 MiB document limit.',
          );
        }
        chunks.push(fragment);
        bytes = nextBytes;
        if (fragment.length)
          lastCodeUnit = fragment.charCodeAt(fragment.length - 1);
        return { ok: true, value: { bytes } };
      },
      finish() {
        if (closed)
          return failure('STREAM_CLOSED', '', 'Stream buffer is closed.');
        try {
          const document: unknown = JSON.parse(chunks.join(''));
          end();
          return {
            ok: true,
            value: { operationId, baseRevision, complete: true, document },
          };
        } catch {
          end();
          return failure(
            'INVALID_JSON',
            '',
            'Completed stream must contain a single JSON document.',
          );
        }
      },
      cancel() {
        end();
      },
    },
  };
}
