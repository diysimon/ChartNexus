---
doc_id: genui-integrations
version: "0.2"
status: experimental
updated: 2026-11-01
language: en
---

# GenUI chart integration guide

[简体中文](../zh-CN/genui-integrations.md)

## Tested profiles

| Profile | Tested dependencies | Host | Entry point |
| --- | --- | --- | --- |
| OpenUI Lang | `@openuidev/react-lang` 1.0.2, React 19.2.4, Zod 4.3.6 | React Renderer | `@chartnexus/adapter-openui` |
| COSUI JSON | `@cosui/cosmic-dynamic-ui` 1.0.0, `san` 3.15.5 | `UIJSON.compile` | `@chartnexus/adapter-cosui` |
| COSUI Markdown | `marklang` 1.0.1 | Marklang `renderToElement` | `@chartnexus/adapter-cosui/marklang` |
| A2UI v0.9 | `@a2ui/react` 0.9.1, `@a2ui/web_core` 0.9.2, React 19.2.4, Zod 3.25.76 | official MessageProcessor and React Surface | `@chartnexus/adapter-a2ui` |

The A2UI package versions are SDK versions; the message protocol is v0.9. OpenUI still uses Zod 4.3.6 and remains separately tested. These are experimental local workspace packages, not npm releases. All chart inputs are validated by the existing core with its limits and profile.

## OpenUI Lang

Register `createOpenUIChart(options)` in `createLibrary({ components: [chart], root: 'ChartNexusChart' })`, then pass the library to the upstream React `Renderer`. The component takes a JSON-encoded ChartDocument string. [The complete runnable host](../../examples/playground/openui.ts) shows the required OpenUI program, escaping, diagnostics, selection, streaming and lifecycle. Start it with `pnpm dev`, open `/openui.html`, and use the buttons to switch examples or provoke an error. OpenUI owns program parsing; the host must preserve its last committed response during streaming and remount when the chart ID changes. This is the tested OpenUI Lang profile, not standard A2UI.

## COSUI JSON

Register `createCosuiChart(options)` as `chartnexus-chart` in the host `components` map. Bind its `document` prop to a complete ChartDocument using the Dynamic UI data model. See [runnable host](../../examples/playground/cosui.ts). `onSelect` and `onDiagnostics` are host callbacks; the San component also fires `chart-select` and `chart-diagnostics`. `appendData` sets top-level keys; it is not a document patch. The host must buffer incomplete protocol messages and supply complete document replacements. Registry references require the host's trusted registry; change chart IDs by remounting.

## COSUI Marklang

Create `createMarklangCharts(container, options)`, call `update(source, complete)`, and call `dispose()` on teardown. Use `marklangDataSource(name, document)` to create a data block. Model-facing source is conceptually:

````markdown
::ml-chartnexus{data="sales"}

:::ml-data{name="sales"}
```json
{"schemaVersion":"0.1","id":"sales","mode":"echarts","option":{"series":[]}}
```
:::
````

The JSON above is illustrative; use the canonical schema and [bar recipe](../../resources/recipes/bar.json) to generate a complete supported document. Data names must be unique ASCII names of at most 64 characters, beginning with a letter and followed by letters, numbers, underscore or hyphen. Missing, duplicate or invalid chart data return diagnostics. Up to 16 charts and 1 MiB Markdown are allowed. Passing `complete: false` keeps existing charts untouched; the host owns assembly and deciding completeness. Complete input is validated and all charts are mounted in a measurable staging surface before an atomic swap; any staging failure retains the old charts.

**Trust boundary:** upstream Marklang may render HTML from Markdown. This adapter does not sanitize general Markdown or HTML; use trusted or separately sanitized Markdown and a suitable host security policy. SSR, hydration, arbitrary live streams, and behavior across other Markdown features are not verified.

## A2UI v0.9

`createA2uiChart(options)` returns a custom component implementation; register it in an A2UI v0.9 `Catalog` and process standard `createSurface`, `updateComponents`, `updateDataModel` and `deleteSurface` messages. See [runnable host](../../examples/playground/a2ui.ts). A model can emit a component like this, with the serialized ChartDocument bound at `/document`:

```json
{"id":"root","component":"ChartNexusChart","document":{"path":"/document"}}
```

The data model value is a **JSON string**, not JavaScript. For example, serialize the [bar recipe](../../resources/recipes/bar.json) and set it using `updateDataModel`. Incomplete or invalid JSON produces diagnostics and preserves the previous chart while the component stays mounted. Selection reaches the configured host callback; this is not an A2UI standard action event or transport to an agent. The host buffers and validates incoming protocol frames and handles surface removal. Ordered updates are optional, as described below; the default document mode does not provide revision ordering or deduplication.

## Evidence and limits

Local `pnpm check` and `pnpm test:browser` cover actual Dynamic UI, Marklang, and A2UI React hosts plus OpenUI regression. Examples cover intent/native modes, replacement, invalid input, recovery, selection and disposal; Marklang also tests incomplete input and duplicate/missing references; A2UI tests incomplete JSON. The pinned host tests and clean external package rehearsals are recorded in [support matrix](support-matrix.md); they do not prove real model-generated protocol programs, remote streaming transport, SSR/hydration, publication, mobile devices or other SDK versions. Bundle measurements are in [M4 evidence](trial-distribution.md). The Dynamic UI source repository has Apache-2.0 source headers, but the installed package declares ISC; clarify distribution notices before release.

### Optional ordered A2UI profile

Set `orderedUpdates: true` in `createA2uiChart` and bind `document` to a JSON-encoded ChartNexus operation rather than a ChartDocument. Capture the chart revision before asynchronous work; use `{ "operationId": "unique-id", "baseRevision": 0, "complete": true, "document": ... }` for a complete update, or omit `document` with `complete: false` for pending. `onUpdateReceipt` reports `applied`, `duplicate`, or `pending`; `onDiagnostics` reports conflicts and errors. Track the revision in successful receipts, reset it when remounting, and use a new ID for different work. See [ordered A2UI example](../../examples/playground/a2ui-ordered.ts). This is a ChartNexus host profile, not an A2UI protocol feature. The host must handle transport, message buffering and cancellation before publishing an operation; the component has no transport-level abort. The controller is session-local and has bounded deduplication as described in the [development guide](development.md).

### Buffering decoded chart streams

`createChartStreamBuffer(operationId, baseRevision)` helps the host assemble one decoded JSON ChartDocument. Capture the revision before starting, append decoded text fragments, and call `finish()` only after successful end-of-stream; publish its operation through the ordered A2UI profile. On cancellation or transport error, call `cancel()` and abort or close the transport separately. A failed buffer is terminal: create another for a retry. The buffer enforces a 1 MiB UTF-8 document limit and 16,384 fragments; the operation and registry must also fit the controller's shared 1 MiB inspection budget. Completion only parses JSON: the runtime validates the ChartDocument before rendering. The [example](../../examples/playground/a2ui-ordered.ts) uses a locally generated ReadableStream, not a model or an A2UI streaming transport. For byte streams, the host must use incremental decoding and flush its decoder.

### Ordered OpenUI and COSUI JSON profiles

Set `orderedUpdates: true` when creating either `createOpenUIChart` or `createCosuiChart`. OpenUI's `document` argument is a JSON-encoded operation string; COSUI JSON's `document` prop is the operation object. The host must capture the current chart revision before starting asynchronous work, supply its own unique operation ID, and track revisions through `onUpdateReceipt`. COSUI also emits `chart-receipt`. These are ChartNexus host extensions, not protocol-defined revisions or events. OpenUI continues to defer commits while its renderer reports streaming. Pending, stale and failed operations do not update the chart; successful duplicates return their existing receipt. The host is responsible for buffering, cancellation and choosing when to publish. See the [combined example](../../examples/playground/ordered-protocols.ts). COSUI Marklang does not use this profile.

### Chat presentation in GenUI hosts

`createA2uiChart`, `createOpenUIChart` and `createCosuiChart` accept optional host-owned `chatPresentation` settings. They use the same 0.2/0.3 intent chat profile as the runtime; without this option, existing behavior is unchanged. A2UI, OpenUI and COSUI JSON were tested locally with dark/transparent settings and ordered updates. Marklang accepts chatPresentation with transactional whole-document updates. Theme settings do not automatically track the host; a host must manage settings and trigger an update or remount. See the [chat presentation guide](chat-presentation.md).

## M1/M2 implementation

See [0.3 contracts and migration](contracts-03.md) and [chat host quality/support matrix](chat-host-quality.md) for current version discovery, dimensions, tables, lifecycle, legend retention and real local Ollama streaming evidence. Legacy spec evidence remains historical.

## M3 chart expansion

0.3 now supports radar, tree, Sankey and trusted regional maps in addition to the original seven types. See [contracts, host MapRegistry, resources and preview](chart-expansion-03.md). Browser/SVG/worker and four pinned upstream SDK paths have local evidence; M4 model evaluation and distribution remain separate. Fixed renderer-owned label callbacks preserve text literally; model callbacks remain forbidden.
