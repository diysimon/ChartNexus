import { describe, expect, it, vi } from 'vitest';
import { createUpdateController, type ChartRuntime } from '@chartnexus/runtime';
import { failure } from '@chartnexus/schema';

function setup() {
  let revision = 0;
  const update = vi.fn((document: unknown) => {
    if (document === null) return failure('INVALID', '', 'Invalid document');
    return { ok: true as const, value: { revision: ++revision } };
  });
  const runtime: ChartRuntime = {
    update,
    getRevision: () => revision,
    resize: () => ({ ok: true, value: true }),
    dispose() {},
  };
  return { controller: createUpdateController(runtime), update };
}
const op = (
  operationId: string,
  baseRevision: number,
  document: unknown = { a: 1, b: 2 },
) => ({ operationId, baseRevision, complete: true, document });

describe('update controller', () => {
  it('deduplicates canonical payloads and rejects conflicts and stale work', () => {
    const { controller, update } = setup();
    expect(controller.commit(op('a', 0))).toEqual({
      ok: true,
      value: { status: 'applied', revision: 1 },
    });
    expect(controller.commit(op('a', 0, { b: 2, a: 1 }))).toEqual({
      ok: true,
      value: { status: 'duplicate', revision: 1 },
    });
    expect(controller.commit(op('a', 0, { a: 2 }))).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'OPERATION_ID_CONFLICT' }],
    });
    expect(controller.commit(op('stale', 0))).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'REVISION_CONFLICT' }],
    });
    expect(update).toHaveBeenCalledTimes(1);
  });
  it('does not cache partial, failed, invalid or cancelled operations', () => {
    const { controller, update } = setup();
    expect(
      controller.commit({ operationId: 'a', baseRevision: 0, complete: false }),
    ).toMatchObject({ ok: true, value: { status: 'pending' } });
    expect(controller.commit(op('a', 0, null)).ok).toBe(false);
    const abort = new AbortController();
    abort.abort();
    expect(controller.commit(op('a', 0), undefined, abort.signal).ok).toBe(
      false,
    );
    expect(controller.commit({ ...op('a', 0), extra: true }).ok).toBe(false);
    const getter = Object.defineProperty({}, 'x', {
      enumerable: true,
      get() {
        throw new Error('accessed');
      },
    });
    expect(controller.commit(op('a', 0, getter)).ok).toBe(false);
    expect(controller.commit(op('a', 0)).ok).toBe(true);
    expect(update).toHaveBeenCalledTimes(2);
  });
  it('includes registry, expires entries and respects disposal', () => {
    vi.useFakeTimers();
    try {
      const { controller } = setup();
      expect(controller.commit(op('a', 0), {})).toMatchObject({ ok: true });
      expect(controller.commit(op('a', 0))).toMatchObject({
        ok: false,
        diagnostics: [{ code: 'OPERATION_ID_CONFLICT' }],
      });
      vi.advanceTimersByTime(600_000);
      expect(controller.commit(op('a', 0), {})).toMatchObject({
        ok: false,
        diagnostics: [{ code: 'REVISION_CONFLICT' }],
      });
      controller.dispose();
      expect(controller.commit(op('b', 1))).toMatchObject({
        ok: false,
        diagnostics: [{ code: 'DISPOSED' }],
      });
    } finally {
      vi.useRealTimers();
    }
  });
  it('evicts old entries at the capacity limit', () => {
    const { controller } = setup();
    for (let i = 0; i < 129; i++)
      expect(controller.commit(op(String(i), i)).ok).toBe(true);
    expect(controller.commit(op('0', 0))).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'REVISION_CONFLICT' }],
    });
    expect(controller.commit(op('128', 128))).toMatchObject({
      ok: true,
      value: { status: 'duplicate' },
    });
  });
  it('evicts signatures when the memory budget is exceeded', () => {
    const { controller } = setup();
    const large = 'x'.repeat(900_000);
    for (let i = 0; i < 5; i++)
      expect(controller.commit(op(String(i), i, large)).ok).toBe(true);
    expect(controller.commit(op('0', 0, large))).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'REVISION_CONFLICT' }],
    });
  });
});
