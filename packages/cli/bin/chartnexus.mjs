#!/usr/bin/env node
import process from 'node:process';
try {
  await import('../dist/main.js');
} catch (error) {
  const missing =
    error instanceof Error &&
    'code' in error &&
    error.code === 'ERR_MODULE_NOT_FOUND';
  process.stderr.write(
    missing
      ? 'BUILD_REQUIRED: run pnpm install and pnpm build.\n'
      : 'START_FAILED\n',
  );
  process.exitCode = 2;
}
