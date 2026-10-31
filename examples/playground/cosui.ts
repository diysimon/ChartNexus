import { newChartFixture, newChartHostOptions } from './expansion-fixtures.js';
import UIJSON from '@cosui/cosmic-dynamic-ui';
import { createCosuiChart } from '@chartnexus/adapter-cosui';

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
const status = document.querySelector<HTMLElement>('#cosui-status')!;
const event = document.querySelector<HTMLElement>('#cosui-event')!;
const Chart = createCosuiChart({
  ...newChartHostOptions,
  onSelect: (selection) => {
    event.textContent = JSON.stringify(selection);
  },
  onDiagnostics: (diagnostics) => {
    status.textContent = diagnostics.length
      ? JSON.stringify(diagnostics)
      : 'VALID';
  },
});
const App = UIJSON.compile({
  ui: { type: 'chartnexus-chart', props: { document: '{{document}}' } },
  components: { 'chartnexus-chart': Chart },
});
const app = new App({ data: { document: newChartFixture ?? intent } });
app.attach(document.querySelector('#cosui-chart')!);
function append(value: unknown) {
  app.appendData({ document: value });
}
document
  .querySelector('#intent')!
  .addEventListener('click', () => append(intent));
document
  .querySelector('#native')!
  .addEventListener('click', () => append(native));
document.querySelector('#invalid')!.addEventListener('click', () =>
  append({
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
  .querySelector('#partial')!
  .addEventListener('click', () =>
    append({ schemaVersion: '0.1', id: 'sales', mode: 'intent' }),
  );
document
  .querySelector('#remove')!
  .addEventListener('click', () => app.dispose());
