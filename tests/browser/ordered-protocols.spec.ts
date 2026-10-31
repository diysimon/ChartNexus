import { expect, test } from '@playwright/test';

test('OpenUI ordered profile protects updates and waits for stream completion', async ({
  page,
}) => {
  await page.goto('/ordered-protocols.html');
  await expect(page.locator('#open-receipt')).toContainText('"revision":1');
  await page.click('#open-new');
  await expect(page.locator('#open-chart')).toContainText('Newer');
  const before = await page.locator('#open-chart svg').innerHTML();
  await page.click('#open-stale');
  await expect(page.locator('#open-diagnostics')).toContainText(
    'REVISION_CONFLICT',
  );
  expect(await page.locator('#open-chart svg').innerHTML()).toBe(before);
  await page.click('#open-pending');
  await expect(page.locator('#open-receipt')).toContainText('pending');
  await page.click('#open-stream');
  expect(await page.locator('#open-chart svg').innerHTML()).toBe(before);
  await page.click('#open-finish');
  await expect(page.locator('#open-chart')).toContainText('Streamed');
  await expect(page.locator('#open-receipt')).toContainText('"revision":3');
});
test('COSUI JSON ordered profile prevents stale updates and deduplicates retries', async ({
  page,
}) => {
  await page.goto('/ordered-protocols.html');
  await expect(page.locator('#cos-receipt')).toContainText('"revision":1');
  await page.click('#cos-new');
  await expect(page.locator('#cos-chart')).toContainText('Newer');
  const before = await page.locator('#cos-chart svg').innerHTML();
  await page.click('#cos-duplicate');
  await expect(page.locator('#cos-receipt')).toContainText('duplicate');
  await page.click('#cos-stale');
  await expect(page.locator('#cos-diagnostics')).toContainText(
    'REVISION_CONFLICT',
  );
  expect(await page.locator('#cos-chart svg').innerHTML()).toBe(before);
  await page.click('#cos-pending');
  await expect(page.locator('#cos-receipt')).toContainText('pending');
  expect(await page.locator('#cos-chart svg').innerHTML()).toBe(before);
  await page.click('#cos-invalid');
  await expect(page.locator('#cos-diagnostics')).not.toHaveText('[]');
  expect(await page.locator('#cos-chart svg').innerHTML()).toBe(before);
  await page.click('#cos-recover');
  await expect(page.locator('#cos-chart')).toContainText('Recovered');
  await expect(page.locator('#cos-receipt')).toContainText('"revision":3');
});

test('OpenUI and COSUI hosts accept the dark transparent chat profile', async ({
  page,
}) => {
  await page.goto('/ordered-protocols.html?chat=dark');
  await expect(page.locator('#open-receipt')).toContainText('"revision":1');
  await expect(page.locator('#cos-receipt')).toContainText('"revision":1');
  for (const id of ['open-chart', 'cos-chart']) {
    const svg = page.locator(`#${id} svg`);
    await expect(svg).toHaveCount(1);
    expect(await svg.innerHTML()).toContain('#f3f4f6');
    expect(await svg.innerHTML()).not.toContain('fill="#111827"');
  }
  await page.click('#open-new');
  await expect(page.locator('#open-chart')).toContainText('Newer');
  await page.click('#cos-new');
  await expect(page.locator('#cos-chart')).toContainText('Newer');
});
