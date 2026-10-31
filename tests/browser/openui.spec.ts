import { expect, test } from '@playwright/test';

test('OpenUI renderer preserves charts during streaming and invalid updates and cleans up', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/openui.html');
  await expect(page.locator('#openui-status')).toHaveText('VALID');
  await expect(page.locator('#openui-chart svg')).toHaveCount(1);
  await expect(page.locator('#openui-chart')).toContainText('Jan');
  await page.click('#stream');
  await page.locator('#openui-source').fill('root = ChartNexusChart("partial');
  await expect(page.locator('#openui-chart')).toContainText('Jan');
  await page.click('#native');
  await expect(page.locator('#openui-chart')).toContainText('A');
  await expect(page.locator('#openui-chart')).not.toContainText('Jan');
  const before = await page.locator('#openui-chart svg').innerHTML();
  await page.click('#invalid');
  await expect(page.locator('#openui-status')).toContainText('UNKNOWN_FIELD');
  expect(await page.locator('#openui-chart svg').innerHTML()).toBe(before);
  await page
    .locator('#openui-source')
    .fill('root = ChartNexusChart("{bad json")');
  await page.click('#commit');
  await expect(page.locator('#openui-status')).toContainText('INVALID_JSON');
  expect(await page.locator('#openui-chart svg').innerHTML()).toBe(before);
  await page.click('#intent');
  await expect(page.locator('#openui-status')).toHaveText('VALID');
  const paths = page.locator('#openui-chart svg path');
  for (let i = 0; i < (await paths.count()); i++) {
    const path = paths.nth(i);
    const fill = await path.getAttribute('fill');
    if (fill && fill !== 'none' && fill !== '#fff') {
      await path.click({ force: true });
      if (
        (await page.locator('#openui-event').textContent())?.includes(
          'chartRevision',
        )
      )
        break;
    }
  }
  await expect(page.locator('#openui-event')).toContainText('chartRevision');
  await page.click('#unmount');
  await expect(page.locator('#openui-chart svg')).toHaveCount(0);
  expect(errors).toEqual([]);
});
