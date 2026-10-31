import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';
test('frozen render replay detects tampering and cannot accept an incomplete run', () => {
  const result = execFileSync(
    process.execPath,
    ['scripts/check-render-replay.mjs'],
    { encoding: 'utf8', timeout: 30000 },
  );
  expect(result).toContain('rejects mismatched hashes');
}, 45000);
