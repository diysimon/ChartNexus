import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('chat preview adapts themes, five levels, chart types, widths and SVG export', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/chat.html');
  await expect(page.locator('#chart-status')).toHaveText('VALID 1');
  await expect(page.locator('#chat-chart svg')).toHaveCount(1);
  await expect(page.locator('#chart-summary')).toContainText('Jan 120');
  for (const value of [
    'minimal',
    'simple',
    'standard',
    'detailed',
    'comprehensive',
  ]) {
    await page.selectOption('#level', value);
    await expect(page.locator('#chart-status')).toContainText('VALID');
    await expect(page.locator('#chat-chart svg')).toHaveCount(1);
  }
  await page.selectOption('#theme', 'dark');
  await expect(page.locator('#conversation')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  await page.selectOption('#width', 'narrow');
  await expect(page.locator('#answer')).toHaveClass(/narrow/);
  for (const value of ['combo', 'funnel', 'heatmap', 'bar']) {
    await page.selectOption('#chart-type', value);
    await expect(page.locator('#chart-status')).toContainText('VALID');
    await expect(page.locator('#chat-chart svg')).toHaveCount(1);
  }
  await page.selectOption('#chart-type', 'heatmap');
  await expect(page.locator('#chart-summary')).toContainText('缺失');
  await expect(page.locator('#chat-chart')).toContainText('10');
  await expect(page.locator('#chat-chart')).toContainText('0');
  await expect
    .poll(() =>
      page
        .locator('#chat-chart')
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    )
    .toBe(true);
  const downloadPromise = page.waitForEvent('download');
  await page.click('#download');
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  expect(await readFile(path!, 'utf8')).toContain('<svg');
  await page.selectOption('#background', 'theme');
  await expect(page.locator('#chart-status')).toContainText('VALID');
  await page.setViewportSize({ width: 375, height: 800 });
  await expect
    .poll(() =>
      page
        .locator('#chat-chart')
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
