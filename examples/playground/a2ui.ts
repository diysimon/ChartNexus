import { newChartFixture, newChartHostOptions } from './expansion-fixtures.js';
import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  A2uiSurface,
  Catalog,
  MessageProcessor,
  createA2uiChart,
} from '@chartnexus/adapter-a2ui';
import type { SelectionEvent } from '@chartnexus/runtime';
import type { Diagnostic } from '@chartnexus/schema';
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
let selectionHandler: (event: SelectionEvent) => void = () => {};
let diagnosticHandler: (diagnostics: Diagnostic[]) => void = () => {};
const chart = createA2uiChart({
  ...newChartHostOptions,
  onSelect: (event) => selectionHandler(event),
  onDiagnostics: (items) => diagnosticHandler(items),
});
const catalog = new Catalog('https://chartnexus.dev/catalogs/a2ui/0.1', [
  chart,
]);
const processor = new MessageProcessor([catalog]);
processor.processMessages([
  {
    version: 'v0.9',
    createSurface: { surfaceId: 'main', catalogId: catalog.id },
  },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId: 'main',
      components: [
        {
          id: 'root',
          component: 'ChartNexusChart',
          document: { path: '/document' },
        },
      ],
    },
  },
  {
    version: 'v0.9',
    updateDataModel: {
      surfaceId: 'main',
      path: '/document',
      value: JSON.stringify(newChartFixture ?? intent),
    },
  },
]);
function App() {
  const [present, setPresent] = useState(true);
  const [status, setStatus] = useState('Waiting');
  const [event, setEvent] = useState('Click a chart item');
  selectionHandler = (value) => setEvent(JSON.stringify(value));
  diagnosticHandler = (items) =>
    setStatus(items.length ? JSON.stringify(items) : 'VALID');
  function update(value: unknown) {
    processor.processMessages([
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'main',
          path: '/document',
          value: JSON.stringify(value),
        },
      },
    ]);
  }
  const invalidJson = () =>
    processor.processMessages([
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'main',
          path: '/document',
          value: '{partial',
        },
      },
    ]);
  const surface = processor.model.surfacesMap.get('main');
  return h(
    'main',
    { style: { maxWidth: 1000, margin: '40px auto', fontFamily: 'system-ui' } },
    h('h1', null, 'ChartNexus × A2UI v0.9'),
    h('p', null, 'Official MessageProcessor and React Surface, custom catalog'),
    h('button', { id: 'intent', onClick: () => update(intent) }, 'Intent'),
    ' ',
    h('button', { id: 'native', onClick: () => update(native) }, 'Native'),
    ' ',
    h(
      'button',
      {
        id: 'invalid',
        onClick: () =>
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
      },
      'Invalid',
    ),
    ' ',
    h('button', { id: 'partial', onClick: invalidJson }, 'Partial JSON'),
    ' ',
    h(
      'button',
      {
        id: 'remove',
        onClick: () => {
          processor.processMessages([
            { version: 'v0.9', deleteSurface: { surfaceId: 'main' } },
          ]);
          setPresent(false);
        },
      },
      'Remove',
    ),
    h(
      'section',
      {
        id: 'a2ui-chart',
        style: { minHeight: 320, border: '1px solid #ccd5df' },
      },
      present && surface ? h(A2uiSurface, { surface }) : null,
    ),
    h('h2', null, 'Diagnostics'),
    h('pre', { id: 'a2ui-status' }, status),
    h('h2', null, 'Selection'),
    h('pre', { id: 'a2ui-event' }, event),
  );
}
createRoot(document.getElementById('app')!).render(h(App));
