import { expect, test } from '@playwright/test';

test('A2UI host preserves the last valid chart across ordered operation outcomes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/a2ui-ordered.html');
  await expect(page.locator('#receipt')).toContainText('"revision":1');
  await expect(page.locator('#ordered-chart')).toContainText('Initial');
  await page.click('#newer');
  await expect(page.locator('#receipt')).toContainText('"revision":2');
  await expect(page.locator('#ordered-chart')).toContainText('Newer');
  const before = await page.locator('#ordered-chart svg').innerHTML();
  await page.click('#duplicate');
  await expect(page.locator('#receipt')).toContainText('duplicate');
  await page.click('#stale');
  await expect(page.locator('#diagnostics')).toContainText('REVISION_CONFLICT');
  expect(await page.locator('#ordered-chart svg').innerHTML()).toBe(before);
  await page.click('#pending');
  await expect(page.locator('#receipt')).toContainText('pending');
  expect(await page.locator('#ordered-chart svg').innerHTML()).toBe(before);
  await page.click('#invalid');
  await expect(page.locator('#diagnostics')).not.toHaveText('[]');
  expect(await page.locator('#ordered-chart svg').innerHTML()).toBe(before);
  await page.click('#recover');
  await expect(page.locator('#receipt')).toContainText('"revision":3');
  await expect(page.locator('#ordered-chart')).toContainText('Recovered');
  await page.click('#remove');
  await expect(page.locator('#ordered-chart svg')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('decoded ReadableStream publishes only completed JSON and recovers after cancel or error', async ({
  page,
}) => {
  await page.goto('/a2ui-ordered.html');
  await expect(page.locator('#receipt')).toContainText('"revision":1');
  const chart = page.locator('#ordered-chart');
  const before = await chart.locator('svg').innerHTML();
  await page.click('#stream-start');
  await expect(page.locator('#stream-status')).toHaveText('Receiving');
  expect(await chart.locator('svg').innerHTML()).toBe(before);
  await page.click('#stream-cancel');
  await expect(page.locator('#stream-status')).toHaveText('Cancelled');
  expect(await chart.locator('svg').innerHTML()).toBe(before);
  await page.click('#stream-bad');
  await page.click('#stream-finish');
  await expect(page.locator('#stream-status')).toHaveText('INVALID_JSON');
  expect(await chart.locator('svg').innerHTML()).toBe(before);
  await page.click('#stream-start');
  await page.click('#stream-finish');
  await expect(page.locator('#stream-status')).toHaveText('Complete');
  await expect(chart).toContainText('Streamed');
  await expect(page.locator('#receipt')).toContainText('"revision":2');
});

test('A2UI host can opt into the dark transparent chat profile', async ({
  page,
}) => {
  await page.goto('/a2ui-ordered.html?chat=dark');
  await expect(page.locator('#receipt')).toContainText('"revision":1');
  await expect(page.locator('#ordered-chart svg')).toHaveCount(1);
  await expect(page.locator('#ordered-chart svg')).toContainText('Initial');
  const svg = await page.locator('#ordered-chart svg').innerHTML();
  expect(svg).toContain('#f3f4f6');
  expect(svg).not.toContain('fill="#111827"');
  await page.click('#newer');
  await expect(page.locator('#ordered-chart')).toContainText('Newer');
  await page.click('#stale');
  await expect(page.locator('#diagnostics')).toContainText('REVISION_CONFLICT');
});
