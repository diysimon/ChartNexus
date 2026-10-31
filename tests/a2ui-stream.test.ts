import { describe, expect, it } from 'vitest';
import { createChartStreamBuffer } from '@chartnexus/adapter-a2ui';

function buffer() {
  const result = createChartStreamBuffer('test', 3);
  if (!result.ok) throw new Error('buffer creation failed');
  return result.value;
}
describe('A2UI host stream buffer', () => {
  it('assembles text and counts split Unicode correctly', () => {
    const stream = buffer();
    expect(stream.append('{"name":"\ud83d').ok).toBe(true);
    expect(stream.append('\ude00"}')).toEqual({
      ok: true,
      value: { bytes: 15 },
    });
    expect(stream.finish()).toEqual({
      ok: true,
      value: {
        operationId: 'test',
        baseRevision: 3,
        complete: true,
        document: { name: '😀' },
      },
    });
    expect(stream.finish().ok).toBe(false);
  });
  it('rejects incomplete JSON and cancellation permanently', () => {
    const stream = buffer();
    stream.append('{');
    expect(stream.finish()).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'INVALID_JSON' }],
    });
    expect(stream.append('}').ok).toBe(false);
    const cancelled = buffer();
    cancelled.append('{}');
    cancelled.cancel();
    expect(cancelled.finish().ok).toBe(false);
  });
  it('bounds bytes and fragment count', () => {
    const stream = buffer();
    expect(stream.append('a'.repeat(1024 * 1024)).ok).toBe(true);
    expect(stream.append('x')).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'RESOURCE_LIMIT' }],
    });
    expect(stream.finish().ok).toBe(false);
    const many = buffer();
    for (let i = 0; i < 16384; i++) expect(many.append('').ok).toBe(true);
    expect(many.append('').ok).toBe(false);
    expect(createChartStreamBuffer('', 0).ok).toBe(false);
    expect(createChartStreamBuffer(null as unknown as string, 0).ok).toBe(
      false,
    );
    const huge = buffer();
    expect(huge.append('x'.repeat(1024 * 1024 + 1)).ok).toBe(false);
    expect(huge.finish().ok).toBe(false);
    expect(createChartStreamBuffer('a', -1).ok).toBe(false);
  });
});
