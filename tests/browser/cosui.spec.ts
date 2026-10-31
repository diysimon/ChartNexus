import { expect, test } from '@playwright/test';

test('COSUI Dynamic UI renders and updates charts with diagnostics and cleanup', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/cosui.html');
  await expect(page.locator('#cosui-status')).toHaveText('VALID');
  await expect(page.locator('#cosui-chart svg')).toHaveCount(1);
  await expect(page.locator('#cosui-chart')).toContainText('Jan');
  await page.click('#native');
  await expect(page.locator('#cosui-chart')).toContainText('A');
  await expect(page.locator('#cosui-chart')).not.toContainText('Jan');
  const before = await page.locator('#cosui-chart svg').innerHTML();
  await page.click('#invalid');
  await expect(page.locator('#cosui-status')).toContainText('UNKNOWN_FIELD');
  expect(await page.locator('#cosui-chart svg').innerHTML()).toBe(before);
  await page.click('#partial');
  await expect(page.locator('#cosui-status')).not.toHaveText('VALID');
  expect(await page.locator('#cosui-chart svg').innerHTML()).toBe(before);
  await page.click('#intent');
  await expect(page.locator('#cosui-status')).toHaveText('VALID');
  const paths = page.locator('#cosui-chart svg path');
  for (let i = 0; i < (await paths.count()); i++) {
    const path = paths.nth(i);
    const fill = await path.getAttribute('fill');
    if (fill && fill !== 'none' && fill !== '#fff') {
      await path.click({ force: true });
      if (
        (await page.locator('#cosui-event').textContent())?.includes(
          'chartRevision',
        )
      )
        break;
    }
  }
  await expect(page.locator('#cosui-event')).toContainText('chartRevision');
  await page.click('#remove');
  await expect(page.locator('#cosui-chart svg')).toHaveCount(0);
  expect(errors).toEqual([]);
});
