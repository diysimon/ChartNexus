---
doc_id: genui-integrations
version: "0.1"
status: experimental
updated: 2026-10-30
language: en
---

# GenUI chart integration guide

[简体中文](../zh-CN/genui-integrations.md)

## Tested profiles

| Profile | Tested dependencies | Host | Entry point |
| --- | --- | --- | --- |
| COSUI JSON | `@cosui/cosmic-dynamic-ui` 1.0.0, `san` 3.15.5 | `UIJSON.compile` | `@chartnexus/adapter-cosui` |
| COSUI Markdown | `marklang` 1.0.1 | Marklang `renderToElement` | `@chartnexus/adapter-cosui/marklang` |
| A2UI v0.9 | `@a2ui/react` 0.9.1, `@a2ui/web_core` 0.9.2, React 19.2.4, Zod 3.25.76 | official MessageProcessor and React Surface | `@chartnexus/adapter-a2ui` |

The A2UI package versions are SDK versions; the message protocol is v0.9. OpenUI still uses Zod 4.3.6 and remains separately tested. These are experimental local workspace packages, not npm releases. All chart inputs are validated by the existing core with its limits and profile.

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

The JSON above is illustrative; use the canonical schema and [bar recipe](../../resources/recipes/bar.json) to generate a complete supported document. Data names must be unique ASCII names of at most 64 characters, beginning with a letter and followed by letters, numbers, underscore or hyphen. Missing, duplicate or invalid chart data return diagnostics. Up to 16 charts and 1 MiB Markdown are allowed. Passing `complete: false` keeps existing charts untouched; the host owns assembly and deciding completeness. Valid input is checked before old charts are disposed, but a later mount/render failure can leave the replacement incomplete.

**Trust boundary:** upstream Marklang may render HTML from Markdown. This adapter does not sanitize general Markdown or HTML; use trusted or separately sanitized Markdown and a suitable host security policy. SSR, hydration, arbitrary live streams, and behavior across other Markdown features are not verified.

## A2UI v0.9

`createA2uiChart(options)` returns a custom component implementation; register it in an A2UI v0.9 `Catalog` and process standard `createSurface`, `updateComponents`, `updateDataModel` and `deleteSurface` messages. See [runnable host](../../examples/playground/a2ui.ts). A model can emit a component like this, with the serialized ChartDocument bound at `/document`:

```json
{"id":"root","component":"ChartNexusChart","document":{"path":"/document"}}
```

The data model value is a **JSON string**, not JavaScript. For example, serialize the [bar recipe](../../resources/recipes/bar.json) and set it using `updateDataModel`. Incomplete or invalid JSON produces diagnostics and preserves the previous chart while the component stays mounted. Selection reaches the configured host callback; this is not an A2UI standard action event or transport to an agent. The host buffers and validates incoming protocol frames and handles surface removal. No stable revision ordering or cross-message idempotency is implemented.

## Evidence and limits

Local `pnpm check` and `pnpm test:browser` cover actual Dynamic UI, Marklang, and A2UI React hosts plus OpenUI regression. Examples cover intent/native modes, replacement, invalid input, recovery, selection and disposal; Marklang also tests incomplete input and duplicate/missing references; A2UI tests incomplete JSON. No real model, streaming transport, SSR/hydration, published package, clean external install, mobile device or other protocol/SDK version is verified. The existing 1.26 MB ECharts shared JS chunk dominates the demo build; host-specific chunks are separate. The Dynamic UI source repository has Apache-2.0 source headers, but the installed package declares ISC; clarify distribution notices before release.
