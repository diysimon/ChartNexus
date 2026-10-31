import { expect, test } from '@playwright/test';

test('Marklang host renders complete chart data, preserves invalid and partial updates, and disposes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/marklang.html');
  await expect(page.locator('#marklang-status')).toHaveText('VALID');
  await expect(page.locator('#marklang-chart svg')).toHaveCount(1);
  await expect(page.locator('#marklang-chart')).toContainText('Jan');
  await page.click('#native');
  await expect(page.locator('#marklang-chart')).toContainText('A');
  await expect(page.locator('#marklang-chart')).not.toContainText('Jan');
  const before = await page.locator('#marklang-chart svg').innerHTML();
  await page.click('#stream');
  expect(await page.locator('#marklang-chart svg').innerHTML()).toBe(before);
  await page.click('#invalid');
  await expect(page.locator('#marklang-status')).toContainText('UNKNOWN_FIELD');
  expect(await page.locator('#marklang-chart svg').innerHTML()).toBe(before);
  await page.click('#missing');
  await expect(page.locator('#marklang-status')).not.toHaveText('VALID');
  expect(await page.locator('#marklang-chart svg').innerHTML()).toBe(before);
  await page.click('#duplicate');
  await expect(page.locator('#marklang-status')).toContainText(
    'INVALID_DATA_NAME',
  );
  expect(await page.locator('#marklang-chart svg').innerHTML()).toBe(before);
  await page.click('#intent');
  await expect(page.locator('#marklang-status')).toHaveText('VALID');
  const paths = page.locator('#marklang-chart svg path');
  for (let i = 0; i < (await paths.count()); i++) {
    const path = paths.nth(i);
    const fill = await path.getAttribute('fill');
    if (fill && fill !== 'none' && fill !== '#fff') {
      await path.click({ force: true });
      if (
        (await page.locator('#marklang-event').textContent())?.includes(
          'chartRevision',
        )
      )
        break;
    }
  }
  await expect(page.locator('#marklang-event')).toContainText('chartRevision');
  await page.click('#remove');
  await expect(page.locator('#marklang-chart svg')).toHaveCount(0);
  expect(errors).toEqual([]);
});
