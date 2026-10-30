import { compileChart } from '@chartnexus/core';
import { mountChart, type ChartRuntime } from '@chartnexus/runtime';
import './style.css';

const source = document.querySelector<HTMLTextAreaElement>('#source')!;
const chart = document.querySelector<HTMLElement>('#chart')!;
const status = document.querySelector<HTMLElement>('#status')!;
const compiled = document.querySelector<HTMLElement>('#compiled')!;
const revision = document.querySelector<HTMLElement>('#revision')!;
let runtime: ChartRuntime | undefined;
function mount() {
  const result = mountChart(chart, (event) => {
    document.querySelector('#event')!.textContent = JSON.stringify(
      event,
      null,
      2,
    );
  });
  if (result.ok) {
    runtime = result.value;
    revision.textContent = 'revision 0';
  } else status.textContent = JSON.stringify(result.diagnostics, null, 2);
}
function example(kind: string): unknown {
  if (kind === 'native')
    return {
      schemaVersion: '0.1',
      id: 'sales',
      mode: 'echarts',
      option: {
        xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [120, 180, 150] }],
      },
    };
  const grouped = kind === 'group';
  const scatter = kind === 'scatter';
  return {
    schemaVersion: '0.1',
    id: 'sales',
    mode: 'intent',
    data: {
      kind: 'inline',
      fields: ['month', 'revenue', 'region'],
      rows: [
        { month: scatter ? 1 : 'Jan', revenue: 120, region: 'East' },
        { month: scatter ? 2 : 'Feb', revenue: 180, region: 'East' },
        { month: scatter ? 3 : 'Mar', revenue: 150, region: 'East' },
        ...(grouped
          ? [
              { month: 'Jan', revenue: 80, region: 'West' },
              { month: 'Feb', revenue: 95, region: 'West' },
              { month: 'Mar', revenue: 110, region: 'West' },
            ]
          : []),
      ],
    },
    chart: {
      type: grouped ? 'bar' : kind,
      title: 'Monthly sales',
      encoding: {
        x: { field: 'month', type: scatter ? 'quantitative' : 'ordinal' },
        y: { field: 'revenue', type: 'quantitative' },
        ...(grouped ? { series: { field: 'region' } } : {}),
      },
      ...(grouped ? { stack: true } : {}),
    },
  };
}
function render() {
  let input: unknown;
  try {
    input = JSON.parse(source.value);
  } catch {
    status.textContent = 'INVALID_JSON: 请输入完整 JSON / Enter complete JSON.';
    return;
  }
  const result = compileChart(input);
  if (!result.ok) {
    status.textContent = JSON.stringify(result.diagnostics, null, 2);
    return;
  }
  if (!runtime) {
    status.textContent = 'DISPOSED: 请重新挂载 / Mount the chart first.';
    return;
  }
  const rendered = runtime.update(input);
  if (!rendered.ok) {
    status.textContent = JSON.stringify(rendered.diagnostics, null, 2);
    return;
  }
  compiled.textContent = JSON.stringify(result.value.option, null, 2);
  revision.textContent = `revision ${rendered.value.revision}`;
  status.textContent = 'VALID · 已通过校验并渲染 / Validated and rendered';
}
mount();
source.value = JSON.stringify(example('bar'), null, 2);
render();
document.querySelector('#render')!.addEventListener('click', render);
document
  .querySelector<HTMLSelectElement>('#example')!
  .addEventListener('change', (event) => {
    source.value = JSON.stringify(
      example((event.target as HTMLSelectElement).value),
      null,
      2,
    );
    render();
  });
document.querySelector('#dispose')!.addEventListener('click', () => {
  runtime?.dispose();
  runtime = undefined;
  status.textContent = 'DISPOSED';
});
document.querySelector('#mount')!.addEventListener('click', () => {
  mount();
  if (runtime) render();
});
