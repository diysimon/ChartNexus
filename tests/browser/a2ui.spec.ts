import { expect, test } from '@playwright/test';

test('A2UI v0.9 processor renders chart catalog, binds data, retains errors, and deletes surface', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/a2ui.html');
  await expect(page.locator('#a2ui-status')).toHaveText('VALID');
  await expect(page.locator('#a2ui-chart svg')).toHaveCount(1);
  await expect(page.locator('#a2ui-chart')).toContainText('Jan');
  await page.click('#native');
  await expect(page.locator('#a2ui-chart')).toContainText('A');
  await expect(page.locator('#a2ui-chart')).not.toContainText('Jan');
  const before = await page.locator('#a2ui-chart svg').innerHTML();
  await page.click('#invalid');
  await expect(page.locator('#a2ui-status')).toContainText('UNKNOWN_FIELD');
  expect(await page.locator('#a2ui-chart svg').innerHTML()).toBe(before);
  await page.click('#partial');
  await expect(page.locator('#a2ui-status')).toContainText('INVALID_JSON');
  expect(await page.locator('#a2ui-chart svg').innerHTML()).toBe(before);
  await page.click('#intent');
  await expect(page.locator('#a2ui-status')).toHaveText('VALID');
  const paths = page.locator('#a2ui-chart svg path');
  for (let i = 0; i < (await paths.count()); i++) {
    const path = paths.nth(i);
    const fill = await path.getAttribute('fill');
    if (fill && fill !== 'none' && fill !== '#fff') {
      await path.click({ force: true });
      if (
        (await page.locator('#a2ui-event').textContent())?.includes(
          'chartRevision',
        )
      )
        break;
    }
  }
  await expect(page.locator('#a2ui-event')).toContainText('chartRevision');
  await page.click('#remove');
  await expect(page.locator('#a2ui-chart svg')).toHaveCount(0);
  expect(errors).toEqual([]);
});
