import { expect, test } from '@playwright/test';

test('waiting mount recovers once, keyed selections, keyboard table and resize preserve revision', async ({
  page,
}) => {
  await page.route('**/quality.html', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        '<body>',
        '<body><style id="hidden">#host {display:none}</style>',
      ),
    });
  });
  await page.goto('/quality.html');
  await expect
    .poll(() => page.evaluate(() => window.chartQuality?.state()))
    .toBe('waiting-for-size');
  await expect(page.locator('#quality-chart svg')).toHaveCount(0);
  await page.locator('#hidden').evaluate((el) => el.remove());
  await expect(page.locator('#quality-chart svg')).toHaveCount(1);
  const revision = await page.evaluate(() => window.chartQuality.revision());
  expect(revision).toBe(1);
  const summary = page.locator('#host summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#host table')).toBeVisible();
  await expect(page.locator('#host table')).toContainText('Jan');
  await page.locator('#host').evaluate((el) => {
    el.style.width = '200px';
  });
  await expect(page.locator('#quality-chart')).toContainText('Table view');
  expect(await page.evaluate(() => window.chartQuality.revision())).toBe(
    revision,
  );
  await page.locator('#host').evaluate((el) => {
    el.style.width = '768px';
  });
  await expect(page.locator('#quality-chart')).toContainText('Jan');
  await page.evaluate(() => {
    const doc = structuredClone(window.chartQuality.base);
    doc.data.rows.reverse();
    window.chartQuality.update(doc);
  });
  const bars = page.locator('#quality-chart svg path[fill="#2563eb"]');
  await bars.first().click({ force: true });
  await expect(page.locator('#quality-event')).toContainText(
    '"identity":"key"',
  );
  const selection = JSON.parse(
    (await page.locator('#quality-event').textContent())!,
  );
  expect(selection.rowKey).toBe(['Mar', 'Feb', 'Jan'][selection.rowIndex]);
  const current = await page.evaluate(() => window.chartQuality.revision());
  expect(
    await page.evaluate(() => window.chartQuality.failResize()),
  ).toMatchObject({ ok: false, diagnostics: [{ code: 'RENDER_FAILED' }] });
  expect(await page.evaluate(() => window.chartQuality.revision())).toBe(
    current,
  );
  await page.evaluate(() => window.chartQuality.dispose());
  await expect(page.locator('#quality-chart svg')).toHaveCount(0);
  await expect(page.locator('#host [data-chartnexus-accessible]')).toHaveCount(
    0,
  );
});

test('disposing while waiting prevents a late mount', async ({ page }) => {
  await page.route('**/quality.html', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        '<body>',
        '<body><style id="hidden">#host {display:none}</style>',
      ),
    });
  });
  await page.goto('/quality.html');
  await expect
    .poll(() => page.evaluate(() => window.chartQuality?.state()))
    .toBe('waiting-for-size');
  await page.evaluate(() => window.chartQuality.dispose());
  await page.locator('#hidden').evaluate((el) => el.remove());
  await expect
    .poll(() => page.evaluate(() => window.chartQuality.state()))
    .toBe('disposed');
  await expect(page.locator('#quality-chart svg')).toHaveCount(0);
});

test('Marklang stages all charts before swap and preserves old nodes on second render failure', async ({
  page,
}) => {
  await page.goto('/quality.html');
  await expect(page.locator('#quality-chart svg')).toHaveCount(1);
  expect(
    await page.evaluate(() => window.chartQuality.markdown(2)),
  ).toMatchObject({ ok: true, value: { rendered: 2 } });
  await expect(page.locator('#markdown svg')).toHaveCount(2);
  await page
    .locator('#markdown svg')
    .first()
    .evaluate((el) => el.setAttribute('data-old', 'yes'));
  const before = await page.locator('#markdown').innerHTML();
  expect(
    await page.evaluate(() => window.chartQuality.markdownFailure()),
  ).toMatchObject({ ok: false, diagnostics: [{ code: 'RENDER_FAILED' }] });
  expect(await page.locator('#markdown').innerHTML()).toBe(before);
  await expect(page.locator('[data-chartnexus-staging]')).toHaveCount(0);
  expect(
    await page.evaluate(() => window.chartQuality.markdown(1)),
  ).toMatchObject({ ok: true, value: { rendered: 1 } });
  await expect(page.locator('#markdown svg')).toHaveCount(1);
});

test('keyboard legend selection survives reorder and resets on incompatible units', async ({
  page,
}) => {
  await page.goto('/quality.html');
  await expect(page.locator('#quality-chart svg')).toHaveCount(1);
  const grouped = await page.evaluate(() => {
    const doc = window.chartQuality.base;
    return {
      ...doc,
      data: {
        kind: 'inline',
        fields: ['category', 'value', 'group'],
        rows: [
          { category: 'A', value: 3, group: 'East' },
          { category: 'A', value: 5, group: 'West' },
        ],
      },
      chart: {
        type: 'bar',
        encoding: {
          x: { field: 'category', type: 'ordinal' },
          y: { field: 'value', type: 'quantitative' },
          series: { field: 'group' },
        },
      },
    };
  });
  await page.evaluate((doc) => window.chartQuality.update(doc), grouped);
  const east = page.locator('#host button[data-legend-name="East"]');
  await east.focus();
  await page.keyboard.press('Enter');
  await expect(east).toHaveAttribute('aria-pressed', 'false');
  grouped.data.rows.reverse();
  await page.evaluate((doc) => window.chartQuality.update(doc), grouped);
  await expect(east).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(
    (doc) =>
      window.chartQuality.update({
        ...doc,
        chart: {
          ...doc.chart,
          encoding: {
            ...doc.chart.encoding,
            y: {
              ...doc.chart.encoding.y,
              unit: { kind: 'unit', label: 'items' },
            },
          },
        },
      }),
    grouped,
  );
  await expect(east).toHaveAttribute('aria-pressed', 'true');
  grouped.data.rows = [
    { category: 'A', value: 8, group: 'West' },
    { category: 'A', value: 6, group: 'North' },
  ];
  await page.evaluate((doc) => window.chartQuality.update(doc), grouped);
  await expect(east).toHaveCount(0);
  await expect(
    page.locator('#host button[data-legend-name="North"]'),
  ).toHaveAttribute('aria-pressed', 'true');
});

for (const [url, selector, show] of [
  ['/openui.html', '#openui-chart svg', '#app'],
  ['/a2ui.html', '#app svg', '#app'],
  ['/cosui.html', '#cosui-chart svg', '#cosui-chart'],
] as const) {
  test(`${url} actual adapter recovers initial hidden container`, async ({
    page,
  }) => {
    await page.route(`**${url}`, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replace(
          '</head>',
          `<style id="hidden">${show}{display:none!important}</style></head>`,
        ),
      });
    });
    await page.goto(url);
    await expect(page.locator(selector)).toHaveCount(0);
    await page.locator('#hidden').evaluate((el) => el.remove());
    await expect(page.locator(selector)).toHaveCount(1);
  });
}

test('dimension matrix fits visible text or announces table fallback; export-sized samples', async ({
  page,
}) => {
  await page.goto('/quality.html');
  await expect(page.locator('#quality-chart svg')).toHaveCount(1);
  for (const width of [240, 320, 480, 768])
    for (const height of [240, 320, 480]) {
      await page.locator('#host').evaluate((element, width) => {
        element.style.width = `${width}px`;
      }, width);
      await page.locator('#quality-chart').evaluate((element, height) => {
        element.style.height = `${height}px`;
      }, height);
      await expect
        .poll(() => page.locator('#quality-chart svg').getAttribute('width'))
        .toBe(String(width));
      await expect
        .poll(() => page.locator('#quality-chart svg').getAttribute('height'))
        .toBe(String(height));
      const overflow = () =>
        page.locator('#quality-chart svg').evaluate((svg) => {
          const box = svg.getBoundingClientRect();
          return Array.from(svg.querySelectorAll('text'))
            .filter((text) => {
              const b = text.getBoundingClientRect();
              return (
                b.width > 0 &&
                (b.left < box.left - 2 ||
                  b.right > box.right + 2 ||
                  b.top < box.top - 2 ||
                  b.bottom > box.bottom + 2)
              );
            })
            .map((el) => el.textContent);
        });
      await expect
        .poll(overflow, { message: `${width}x${height}` })
        .toEqual([]);
    }
  await page.screenshot({ path: 'test-results/m2-layout.png', fullPage: true });
});

test('Marklang waits while hidden and recovers a complete transaction', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/quality.html');
  await expect(page.locator('#quality-chart svg')).toHaveCount(1);
  for (const count of [2, 1, 2]) {
    // Keep hide/update/show in the same frame: ResizeObserver may otherwise
    // report no size change even though update saw a hidden container.
    const result = await page.locator('#markdown').evaluate((el, count) => {
      el.style.display = 'none';
      const pending = window.chartQuality.markdown(count);
      el.style.display = 'block';
      return pending;
    }, count);
    expect(result).toMatchObject({ ok: true, value: { pending: true } });
    await expect(page.locator('#markdown svg')).toHaveCount(count);
  }
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(errors).toEqual([]);
});

test('reserved JavaScript legend names keep original labels and remain keyboard operable', async ({
  page,
}) => {
  await page.goto('/quality.html');
  await expect(page.locator('#quality-chart svg')).toHaveCount(1);
  const result = await page.evaluate(() => {
    const doc = window.chartQuality.base;
    return window.chartQuality.update({
      ...doc,
      data: {
        kind: 'inline',
        fields: ['x', 'y', 'group'],
        rows: [
          { x: 'A', y: 3, group: 'hasOwnProperty' },
          { x: 'A', y: 5, group: '__proto__' },
        ],
      },
      chart: {
        type: 'bar',
        encoding: {
          x: { field: 'x', type: 'ordinal' },
          y: { field: 'y', type: 'quantitative' },
          series: { field: 'group' },
        },
      },
    });
  });
  expect(result).toMatchObject({ ok: true });
  const button = page.getByRole('button', {
    name: 'hasOwnProperty',
    exact: true,
  });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('long bilingual labels, dual axes and heatmap scales fit or expose full data in both themes', async ({
  page,
}) => {
  const { default: combo } = await import(
    '../../resources/recipes/combo.json',
    { with: { type: 'json' } }
  );
  const { default: heatmap } = await import(
    '../../resources/recipes/heatmap.json',
    { with: { type: 'json' } }
  );
  await page.goto('/quality.html');
  await expect(page.locator('#quality-chart svg')).toHaveCount(1);
  const base = await page.evaluate(() => window.chartQuality.base);
  const longBar = {
    ...base,
    data: {
      kind: 'inline',
      fields: ['month', 'revenue'],
      rows: [
        { month: '很长的中文分类名称与原始数据标签', revenue: 12 },
        {
          month: 'A long English category that must remain accessible',
          revenue: null,
        },
      ],
    },
  };
  for (const theme of ['light', 'dark'] as const)
    for (const width of [320, 768])
      for (const sample of [longBar, combo, heatmap]) {
        await page.locator('#host').evaluate(
          (el, settings) => {
            el.style.width = `${settings.width}px`;
            el.style.background =
              settings.theme === 'dark' ? '#111827' : '#fff';
          },
          { width, theme },
        );
        const input = {
          ...sample,
          id: base.id,
          schemaVersion: '0.3',
          chart: {
            ...sample.chart,
            title: '完整中文标题与 English context that must remain accessible',
          },
          presentation: { theme, detailLevel: 'comprehensive' },
        };
        expect(
          await page.evaluate((doc) => window.chartQuality.update(doc), input),
        ).toMatchObject({ ok: true });
        await expect(
          page.locator('#host [data-chartnexus-accessible]'),
        ).toContainText(input.chart.title);
        await expect
          .poll(() =>
            page.locator('#quality-chart svg').evaluate((svg) => {
              const box = svg.getBoundingClientRect();
              return Array.from(svg.querySelectorAll('text'))
                .filter((el) => {
                  const b = el.getBoundingClientRect();
                  return (
                    b.width > 0 &&
                    (b.left < box.left - 2 ||
                      b.right > box.right + 2 ||
                      b.top < box.top - 2 ||
                      b.bottom > box.bottom + 2)
                  );
                })
                .map((el) => el.textContent);
            }),
          )
          .toEqual([]);
      }
  await expect(page.locator('#host [data-legend-name]')).toHaveCount(0);
  await page.screenshot({
    path: 'test-results/m2-dark-heatmap.png',
    fullPage: true,
  });
});
