import { newChartFixture, newChartHostOptions } from './expansion-fixtures.js';
import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createLibrary, Renderer } from '@openuidev/react-lang';
import { createOpenUIChart } from '@chartnexus/adapter-openui';
import type { SelectionEvent } from '@chartnexus/runtime';
import type { Diagnostic } from '@chartnexus/schema';

const bar = {
  schemaVersion: '0.1',
  id: 'sales',
  mode: 'intent',
  data: {
    kind: 'inline',
    fields: ['month', 'revenue'],
    rows: [
      { month: 'Jan', revenue: 120 },
      { month: 'Feb', revenue: 180 },
      { month: 'Mar', revenue: 150 },
    ],
  },
  chart: {
    type: 'bar',
    title: 'Monthly sales',
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
    xAxis: { type: 'category', data: ['A', 'B', 'C'] },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: [3, 7, 5] }],
  },
};
const makeResponse = (document: unknown) =>
  `root = ChartNexusChart(${JSON.stringify(JSON.stringify(document))})`;
let selectHandler: (event: SelectionEvent) => void = () => {};
let diagnosticHandler: (diagnostics: Diagnostic[]) => void = () => {};
const library = createLibrary({
  components: [
    createOpenUIChart({
      ...newChartHostOptions,
      onSelect: (event) => selectHandler(event),
      onDiagnostics: (diagnostics) => diagnosticHandler(diagnostics),
    }),
  ],
  root: 'ChartNexusChart',
});
function App() {
  const [response, setResponse] = useState(
    makeResponse(newChartFixture ?? bar),
  );
  const [draft, setDraft] = useState(response);
  const [streaming, setStreaming] = useState(false);
  const [event, setEvent] = useState('Click a chart item');
  const [status, setStatus] = useState('Waiting');
  selectHandler = (value) => setEvent(JSON.stringify(value, null, 2));
  diagnosticHandler = (value) =>
    setStatus(value.length ? JSON.stringify(value, null, 2) : 'VALID');
  function load(document: unknown) {
    const value = makeResponse(document);
    setDraft(value);
    setResponse(value);
    setStreaming(false);
  }
  return h(
    'main',
    {
      style: {
        maxWidth: 1100,
        margin: '40px auto',
        fontFamily: 'system-ui',
        padding: '0 20px',
      },
    },
    h('h1', null, 'ChartNexus × OpenUI Lang'),
    h(
      'p',
      null,
      'OpenUI Renderer · ChartDocument · ECharts · no model key required',
    ),
    h(
      'div',
      { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
      h('button', { id: 'intent', onClick: () => load(bar) }, 'Intent bar'),
      h('button', { id: 'native', onClick: () => load(native) }, 'Native line'),
      h(
        'button',
        {
          id: 'invalid',
          onClick: () =>
            load({
              ...bar,
              chart: {
                ...bar.chart,
                encoding: {
                  ...bar.chart.encoding,
                  y: { field: 'missing', type: 'quantitative' },
                },
              },
            }),
        },
        'Invalid field',
      ),
      h(
        'button',
        {
          id: 'stream',
          onClick: () => {
            setStreaming(true);
          },
        },
        'Begin stream',
      ),
      h(
        'button',
        {
          id: 'commit',
          onClick: () => {
            setResponse(draft);
            setStreaming(false);
          },
        },
        'Commit response',
      ),
      h('button', { id: 'unmount', onClick: () => setResponse('') }, 'Unmount'),
    ),
    h(
      'p',
      null,
      streaming
        ? 'Streaming: last committed response remains visible'
        : 'Committed response',
    ),
    h('textarea', {
      id: 'openui-source',
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      style: { width: '100%', height: 140 },
    }),
    h(
      'section',
      {
        id: 'openui-chart',
        style: { border: '1px solid #ccd5df', padding: 12, minHeight: 340 },
      },
      h(Renderer, { response, library, isStreaming: streaming }),
    ),
    h('h2', null, 'Diagnostics'),
    h('pre', { id: 'openui-status', role: 'status' }, status),
    h('h2', null, 'Selection'),
    h('pre', { id: 'openui-event' }, event),
    h(
      'details',
      null,
      h('summary', null, 'Model prompt'),
      h(
        'pre',
        { id: 'openui-prompt', style: { whiteSpace: 'pre-wrap' } },
        library.prompt({
          additionalRules: [
            'ChartNexusChart document must be a complete JSON-encoded ChartDocument. Use the ChartNexus schema and capability profile; never emit JavaScript functions.',
          ],
        }),
      ),
    ),
  );
}
createRoot(document.getElementById('app')!).render(h(App));
