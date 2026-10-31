import { inspectJson } from '@chartnexus/core';
import {
  failure,
  type DataRegistry,
  type JsonValue,
  type Result,
} from '@chartnexus/schema';
import type { ChartRuntime } from './index.js';

export type UpdateReceipt =
  | { status: 'pending' }
  | { status: 'applied' | 'duplicate'; revision: number };

export interface UpdateController {
  commit(
    operation: unknown,
    registry?: DataRegistry,
    signal?: AbortSignal,
  ): Result<UpdateReceipt>;
  dispose(): void;
}

const MAX_ENTRIES = 128;
const MAX_BYTES = 4 * 1024 * 1024;
const TTL = 10 * 60 * 1000;

function canonical(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key]!)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

/** Session-local ordering and bounded deduplication; the host owns the runtime. */
export function createUpdateController(
  runtime: ChartRuntime,
): UpdateController {
  const entries = new Map<
    string,
    { signature: string; bytes: number; revision: number; expires: number }
  >();
  let bytes = 0;
  let disposed = false;
  function remove(id: string): void {
    const entry = entries.get(id);
    if (entry) {
      bytes -= entry.bytes;
      entries.delete(id);
    }
  }
  return {
    commit(operation, registry, signal) {
      if (disposed)
        return failure('DISPOSED', '', 'Update controller is disposed.');
      if (signal?.aborted)
        return failure('CANCELLED', '', 'Update was cancelled before commit.');
      let inspected: ReturnType<typeof inspectJson>;
      try {
        inspected = inspectJson(
          registry === undefined ? { operation } : { operation, registry },
        );
      } catch {
        return failure('INVALID_JSON', '', 'Expected bounded plain JSON.');
      }
      if (!inspected.ok) return inspected;
      const wrapper = inspected.value as {
        operation: JsonValue;
        registry?: JsonValue;
      };
      const op = wrapper.operation;
      if (!op || typeof op !== 'object' || Array.isArray(op))
        return failure(
          'INVALID_OPERATION',
          '',
          'Expected an update operation object.',
        );
      const keys = Object.keys(op);
      if (
        keys.some(
          (key) =>
            !['operationId', 'baseRevision', 'complete', 'document'].includes(
              key,
            ),
        ) ||
        typeof op.operationId !== 'string' ||
        op.operationId.length === 0 ||
        op.operationId.length > 256 ||
        typeof op.baseRevision !== 'number' ||
        !Number.isSafeInteger(op.baseRevision) ||
        op.baseRevision < 0 ||
        typeof op.complete !== 'boolean' ||
        (op.complete && !('document' in op)) ||
        (!op.complete && 'document' in op)
      )
        return failure(
          'INVALID_OPERATION',
          '',
          'Invalid operation ID, revision, completion state, or fields.',
        );
      if (!op.complete) return { ok: true, value: { status: 'pending' } };
      const now = Date.now();
      for (const [id, entry] of entries) if (entry.expires <= now) remove(id);
      const signature = canonical(inspected.value);
      const existing = entries.get(op.operationId);
      if (existing) {
        if (existing.signature !== signature)
          return failure(
            'OPERATION_ID_CONFLICT',
            '/operationId',
            'Operation ID already belongs to a different payload.',
          );
        return {
          ok: true,
          value: { status: 'duplicate', revision: existing.revision },
        };
      }
      if (op.baseRevision !== runtime.getRevision())
        return failure(
          'REVISION_CONFLICT',
          '/baseRevision',
          'Chart revision changed before this update was committed.',
        );
      const result = runtime.update(
        op.document,
        wrapper.registry as DataRegistry | undefined,
      );
      if (!result.ok) return result;
      const size = new TextEncoder().encode(signature).length;
      while (entries.size >= MAX_ENTRIES || bytes + size > MAX_BYTES) {
        const first = entries.keys().next().value as string | undefined;
        if (first === undefined) break;
        remove(first);
      }
      if (size <= MAX_BYTES) {
        entries.set(op.operationId, {
          signature,
          bytes: size,
          revision: result.value.revision,
          expires: now + TTL,
        });
        bytes += size;
      }
      return {
        ok: true,
        value: { status: 'applied', revision: result.value.revision },
      };
    },
    dispose() {
      disposed = true;
      entries.clear();
      bytes = 0;
    },
  };
}
