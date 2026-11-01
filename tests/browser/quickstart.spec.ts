import { expect, test } from '@playwright/test';

test('quick start renders a complete document and preserves the last chart on invalid input', async ({
  page,
}) => {
  await page.goto('/quickstart.html');
  const chart = page.locator('#chart');
  const status = page.locator('#status');
  const source = page.locator('#source');
  await expect(status).toContainText('VALID · revision 1');
  await expect(chart.locator('svg')).toHaveCount(1);
  await expect(chart).toContainText('Jan');
  const before = await chart.innerHTML();
  await source.fill('{');
  await page.click('#update');
  await expect(status).toContainText('INVALID_JSON');
  expect(await chart.innerHTML()).toBe(before);
  const original = {
    schemaVersion: '0.3',
    id: 'sales',
    mode: 'intent',
    data: {
      kind: 'inline',
      fields: ['month', 'revenue'],
      rows: [{ month: 'Apr', revenue: 12 }],
    },
    chart: {
      type: 'bar',
      encoding: {
        x: { field: 'month', type: 'ordinal' },
        y: { field: 'revenue', type: 'quantitative' },
      },
    },
  };
  const invalid = structuredClone(original);
  invalid.chart.encoding.y.field = 'missing';
  await source.fill(JSON.stringify(invalid));
  await page.click('#update');
  await expect(status).toContainText('UNKNOWN_FIELD');
  expect(await chart.innerHTML()).toBe(before);
  await source.fill(JSON.stringify(original));
  await page.click('#update');
  await expect(status).toContainText('VALID · revision 2');
  await expect(chart).toContainText('Apr');
});
