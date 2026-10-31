import { createElement as h, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  A2uiSurface,
  Catalog,
  MessageProcessor,
  createA2uiChart,
  createChartStreamBuffer,
} from '@chartnexus/adapter-a2ui';
import type { UpdateReceipt } from '@chartnexus/runtime';
import type { Diagnostic } from '@chartnexus/schema';

const documentFor = (label: string) => ({
  schemaVersion: '0.1',
  id: 'ordered-demo',
  mode: 'intent',
  data: {
    kind: 'inline',
    fields: ['name', 'value'],
    rows: [{ name: label, value: 3 }],
  },
  chart: {
    type: 'bar',
    encoding: {
      x: { field: 'name', type: 'ordinal' },
      y: { field: 'value', type: 'quantitative' },
    },
  },
});
let receiptHandler: (receipt: UpdateReceipt) => void = () => {};
let diagnosticHandler: (diagnostics: Diagnostic[]) => void = () => {};
const chart = createA2uiChart({
  orderedUpdates: true,
  onUpdateReceipt: (receipt) => receiptHandler(receipt),
  onDiagnostics: (items) => diagnosticHandler(items),
});
const catalog = new Catalog(
  'https://chartnexus.dev/catalogs/a2ui/ordered/0.1',
  [chart],
);
const processor = new MessageProcessor([catalog]);
processor.processMessages([
  {
    version: 'v0.9',
    createSurface: { surfaceId: 'ordered', catalogId: catalog.id },
  },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId: 'ordered',
      components: [
        {
          id: 'root',
          component: 'ChartNexusChart',
          document: { path: '/operation' },
        },
      ],
    },
  },
  {
    version: 'v0.9',
    updateDataModel: {
      surfaceId: 'ordered',
      path: '/operation',
      value: JSON.stringify({
        operationId: 'initial',
        baseRevision: 0,
        complete: true,
        document: documentFor('Initial'),
      }),
    },
  },
]);
function send(operation: unknown, spaced = false) {
  processor.processMessages([
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: 'ordered',
        path: '/operation',
        value: JSON.stringify(operation, null, spaced ? 2 : undefined),
      },
    },
  ]);
}
function App() {
  const [receipt, setReceipt] = useState('Waiting');
  const [diagnostics, setDiagnostics] = useState('');
  const [present, setPresent] = useState(true);
  const [streamStatus, setStreamStatus] = useState('Idle');
  const revision = useRef(0);
  const sequence = useRef(0);
  const active = useRef<{ cancel: () => void; finish: () => void } | null>(
    null,
  );
  useEffect(() => () => active.current?.cancel(), []);
  receiptHandler = (value) => {
    if (value.status === 'applied' || value.status === 'duplicate')
      revision.current = value.revision;
    setReceipt(JSON.stringify(value));
  };
  function startStream(invalid = false) {
    if (active.current) return;
    const created = createChartStreamBuffer(
      `stream-${++sequence.current}`,
      revision.current,
    );
    if (!created.ok) {
      setStreamStatus('Buffer error');
      return;
    }
    const buffer = created.value;
    const text = invalid ? '{broken' : JSON.stringify(documentFor('Streamed'));
    const midpoint = Math.floor(text.length / 2);
    let source!: ReadableStreamDefaultController<string>;
    const stream = new ReadableStream<string>({
      start(controller) {
        source = controller;
        controller.enqueue(text.slice(0, midpoint));
      },
    });
    const reader = stream.getReader();
    let cancelled = false;
    let finished = false;
    const task = {
      cancel() {
        cancelled = true;
        buffer.cancel();
        void reader.cancel();
        active.current = null;
        setStreamStatus('Cancelled');
      },
      finish() {
        if (finished || cancelled) return;
        finished = true;
        source.enqueue(text.slice(midpoint));
        source.close();
      },
    };
    active.current = task;
    setStreamStatus('Receiving');
    void (async () => {
      try {
        while (true) {
          const chunk = await reader.read();
          if (cancelled) return;
          if (chunk.done) break;
          const result = buffer.append(chunk.value);
          if (!result.ok) {
            setStreamStatus(result.diagnostics[0]?.code ?? 'Error');
            await reader.cancel();
            active.current = null;
            return;
          }
        }
        const result = buffer.finish();
        active.current = null;
        if (!result.ok) {
          setStreamStatus(result.diagnostics[0]?.code ?? 'Error');
          return;
        }
        send(result.value);
        setStreamStatus('Complete');
      } catch {
        buffer.cancel();
        active.current = null;
        if (!cancelled) setStreamStatus('Stream error');
      } finally {
        reader.releaseLock();
      }
    })();
  }

  diagnosticHandler = (value) => setDiagnostics(JSON.stringify(value));
  const newer = {
    operationId: 'newer',
    baseRevision: 1,
    complete: true,
    document: documentFor('Newer'),
  };
  const surface = processor.model.surfacesMap.get('ordered');
  return h(
    'main',
    { style: { maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui' } },
    h('h1', null, 'A2UI ordered update profile'),
    h('p', null, 'Operations and revisions are supplied by the host.'),
    h('button', { id: 'newer', onClick: () => send(newer) }, 'Commit newer'),
    ' ',
    h(
      'button',
      { id: 'duplicate', onClick: () => send(newer, true) },
      'Retry same operation',
    ),
    ' ',
    h(
      'button',
      {
        id: 'stale',
        onClick: () =>
          send({
            operationId: 'older',
            baseRevision: 1,
            complete: true,
            document: documentFor('Older'),
          }),
      },
      'Commit stale result',
    ),
    ' ',
    h(
      'button',
      {
        id: 'pending',
        onClick: () =>
          send({ operationId: 'pending', baseRevision: 2, complete: false }),
      },
      'Pending',
    ),
    ' ',
    h(
      'button',
      {
        id: 'invalid',
        onClick: () =>
          send({
            operationId: 'invalid',
            baseRevision: 2,
            complete: true,
            document: null,
          }),
      },
      'Invalid',
    ),
    ' ',
    h(
      'button',
      {
        id: 'recover',
        onClick: () =>
          send({
            operationId: 'invalid',
            baseRevision: 2,
            complete: true,
            document: documentFor('Recovered'),
          }),
      },
      'Retry corrected',
    ),
    ' ',
    h(
      'button',
      {
        id: 'remove',
        onClick: () => {
          active.current?.cancel();
          processor.processMessages([
            { version: 'v0.9', deleteSurface: { surfaceId: 'ordered' } },
          ]);
          setPresent(false);
        },
      },
      'Remove',
    ),
    h(
      'section',
      {
        id: 'ordered-chart',
        style: { minHeight: 320, border: '1px solid #ccd5df' },
      },
      present && surface ? h(A2uiSurface, { surface }) : null,
    ),
    h('h2', null, 'Simulated decoded stream'),
    h(
      'p',
      null,
      'The example feeds a local ReadableStream; it does not call a model.',
    ),
    h(
      'button',
      { id: 'stream-start', onClick: () => startStream() },
      'Start stream',
    ),
    ' ',
    h(
      'button',
      { id: 'stream-bad', onClick: () => startStream(true) },
      'Start malformed stream',
    ),
    ' ',
    h(
      'button',
      { id: 'stream-finish', onClick: () => active.current?.finish() },
      'Finish stream',
    ),
    ' ',
    h(
      'button',
      { id: 'stream-cancel', onClick: () => active.current?.cancel() },
      'Cancel stream',
    ),
    h('pre', { id: 'stream-status' }, streamStatus),
    h('h2', null, 'Receipt'),
    h('pre', { id: 'receipt' }, receipt),
    h('h2', null, 'Diagnostics'),
    h('pre', { id: 'diagnostics' }, diagnostics),
  );
}
createRoot(document.getElementById('app')!).render(h(App));
