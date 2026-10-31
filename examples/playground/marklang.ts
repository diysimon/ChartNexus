import {
  createMarklangCharts,
  marklangDataSource,
} from '@chartnexus/adapter-cosui/marklang';
const intent = {
  schemaVersion: '0.1',
  id: 'sales',
  mode: 'intent',
  data: {
    kind: 'inline',
    fields: ['month', 'revenue'],
    rows: [
      { month: 'Jan', revenue: 120 },
      { month: 'Feb', revenue: 180 },
    ],
  },
  chart: {
    type: 'bar',
    title: 'Sales',
    encoding: {
      x: { field: 'month', type: 'ordinal' },
      y: { field: 'revenue', type: 'quantitative' },
    },
  },
};
const native = {
  schemaVersion: '0.1',
  id: 'sales',
  mode: 'echarts',
  option: {
    xAxis: { type: 'category', data: ['A', 'B'] },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: [3, 7] }],
  },
};
const host = createMarklangCharts(
  document.querySelector<HTMLElement>('#marklang-chart')!,
  {
    onSelect(event) {
      document.querySelector('#marklang-event')!.textContent =
        JSON.stringify(event);
    },
    onDiagnostics(items) {
      document.querySelector('#marklang-status')!.textContent = items.length
        ? JSON.stringify(items)
        : 'VALID';
    },
  },
);
function source(data: unknown) {
  return `::ml-chartnexus{data="chart"}\n\n${marklangDataSource('chart', data)}`;
}
function update(data: unknown) {
  host.update(source(data), true);
}
document
  .querySelector('#intent')!
  .addEventListener('click', () => update(intent));
document
  .querySelector('#native')!
  .addEventListener('click', () => update(native));
document.querySelector('#invalid')!.addEventListener('click', () =>
  update({
    ...intent,
    chart: {
      ...intent.chart,
      encoding: {
        ...intent.chart.encoding,
        y: { field: 'missing', type: 'quantitative' },
      },
    },
  }),
);
document
  .querySelector('#stream')!
  .addEventListener('click', () =>
    host.update('::ml-chartnexus{data="chart"}', false),
  );
document
  .querySelector('#remove')!
  .addEventListener('click', () => host.dispose());
document
  .querySelector('#missing')!
  .addEventListener('click', () =>
    host.update('::ml-chartnexus{data="missing"}', true),
  );
document
  .querySelector('#duplicate')!
  .addEventListener('click', () =>
    host.update(source(intent) + marklangDataSource('chart', native), true),
  );
update(intent);
