import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
test('performance: typical/boundary render-update-dispose samples', async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/performance.html');
  await page.waitForFunction(
    () => typeof window.runPerformanceProbe === 'function',
  );
  const measurements = [];
  for (const rows of [100, 1000, 10000])
    measurements.push(
      await page.evaluate((rows) => window.runPerformanceProbe(rows), rows),
    );
  expect(errors).toEqual([]);
  await mkdir('test-results', { recursive: true });
  await writeFile(
    'test-results/performance.json',
    JSON.stringify({ browser: browser.version(), measurements }, null, 2) +
      '\n',
  );
});
