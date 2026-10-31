import { expect, test } from '@playwright/test';
test('0.2 variants and themes render in the browser', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/core-02.html');
  await expect(page.locator('#status')).toHaveText('VALID 1');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  await expect(page.locator('#chart')).toContainText('Jan');
  await page.click('#area');
  await expect(page.locator('#status')).toHaveText('VALID 2');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  await page.click('#donut');
  await expect(page.locator('#status')).toHaveText('VALID 3');
  await expect(page.locator('#chart')).toContainText('Jan');
  await page.click('#sorted');
  await expect(page.locator('#status')).toHaveText('VALID 4');
  const paths = page.locator('#chart svg path');
  for (let i = 0; i < (await paths.count()); i++) {
    const path = paths.nth(i);
    const fill = await path.getAttribute('fill');
    if (fill && fill !== 'none' && fill !== '#fff') {
      await path.click({ force: true });
      if (await page.locator('#selection').textContent()) break;
    }
  }
  await expect(page.locator('#selection')).not.toHaveText('');
  const selection = JSON.parse(
    (await page.locator('#selection').textContent())!,
  );
  expect(selection.rowIndex).toBe([1, 2, 0][selection.dataIndex]);
  await page.click('#unit');
  await expect(page.locator('#status')).toHaveText('VALID 5');
  await expect(page.locator('#chart')).toContainText('revenue (USD)');
  await page.click('#date');
  await expect(page.locator('#status')).toHaveText('VALID 6');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  await expect(page.locator('#chart')).toContainText('value (%)');
  await page.click('#aggregate');
  await expect(page.locator('#status')).toHaveText('VALID 7');
  const aggregatePaths = page.locator('#chart svg path');
  for (let i = 0; i < (await aggregatePaths.count()); i++) {
    const path = aggregatePaths.nth(i);
    const fill = await path.getAttribute('fill');
    if (fill && fill !== 'none' && fill !== '#fff') {
      await path.click({ force: true });
      if (await page.locator('#selection').textContent()) break;
    }
  }
  await expect(page.locator('#selection')).not.toHaveText('');
  const selectedAggregate = JSON.parse(
    (await page.locator('#selection').textContent())!,
  );
  expect(selectedAggregate).toMatchObject({
    identity: 'aggregate',
    rowIndex: null,
    aggregate: { operation: 'sum' },
  });
  const counts: Record<string, number> = { Jan: 2, Feb: 1 };
  expect(selectedAggregate.aggregate.sourceCount).toBe(
    counts[selectedAggregate.aggregate.category],
  );
  await page.click('#strict-native');
  await expect(page.locator('#status')).toHaveText('VALID 8');
  await expect(page.locator('#chart')).toContainText('A');
  const beforeStrictFailure = await page.locator('#chart svg').innerHTML();
  await page.click('#strict-invalid');
  await expect(page.locator('#status')).toContainText('INVALID_NATIVE_STRICT');
  expect(await page.locator('#chart svg').innerHTML()).toBe(
    beforeStrictFailure,
  );
  await page.click('#labels');
  await expect(page.locator('#status')).toHaveText('VALID 9');
  await expect(page.locator('#chart')).toContainText('120');
  await expect(page.locator('#chart')).toContainText('revenue');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  await page.click('#instant');
  await expect(page.locator('#status')).toHaveText('VALID 10');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  await expect(page.locator('#chart')).toContainText('time');
  await page.click('#combo');
  await expect(page.locator('#status')).toHaveText('VALID 11');
  await expect(page.locator('#chart')).toContainText('sales');
  await expect(page.locator('#chart')).toContainText('cost');
  await expect(page.locator('#chart')).toContainText('Jan');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  await page.click('#funnel');
  await expect(page.locator('#status')).toHaveText('VALID 12');
  await expect(page.locator('#chart')).toContainText('Jan');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  await page.click('#dual');
  await expect(page.locator('#status')).toHaveText('VALID 13');
  await expect(page.locator('#chart')).toContainText('sales (USD)');
  await expect(page.locator('#chart')).toContainText('growth (ratio)');
  await expect(page.locator('#chart svg')).toHaveCount(1);
  expect(errors).toEqual([]);
});
