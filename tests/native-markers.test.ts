import { expect, test } from 'vitest';
import { compileChart, validateNativeStrict } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import markers from './browser/fixtures/native-markers.json' with { type: 'json' };

test('guarded native marker components render without expanding strict validation', () => {
  const before = structuredClone(markers);
  expect(compileChart(markers).ok).toBe(true);
  expect(validateNativeStrict(markers)).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'INVALID_NATIVE_STRICT' }],
  });
  const result = renderSvg(markers);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Native markers failed to render');
  for (const label of ['5.75', 'Marker point', 'Marker area']) {
    expect(result.value).toContain(`>${label}</text>`);
  }
  expect(markers).toEqual(before);
});
