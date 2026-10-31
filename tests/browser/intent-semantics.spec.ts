import { expect, test, type Page } from '@playwright/test';

async function show(page: Page, document: unknown) {
  await page.locator('#source').fill(JSON.stringify(document));
  await page.click('#render');
  await expect(page.locator('#status')).toContainText('VALID');
}
async function countLargeArcs(page: Page) {
  return page.locator('#chart svg').evaluate(
    (svg) =>
      Array.from(svg.querySelectorAll('path')).filter((path) => {
        const bounds = path.getBBox();
        return (
          /A/.test(path.getAttribute('d') ?? '') &&
          bounds.width > 30 &&
          bounds.height > 30
        );
      }).length,
  );
}
test('zero pie and donut expose no shares, then recover to positive and empty input', async ({
  page,
}) => {
  await page.goto('/');
  await page.click('#dispose');
  await page.locator('#chart').evaluate((el) => {
    el.setAttribute('aria-label', 'Sales data');
    el.setAttribute('role', 'figure');
  });
  await page.click('#mount');
  const source = JSON.parse(await page.locator('#source').inputValue());
  const document = {
    ...source,
    schemaVersion: '0.2',
    chart: { ...source.chart, type: 'pie' },
    data: {
      ...source.data,
      rows: source.data.rows.map((row: Record<string, unknown>) => ({
        ...row,
        revenue: 0,
      })),
    },
  };
  for (const donut of [false, true]) {
    await show(page, { ...document, chart: { ...document.chart, donut } });
    await expect(page.locator('#chart')).toContainText(
      'No shares: all values are zero.',
    );
    await expect(page.locator('#chart')).toHaveAttribute(
      'aria-label',
      'No shares: all values are zero.',
    );
    expect(await countLargeArcs(page)).toBe(0);
    await show(page, {
      ...document,
      data: source.data,
      chart: { ...document.chart, donut },
    });
    expect(await countLargeArcs(page)).toBeGreaterThan(0);
    await expect(page.locator('#chart')).not.toContainText('No shares:');
    await expect(page.locator('#chart')).not.toHaveAttribute(
      'aria-label',
      'No shares: all values are zero.',
    );
    await expect(page.locator('#chart')).toHaveAttribute(
      'aria-label',
      'Sales data',
    );
    await expect(page.locator('#chart')).toHaveAttribute('role', 'figure');
  }
  await show(page, { ...document, data: { ...document.data, rows: [] } });
  expect(await countLargeArcs(page)).toBe(0);
  await expect(page.locator('#chart')).not.toContainText('No shares:');
  await expect(page.locator('#chart')).not.toHaveAttribute(
    'aria-label',
    'No shares: all values are zero.',
  );
  await show(page, document);
  await page.locator('#source').fill('{}');
  await page.click('#render');
  await expect(page.locator('#status')).toContainText('INVALID_SCHEMA');
  await expect(page.locator('#chart')).toHaveAttribute(
    'aria-label',
    'No shares: all values are zero.',
  );
  await page.click('#dispose');
  await expect(page.locator('#chart')).toHaveAttribute(
    'aria-label',
    'Sales data',
  );
  await expect(page.locator('#chart')).toHaveAttribute('role', 'figure');
});

test('empty and literal group labels toggle independently', async ({
  page,
}) => {
  await page.goto('/');
  const source = JSON.parse(await page.locator('#source').inputValue());
  const document = {
    ...source,
    schemaVersion: '0.2',
    data: {
      kind: 'inline',
      fields: ['month', 'revenue', 'region'],
      rows: [
        { month: 'A', revenue: 2, region: '' },
        { month: 'A', revenue: 3, region: 'revenue' },
        { month: 'A', revenue: 4, region: '(empty)' },
      ],
    },
    chart: {
      ...source.chart,
      encoding: { ...source.chart.encoding, series: { field: 'region' } },
    },
    presentation: { theme: { id: 'light', version: '1' } },
  };
  await show(page, document);
  const legend = page.locator('#chart svg text');
  await expect(legend.filter({ hasText: /^\(empty\) \[2\]$/ })).toHaveCount(1);
  await expect(legend.filter({ hasText: /^\(empty\)$/ })).toHaveCount(1);
  const barCounts = () =>
    page.locator('#chart svg').evaluate((svg) => {
      const colors = ['#2563eb', '#b45309', '#047857'];
      return colors.map(
        (color) =>
          Array.from(svg.querySelectorAll('path')).filter(
            (path) =>
              path.getAttribute('fill') === color && path.getBBox().height > 30,
          ).length,
      );
    });
  expect(await barCounts()).toEqual([1, 1, 1]);
  await legend.filter({ hasText: /^\(empty\) \[2\]$/ }).click({ force: true });
  await page.mouse.move(0, 0);
  await expect.poll(barCounts).toEqual([0, 1, 1]);
  await legend.filter({ hasText: /^\(empty\)$/ }).click({ force: true });
  await page.mouse.move(0, 0);
  await expect.poll(barCounts).toEqual([0, 1, 0]);
  await legend.filter({ hasText: /^\(empty\) \[2\]$/ }).click({ force: true });
  await page.mouse.move(0, 0);
  await expect.poll(barCounts).toEqual([1, 1, 0]);
});

test('chat minimal keeps zero-share explanation in both themes', async ({
  page,
}) => {
  await page.goto('/chat.html');
  await page.selectOption('#chart-type', 'zero-pie');
  await page.selectOption('#level', 'minimal');
  for (const theme of ['light', 'dark']) {
    await page.selectOption('#theme', theme);
    await expect(page.locator('#chat-chart')).toContainText(
      'No shares: all values are zero.',
    );
    await expect(page.locator('#chart-summary')).toContainText(
      '没有可计算的占比',
    );
  }
});
