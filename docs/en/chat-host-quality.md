---
doc_id: chat-host-quality
version: "0.1"
status: experimental
updated: 2026-10-31
language: en
---
[Other language](../zh-CN/chat-host-quality.md)

# Chat host quality and support matrix

## Presentation and access

Chat is host opt-in for 0.2/0.3 intent. `resolvePresentation(plan,{width,height,target,theme})` is pure; browser runtime supplies current content dimensions and SVG supplies requested dimensions. Without dimensions, compileChatChart retains its declared default styling rather than claiming responsive layout. The bounded layout reserves title, legend, axes and heatmap scale space. Dense labels can be suppressed with a notice even when explicitly requested; full raw values remain accessible. Widths below 240px, narrow dual axes and insufficient plot space use an explicit browser table fallback. SVG returns `EXPORT_LIMIT` when mandatory content cannot fit; increase dimensions rather than silently dropping it.

The shared light/dark token set is checked on declared white/#111827 surfaces. Transparent backgrounds require a matching host surface; arbitrary backgrounds are not certified. Normal text targets 4.5:1 and essential palette/axis colors 3:1. Animations remain disabled. Native HTML buttons/details provide keyboard access; tables paginate source rows in groups of 50 without dropping them, preserve null and units, and rendered marks include aggregation/source mapping. SVG includes a title and escaped JSON metadata containing full source and rendered tables. Hosts can read this metadata; SVG itself is static.

Browser controls are owned siblings of the chart container and are removed on disposal. Host CSS must allow them to remain visible and reachable. Legend selection is retained by semantic keys when chart type/encoding/units are compatible. Removed keys disappear, new keys are visible, incompatible changes emit `STATE_RESET`. Reserved JavaScript legend keys receive invisible rendering aliases while accessible labels and source values stay original. Zoom retention is not a supported profile.

## Lifecycle and transactions

`mountChart` still fails immediately for zero size. `observeChartMount` lets adapters wait, initialize one runtime when measurable and cancel observation on disposal. They retain the latest complete valid pending input; partial/invalid input never becomes a committed revision. Marklang also waits for a measurable container and stages all charts offscreen at the content width. Only a successful complete staging replaces the old nodes. Failure disposes staging alone. Limits are 16 charts, 1 MiB Markdown and a combined 1 MiB parsed input/registry budget, with temporary old/new coexistence bounded by two accepted documents.

Resize uses a snapshot of the last compiled plan and does not advance data/chart revision. Callback exceptions are reported separately; failed rendering attempts restoration. A `RENDER_RECOVERY_FAILED` diagnostic requires remounting. Marklang replaces whole documents, so interaction retention and per-chart revisions do not span those replacements.

## Streaming

`createChartStreamBuffer` now lives in runtime and retains the A2UI compatibility export. It buffers decoded JSON; it does not prove transport completion. `readOllamaStream` incrementally decodes strict UTF-8 NDJSON, enforces a 4 MiB wire budget and 1 MiB document budget, and requires `done:true` with `done_reason:"stop"`. Truncated, missing-terminal, malformed, aborted or extra-after-terminal responses never return a completed operation.

The local Ollama page uses the same-origin proxy with `stream:true`, a 120-second request deadline, cancellation, generation epochs and starting chart revisions. Manual edits invalidate stale generated results. It permits two bounded repairs and records attempts separately. One real synthetic qwen3.5:9b run passed first try, preserved values [3,5], and cancellation passed; see [evidence](../../specs/0034-chat-host-quality/ollama-verification.json). This is a smoke test, not a provider comparison or factual-data retrieval service. SSE is not an Ollama transport supported by this decoder; other transports must supply their own framing before using the neutral buffer.

## Pinned local host matrix

| Host | Representation/completion | Chat/theme/table | Zero size | Ordered operations | Legend retention |
| --- | --- | --- | --- | --- | --- |
| OpenUI react-lang 1.0.2 / React 19.2.4 | JSON string; upstream streaming=false | yes | waits | host opt-in | compatible updates |
| A2UI React 0.9.1 / web_core 0.9.2 | resolved DynamicString; host completed operation | yes | waits | host opt-in | compatible updates |
| COSUI Dynamic UI 1.0.0 / San 3.15.5 | document object; host complete input | yes | waits | host opt-in | compatible updates |
| Marklang 1.0.1 | named data/directive; explicit complete=true | yes | waits for transaction | explicitly rejected | resets on whole-document swap |

Selection, validation errors, valid recovery and disposal use the shared runtime and pinned real SDK fixtures. Marklang parses trusted/sanitized Markdown only; this work does not sanitize arbitrary HTML. No upstream-standard guarantee is inferred from ChartNexus envelopes. Remote hosts, hydration, other SDK versions, mobile certification and broad accessibility certification remain unverified. See [M2 spec](../../specs/0034-chat-host-quality/spec.md).

## M3 chart expansion

0.3 now supports radar, tree, Sankey and trusted regional maps in addition to the original seven types. See [contracts, host MapRegistry, resources and preview](chart-expansion-03.md). Browser/SVG/worker and four pinned upstream SDK paths have local evidence; M4 model evaluation and distribution remain separate. Fixed renderer-owned label callbacks preserve text literally; model callbacks remain forbidden.
