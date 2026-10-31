import { mountChart } from '@chartnexus/runtime';
import { validateNativeStrict } from '@chartnexus/core';
import recipe from '../../resources/recipes/bar.json';
const container = document.querySelector<HTMLElement>('#chart')!;
const status = document.querySelector<HTMLElement>('#status')!;
const selection = document.querySelector<HTMLElement>('#selection')!;
const mounted = mountChart(container, (event) => {
  selection.textContent = JSON.stringify(event);
});
if (!mounted.ok) throw new Error('Could not mount chart');
const runtime = mounted.value;
const base = { ...recipe, schemaVersion: '0.2' };
function show(chart: object, theme: 'light' | 'dark') {
  const result = runtime.update({
    ...base,
    chart: { ...base.chart, ...chart },
    presentation: { theme: { id: theme, version: '1' } },
  });
  status.textContent = result.ok
    ? `VALID ${result.value.revision}`
    : JSON.stringify(result.diagnostics);
}
document
  .querySelector('#horizontal')!
  .addEventListener('click', () =>
    show({ type: 'bar', orientation: 'horizontal' }, 'light'),
  );
document
  .querySelector('#area')!
  .addEventListener('click', () => show({ type: 'line', area: true }, 'dark'));
document
  .querySelector('#donut')!
  .addEventListener('click', () => show({ type: 'pie', donut: true }, 'light'));
document.querySelector('#sorted')!.addEventListener('click', () =>
  show(
    {
      type: 'bar',
      sort: { by: 'value', order: 'descending', nulls: 'last' },
    },
    'light',
  ),
);
document.querySelector('#unit')!.addEventListener('click', () =>
  show(
    {
      type: 'bar',
      orientation: 'horizontal',
      encoding: {
        ...base.chart.encoding,
        y: {
          ...base.chart.encoding.y,
          unit: { kind: 'currency', code: 'USD' },
        },
      },
    },
    'light',
  ),
);
document.querySelector('#date')!.addEventListener('click', () => {
  const result = runtime.update({
    ...base,
    data: {
      kind: 'inline',
      fields: ['day', 'value'],
      rows: [
        { day: '2024-02-29', value: 25 },
        { day: '2024-03-10', value: 50 },
      ],
    },
    chart: {
      type: 'line',
      encoding: {
        x: { field: 'day', type: 'temporal', temporalKind: 'date' },
        y: {
          field: 'value',
          type: 'quantitative',
          unit: { kind: 'percent', scale: 'percent' },
        },
      },
    },
  });
  status.textContent = result.ok
    ? `VALID ${result.value.revision}`
    : JSON.stringify(result.diagnostics);
});
document.querySelector('#aggregate')!.addEventListener('click', () => {
  selection.textContent = '';
  const result = runtime.update({
    ...base,
    data: {
      kind: 'inline',
      fields: ['month', 'revenue'],
      rows: [
        { month: 'Jan', revenue: 120 },
        { month: 'Jan', revenue: 30 },
        { month: 'Feb', revenue: 180 },
      ],
    },
    chart: { ...base.chart, aggregate: { op: 'sum' } },
  });
  status.textContent = result.ok
    ? `VALID ${result.value.revision}`
    : JSON.stringify(result.diagnostics);
});
function showStrict(invalid: boolean) {
  const input = {
    schemaVersion: '0.1',
    id: base.id,
    mode: 'echarts',
    option: {
      xAxis: { type: 'category', data: ['A', 'B'] },
      yAxis: { type: 'value' },
      series: [
        { type: 'bar', data: [3, 8], ...(invalid ? { typo: true } : {}) },
      ],
    },
  };
  const checked = validateNativeStrict(input);
  if (!checked.ok) {
    status.textContent = JSON.stringify(checked.diagnostics);
    return;
  }
  const result = runtime.update(input);
  status.textContent = result.ok
    ? `VALID ${result.value.revision}`
    : JSON.stringify(result.diagnostics);
}
document
  .querySelector('#strict-native')!
  .addEventListener('click', () => showStrict(false));
document
  .querySelector('#strict-invalid')!
  .addEventListener('click', () => showStrict(true));
document.querySelector('#labels')!.addEventListener('click', () => {
  const result = runtime.update({
    ...base,
    presentation: {
      theme: { id: 'dark', version: '1' },
      dataLabels: { show: true },
      legend: { show: true, position: 'top' },
    },
  });
  status.textContent = result.ok
    ? `VALID ${result.value.revision}`
    : JSON.stringify(result.diagnostics);
});
show({ type: 'bar', orientation: 'horizontal' }, 'light');
