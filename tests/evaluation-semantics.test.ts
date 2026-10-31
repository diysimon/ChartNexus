import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';
test('reporting corrects optional identity equivalence without accepting changed data or failed renders', () => {
  const result = execFileSync(
    process.execPath,
    ['scripts/check-evaluation-semantics.mjs'],
    { encoding: 'utf8', timeout: 15000 },
  );
  expect(result).toContain('equivalent keys pass');
});
