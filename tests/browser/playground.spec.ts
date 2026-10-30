import { expect, test } from '@playwright/test';

test('renders modes, replaces series and preserves last valid chart on error', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('VALID');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  for (const type of ['group', 'line', 'pie', 'scatter', 'native', 'bar']) {
    await page.selectOption('#example', type);
    await expect(page.locator('#status')).toContainText('VALID');
    await expect(page.locator('#chart svg')).toHaveCount(1);
  }
  await page.selectOption('#example', 'group');
  await expect(page.locator('#chart')).toContainText('West');
  await page.selectOption('#example', 'bar');
  await expect(page.locator('#chart')).not.toContainText('West');
  const before = await page.locator('#chart').innerHTML();
  const oldRevision = await page.locator('#revision').innerText();
  const doc = JSON.parse(await page.locator('#source').inputValue());
  doc.chart.encoding.y.field = 'missing';
  await page.locator('#source').fill(JSON.stringify(doc));
  await page.click('#render');
  await expect(page.locator('#status')).toContainText('UNKNOWN_FIELD');
  expect(await page.locator('#chart').innerHTML()).toBe(before);
  expect(await page.locator('#revision').innerText()).toBe(oldRevision);
  await page.selectOption('#example', 'bar');
  await page.locator('#chart').evaluate((element) => {
    element.style.width = '0px';
  });
  await page.click('#render');
  await expect(page.locator('#status')).toContainText('INVALID_SIZE');
  await page.locator('#chart').evaluate((element) => {
    element.style.width = '';
  });
  await page.click('#dispose');
  await expect(page.locator('#chart svg')).toHaveCount(0);
  await page.selectOption('#example', 'bar');
  await page.click('#mount');
  await expect(page.locator('#status')).toContainText('VALID');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  await page.setViewportSize({ width: 760, height: 900 });
  await expect(page.locator('#chart svg')).toBeVisible();
  expect(errors).toEqual([]);
});

test('emits a positional selection event from the rendered chart', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('VALID');
  const paths = page.locator('#chart svg path');
  let selected = false;
  for (let i = 0; i < (await paths.count()); i++) {
    const path = paths.nth(i);
    const fill = await path.getAttribute('fill');
    if (!fill || fill === 'none' || fill === '#fff') continue;
    await path.click({ force: true });
    if (
      (await page.locator('#event').textContent())?.includes('chartRevision')
    ) {
      selected = true;
      break;
    }
  }
  expect(selected).toBe(true);
  const event = JSON.parse(await page.locator('#event').innerText());
  expect(event.chartId).toBe('sales');
  expect(event.identity).toBe('position');
  expect(event.rowIndex).toBeGreaterThanOrEqual(0);
});

test('captures the verified development preview', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('VALID');
  await page.screenshot({
    path: test.info().outputPath('playground.png'),
    fullPage: true,
  });
  console.log(`Verified Chromium ${browser.version()}`);
});
