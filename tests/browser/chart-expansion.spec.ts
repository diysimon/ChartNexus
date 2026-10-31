import { test, expect } from '@playwright/test';
for (const type of ['radar', 'tree', 'sankey', 'map'])
  test(`${type}: real browser themes/levels, data access and selection identities`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/expansion.html');
    await page.selectOption('#type', type);
    await expect(page.locator('#status')).toContainText('VALID');
    for (const theme of ['light', 'dark']) {
      await page.selectOption('#theme', theme);
      for (const level of [
        'minimal',
        'simple',
        'standard',
        'detailed',
        'comprehensive',
      ]) {
        await page.selectOption('#level', level);
        await expect(page.locator('#status')).toContainText('VALID');
        await expect(page.locator('#chart svg')).toHaveCount(1);
        expect(await page.locator('#chart').innerHTML()).not.toMatch(
          /(?:NaN|Infinity)/,
        );
      }
      await page.screenshot({
        path: `test-results/m3-${type}-${theme}.png`,
        fullPage: true,
      });
    }
    await page.locator('[data-chartnexus-accessible] summary').first().focus();
    await page.keyboard.press('Enter');
    await expect(
      page.locator('[data-chartnexus-accessible] table'),
    ).toBeVisible();
    if (type === 'sankey') {
      await expect(page.locator('#chart')).toContainText('Input');
      await expect(page.locator('#chart')).not.toContainText('["node"');
    }
    const points = await page
      .locator('#chart svg path, #chart svg rect, #chart svg circle')
      .evaluateAll((elements) =>
        elements.flatMap((el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return [];
          return [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }];
        }),
      );
    const identities = new Set<string>();
    for (const point of points) {
      await page.mouse.click(point.x, point.y);
      const text = await page.locator('#event').innerText();
      if (text.startsWith('{')) {
        const event = JSON.parse(text);
        identities.add(event.identity);
        expect(event.eventVersion).toBe('0.3');
        expect(event.chartId).toBe('expansion');
      }
    }
    if (type === 'tree') expect(identities.has('node')).toBe(true);
    else if (type === 'sankey') {
      expect(identities.has('node')).toBe(true);
      expect(identities.has('edge')).toBe(true);
    } else if (type === 'map') expect(identities.has('region')).toBe(true);
    else expect(identities.has('position')).toBe(true);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.chartExpansion.dispose());
    await expect(page.locator('#chart svg')).toHaveCount(0);
    await expect(page.locator('[data-chartnexus-accessible]')).toHaveCount(0);
  });
test('tree expansion survives reordered updates and resize, then resets on topology change', async ({
  page,
}) => {
  await page.goto('/expansion.html');
  await page.selectOption('#type', 'tree');
  await expect(page.locator('#status')).toContainText('VALID');
  const revision = await page.evaluate(() => window.chartExpansion.revision());
  await page.evaluate(() => {
    window.chartExpansion.action({
      type: 'treeExpandAndCollapse',
      seriesIndex: 0,
      dataIndex: 1,
    });
    window.chartExpansion.resize();
  });
  const rootCollapsed = () =>
    page.evaluate(() => {
      const series = window.chartExpansion.option().series as {
        data: { collapsed: boolean }[];
      }[];
      return series[0]!.data[0]!.collapsed;
    });
  expect(await rootCollapsed()).toBe(true);
  expect(await page.evaluate(() => window.chartExpansion.revision())).toBe(
    revision,
  );
  await page.evaluate(() => {
    const doc = structuredClone(window.chartExpansion.recipes.tree);
    doc.id = 'expansion';
    doc.data.rows.reverse();
    window.chartExpansion.update(doc);
  });
  expect(await rootCollapsed()).toBe(true);
  await page.selectOption('#width', '480');
  expect(await rootCollapsed()).toBe(true);
  await page.evaluate(() => {
    const doc = structuredClone(window.chartExpansion.recipes.tree);
    doc.id = 'expansion';
    doc.data.rows.push({ id: 'new', parent: 'root', label: 'Added' });
    window.chartExpansion.update(doc);
  });
  expect(await rootCollapsed()).toBe(false);
  const before = await page.evaluate(() => window.chartExpansion.revision());
  expect(
    await page.evaluate(() => {
      const doc = structuredClone(window.chartExpansion.recipes.tree);
      doc.id = 'expansion';
      doc.data.rows[0]!.parent = 'c';
      return window.chartExpansion.update(doc);
    }),
  ).toMatchObject({ ok: false });
  expect(await page.evaluate(() => window.chartExpansion.revision())).toBe(
    before,
  );
});
test('narrow diagrams fall back with full data and recover without changing revision', async ({
  page,
}) => {
  await page.goto('/expansion.html');
  for (const type of ['radar', 'tree', 'sankey']) {
    await page.selectOption('#type', type);
    await page.selectOption('#width', '768');
    await expect(page.locator('#status')).toContainText('VALID');
    const revision = await page.evaluate(() =>
      window.chartExpansion.revision(),
    );
    await page.selectOption('#width', '240');
    await expect(page.locator('#chart')).toContainText('Table view');
    await expect(
      page.locator('[data-chartnexus-accessible] summary').first(),
    ).toContainText('Full data');
    await page.selectOption('#width', '768');
    await expect(page.locator('#chart')).not.toContainText('Table view');
    expect(await page.evaluate(() => window.chartExpansion.revision())).toBe(
      revision,
    );
  }
});
test('map failures preserve a valid rendered revision and zero/missing values remain distinct', async ({
  page,
}) => {
  await page.goto('/expansion.html');
  await page.selectOption('#type', 'map');
  await expect(page.locator('#status')).toContainText('VALID');
  const revision = await page.evaluate(() => window.chartExpansion.revision());
  expect(
    await page.evaluate(() => {
      const doc = structuredClone(window.chartExpansion.recipes.map);
      doc.id = 'expansion';
      doc.chart.mapRef.revision = 'wrong';
      return window.chartExpansion.update(doc);
    }),
  ).toMatchObject({ ok: false });
  expect(await page.evaluate(() => window.chartExpansion.revision())).toBe(
    revision,
  );
  await page.evaluate(() => {
    const doc = structuredClone(window.chartExpansion.recipes.map);
    doc.id = 'expansion';
    doc.data.rows.pop();
    return window.chartExpansion.update(doc);
  });
  const series = (await page.evaluate(
    () => window.chartExpansion.option().series,
  )) as { data: { name: string; value: number | null }[] }[];
  expect(series[0]!.data.map((p) => [p.name, p.value])).toEqual([
    ['West', 0],
    ['East', null],
  ]);
  expect(await page.evaluate(() => window.chartExpansion.stats().count)).toBe(
    1,
  );
});

for (const host of ['openui', 'a2ui', 'cosui', 'marklang'])
  test(`${host}: all four 0.3 charts render in the pinned upstream SDK with host-owned maps`, async ({
    page,
  }) => {
    for (const type of ['radar', 'tree', 'sankey', 'map']) {
      await page.goto(`/${host}.html?m3=${type}`);
      await expect(page.locator(`#${host}-status`)).toContainText('VALID');
      await expect(page.locator(`#${host}-chart svg`)).toHaveCount(1);
      await expect(page.locator('[data-chartnexus-accessible]')).toHaveCount(1);
      await expect(page.locator(`#${host}-chart`)).not.toContainText(
        'Table view',
      );
      await page.click('#invalid');
      await expect(page.locator(`#${host}-status`)).not.toContainText('VALID');
      await expect(page.locator(`#${host}-chart svg`)).toHaveCount(1);
      await page.click(host === 'openui' ? '#unmount' : '#remove');
      await expect(page.locator(`#${host}-chart svg`)).toHaveCount(0);
    }
  });
