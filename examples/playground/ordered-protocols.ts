import { createElement as h, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createLibrary, Renderer } from '@openuidev/react-lang';
import UIJSON from '@cosui/cosmic-dynamic-ui';
import { createOpenUIChart } from '@chartnexus/adapter-openui';
import { createCosuiChart } from '@chartnexus/adapter-cosui';
import type { UpdateReceipt } from '@chartnexus/runtime';
import type { Diagnostic } from '@chartnexus/schema';

const chatMode = new URLSearchParams(location.search).get('chat') === 'dark';
const chatOption = chatMode
  ? {
      chatPresentation: {
        theme: 'dark' as const,
        detailLevel: 'standard' as const,
        background: 'transparent' as const,
      },
    }
  : {};
const documentFor = (name: string) => ({
  schemaVersion: chatMode ? '0.2' : '0.1',
  id: 'ordered',
  mode: 'intent',
  data: {
    kind: 'inline',
    fields: ['name', 'value'],
    rows: [{ name, value: 5 }],
  },
  chart: {
    type: 'bar',
    encoding: {
      x: { field: 'name', type: 'ordinal' },
      y: { field: 'value', type: 'quantitative' },
    },
  },
});
const operation = (
  operationId: string,
  baseRevision: number,
  name: string,
) => ({
  operationId,
  baseRevision,
  complete: true,
  document: documentFor(name),
});
const source = (value: unknown) =>
  `root = ChartNexusChart(${JSON.stringify(JSON.stringify(value))})`;
let openReceipt: (value: UpdateReceipt) => void = () => {};
let openDiagnostic: (value: Diagnostic[]) => void = () => {};
const library = createLibrary({
  components: [
    createOpenUIChart({
      orderedUpdates: true,
      ...chatOption,
      onUpdateReceipt: (value) => openReceipt(value),
      onDiagnostics: (value) => openDiagnostic(value),
    }),
  ],
  root: 'ChartNexusChart',
});
function OpenExample() {
  const [response, setResponse] = useState(
    source(operation('initial', 0, 'Initial')),
  );
  const [streaming, setStreaming] = useState(false);
  const [receipt, setReceipt] = useState('Waiting');
  const [diagnostics, setDiagnostics] = useState('');
  openReceipt = (value) => setReceipt(JSON.stringify(value));
  openDiagnostic = (value) => setDiagnostics(JSON.stringify(value));
  return h(
    'section',
    null,
    h('h2', null, 'OpenUI'),
    h(
      'button',
      {
        id: 'open-new',
        onClick: () => {
          setResponse(source(operation('new', 1, 'Newer')));
          setStreaming(false);
        },
      },
      'Newer',
    ),
    h(
      'button',
      {
        id: 'open-stale',
        onClick: () => setResponse(source(operation('stale', 1, 'Older'))),
      },
      'Stale',
    ),
    h(
      'button',
      {
        id: 'open-pending',
        onClick: () =>
          setResponse(
            source({
              operationId: 'pending',
              baseRevision: 2,
              complete: false,
            }),
          ),
      },
      'Pending',
    ),
    h(
      'button',
      {
        id: 'open-stream',
        onClick: () => {
          setStreaming(true);
          setResponse(source(operation('stream', 2, 'Streamed')));
        },
      },
      'Streaming',
    ),
    h(
      'button',
      { id: 'open-finish', onClick: () => setStreaming(false) },
      'Finish',
    ),
    h(
      'div',
      { id: 'open-chart', style: { minHeight: 320 } },
      h(Renderer, { response, library, isStreaming: streaming }),
    ),
    h('pre', { id: 'open-receipt' }, receipt),
    h('pre', { id: 'open-diagnostics' }, diagnostics),
  );
}
function App() {
  useEffect(() => initCos(), []);
  return h(
    'main',
    { style: { maxWidth: 900, margin: '30px auto', fontFamily: 'system-ui' } },
    h('h1', null, 'Ordered protocol profiles'),
    h(OpenExample),
    h(
      'section',
      null,
      h('h2', null, 'COSUI JSON'),
      h('button', { id: 'cos-new' }, 'Newer'),
      h('button', { id: 'cos-duplicate' }, 'Duplicate'),
      h('button', { id: 'cos-stale' }, 'Stale'),
      h('button', { id: 'cos-pending' }, 'Pending'),
      h('button', { id: 'cos-invalid' }, 'Invalid'),
      h('button', { id: 'cos-recover' }, 'Retry corrected'),
      h('div', { id: 'cos-chart', style: { minHeight: 320 } }),
      h('pre', { id: 'cos-receipt' }),
      h('pre', { id: 'cos-diagnostics' }),
    ),
  );
}
createRoot(document.getElementById('app')!).render(h(App));
function initCos() {
  const receipt = document.querySelector<HTMLElement>('#cos-receipt')!;
  const diagnostics = document.querySelector<HTMLElement>('#cos-diagnostics')!;
  const Chart = createCosuiChart({
    orderedUpdates: true,
    ...chatOption,
    onUpdateReceipt: (value) => {
      receipt.textContent = JSON.stringify(value);
    },
    onDiagnostics: (value) => {
      diagnostics.textContent = JSON.stringify(value);
    },
  });
  const Host = UIJSON.compile({
    ui: { type: 'chartnexus-chart', props: { document: '{{document}}' } },
    components: { 'chartnexus-chart': Chart },
  });
  const app = new Host({
    data: { document: operation('initial', 0, 'Initial') },
  });
  app.attach(document.querySelector('#cos-chart')!);
  const update = (value: unknown) => app.appendData({ document: value });
  const events = new AbortController();
  document
    .querySelector('#cos-new')!
    .addEventListener('click', () => update(operation('new', 1, 'Newer')), {
      signal: events.signal,
    });
  document
    .querySelector('#cos-duplicate')!
    .addEventListener('click', () => update(operation('new', 1, 'Newer')), {
      signal: events.signal,
    });
  document
    .querySelector('#cos-stale')!
    .addEventListener('click', () => update(operation('stale', 1, 'Older')), {
      signal: events.signal,
    });
  document
    .querySelector('#cos-pending')!
    .addEventListener(
      'click',
      () =>
        update({ operationId: 'pending', baseRevision: 2, complete: false }),
      { signal: events.signal },
    );
  document.querySelector('#cos-invalid')!.addEventListener(
    'click',
    () =>
      update({
        operationId: 'repair',
        baseRevision: 2,
        complete: true,
        document: null,
      }),
    { signal: events.signal },
  );
  document
    .querySelector('#cos-recover')!
    .addEventListener(
      'click',
      () => update(operation('repair', 2, 'Recovered')),
      { signal: events.signal },
    );
  return () => {
    events.abort();
    app.dispose();
  };
}
