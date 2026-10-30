import capabilityManifest from './capabilities.json' with { type: 'json' };
import { failure, type Result, type JsonValue } from '@chartnexus/schema';

export const limits = Object.freeze(capabilityManifest.limits);
const dangerous = new Set(['__proto__', 'prototype', 'constructor']);

/** Reject non-JSON values before invoking any serialization or schema validator. */
export function inspectJson(input: unknown): Result<JsonValue> {
  const seen = new Set<object>();
  let nodes = 0;
  function visit(value: unknown, depth: number): boolean {
    if (++nodes > 100_000 || depth > limits.depth) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'string') return value.length <= limits.bytes;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value !== 'object' || seen.has(value)) return false;
    const proto: unknown = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && proto !== Object.prototype && proto !== null)
      return false;
    seen.add(value);
    if (Array.isArray(value) && value.length > 100_000) return false;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string' || dangerous.has(key)) return false;
      if (Array.isArray(value) && key === 'length') continue;
      if (
        Array.isArray(value) &&
        (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)
      )
        return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable)
        return false;
      const child: unknown = descriptor.value;
      if (!visit(child, depth + 1)) return false;
    }
    if (Array.isArray(value) && Object.keys(value).length !== value.length)
      return false;
    seen.delete(value);
    return true;
  }
  if (!visit(input, 0))
    return failure(
      'INVALID_JSON',
      '',
      'Expected bounded plain JSON without functions, accessors, cycles, or dangerous keys.',
    );
  const serialized = JSON.stringify(input);
  if (utf8Length(serialized) > limits.bytes)
    return failure('RESOURCE_LIMIT', '', 'Input exceeds the 1 MiB budget.');
  // JSON round-trip removes object identity and guarantees no caller-owned objects escape.
  const clone: JsonValue = JSON.parse(serialized);
  return { ok: true, value: clone };
}

export function record(value: unknown): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function utf8Length(text: string): number {
  let bytes = 0;
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}
