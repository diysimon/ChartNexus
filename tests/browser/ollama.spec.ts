import { expect, test } from '@playwright/test';
import bar from '../../resources/recipes/bar.json' with { type: 'json' };

test('Ollama playground validates and preserves a chart on failure and cancellation', async ({
  page,
}) => {
  await page.route('**/api/local-ollama/models', (route) =>
    route.fulfill({ json: { models: ['qwen3.5:9b'] } }),
  );
  let count = 0;
  await page.route('**/api/local-ollama/generate', async (route) => {
    count++;
    if (count === 1)
      return route.fulfill({ json: { content: JSON.stringify(bar) } });
    if (count === 2)
      return route.fulfill({ json: { content: '{invalid json' } });
    if (count === 3) return route.fulfill({ json: { content: '{}' } });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route
      .fulfill({ json: { content: JSON.stringify(bar) } })
      .catch(() => {});
  });
  await page.goto('/ollama.html');
  await expect(page.locator('#connection')).toContainText('已连接');
  await page.locator('[data-example="bar"]').click();
  await page.click('#generate');
  await expect(page.locator('#status')).toContainText('通过校验');
  await expect(page.locator('#chart-layer svg')).toHaveCount(1);
  const before = await page.locator('#chart-layer svg').innerHTML();
  await page.click('#generate');
  await expect(page.locator('#status')).toContainText('没有返回有效 JSON');
  expect(await page.locator('#chart-layer svg').innerHTML()).toBe(before);
  await page.click('#generate');
  await expect(page.locator('#status')).toContainText('不会自动联网查询');
  expect(await page.locator('#chart-layer svg').innerHTML()).toBe(before);
  await page.click('#generate');
  await page.click('#cancel');
  await expect(page.locator('#status')).toContainText('已取消');
  await page.waitForTimeout(1400);
  expect(await page.locator('#chart-layer svg').innerHTML()).toBe(before);
});

test('reports Ollama as unavailable without claiming a model is ready', async ({
  page,
}) => {
  await page.route('**/api/local-ollama/models', (route) =>
    route.fulfill({ status: 502, json: { error: 'OLLAMA_UNAVAILABLE' } }),
  );
  await page.goto('/ollama.html');
  await expect(page.locator('#connection')).toContainText('未连接');
  await expect(page.locator('#generate')).toBeDisabled();
});

test('accepts native option JSON and rejects unsafe input without losing the chart', async ({
  page,
}) => {
  await page.route('**/api/local-ollama/models', (route) =>
    route.fulfill({ json: { models: ['local'] } }),
  );
  await page.goto('/ollama.html');
  await page.locator('summary').first().click();
  const native = {
    schemaVersion: '0.1',
    id: 'native',
    mode: 'echarts',
    option: {
      xAxis: { type: 'category', data: ['A', 'B'] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [3, 5] }],
    },
  };
  await page.locator('#document').fill(JSON.stringify(native));
  await page.locator('#render-json').click();
  await expect(page.locator('#status')).toContainText('通过校验');
  await expect(page.locator('#chart-layer')).toContainText('A');
  const before = await page.locator('#chart-layer svg').innerHTML();
  native.option.series[0]!.type = 'custom';
  await page.locator('#document').fill(JSON.stringify(native));
  await page.locator('#render-json').click();
  await expect(page.locator('#status')).toContainText('校验失败');
  expect(await page.locator('#chart-layer svg').innerHTML()).toBe(before);
});
