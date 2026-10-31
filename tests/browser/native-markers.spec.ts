import { expect, test } from '@playwright/test';
import markers from './fixtures/native-markers.json' with { type: 'json' };

test('native markers render and disappear on replacement without stale SVG', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('VALID');
  const doc = { ...markers, id: 'sales' };
  await page.locator('#source').fill(JSON.stringify(doc));
  await page.click('#render');
  await expect(page.locator('#status')).toContainText('VALID');
  const svg = page.locator('#chart svg');
  await expect(svg).toHaveCount(1);
  for (const label of ['5.75', 'Marker point', 'Marker area']) {
    await expect(svg.getByText(label, { exact: true })).toHaveCount(1);
    await expect(svg.getByText(label, { exact: true })).toBeVisible();
  }
  await page.locator('#source').fill(
    JSON.stringify({
      ...doc,
      option: {
        ...doc.option,
        series: [{ type: 'bar', data: [2, 6, 4] }],
      },
    }),
  );
  await page.click('#render');
  await expect(page.locator('#status')).toContainText('VALID');
  await expect(svg).toHaveCount(1);
  for (const label of ['5.75', 'Marker point', 'Marker area']) {
    await expect(svg.getByText(label, { exact: true })).toHaveCount(0);
  }
  await page.click('#dispose');
  await expect(svg).toHaveCount(0);
});
