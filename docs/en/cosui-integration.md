---
doc_id: cosui-integration
version: "0.1"
status: research
updated: 2026-10-30
language: en
---

# COSUI investigation and integration plan

[简体中文](../zh-CN/cosui-integration.md)

## Scope and evidence
Initial investigation on 2026-10-30. Experimental JSON/San and Marklang chart profiles are now implemented; see [integration guide](genui-integrations.md) and the specs for exact evidence. The design and acceptance discussion below records the original plan. Reviewed upstream commit `06baf4c493cd72f804b5ede4216cd7eab002d81c`; installed npm package versions are Dynamic UI 1.0.0 and marklang 1.0.1; these package versions are not protocol version identifiers.

## Two distinct profiles
- JSON: UI nodes use type, props, children, if, for and events. Data is bound with double-brace expressions. The reference SDK uses San and exposes UIJSON.compile with registered components, events and actions. appendData sets supplied top-level keys; it is not a ChartDocument patch or automatic array concatenation.
- Markdown: Marklang extends GFM with ml-prefixed directives. A directive's data reference resolves an ml-data block by name. Handler registration, renderToElement and dataToSource provide an extension path. Browser rendering, string rendering and hydration must be tested separately.
- COSUI already has an ECharts chart component supporting bar/line/pie/map/radar. Its API documents restrictions on mixed series and append-style option updates. Its chart API lists render-finished, while chart/index.ts emits chart-rendered: determine actual host event behavior through tests.

## Proposed ChartNexus boundary
Create an optional adapter-cosui package with separately importable JSON/San and Marklang integrations; names and exports remain provisional. Preserve native echarts and intent documents. Reuse upstream UI parsers; keep San, expressions, Markdown and actions outside core.

For JSON, register a ChartNexus-owned component type (proposed chartnexus-chart), bind its document prop to a complete ChartDocument, and connect San mount/update/dispose to the existing runtime. Forward validated chart selection and diagnostic events to host listeners. Do not assume arbitrary action names work: the inspected SDK enforces a fixed action allowlist despite broader extension language in the protocol documentation. Host callbacks are the initial integration boundary.

For Markdown, register a proposed ml-chartnexus directive referring to an ml-data block holding a ChartDocument. These are project extensions, not upstream built-ins. Use dataToSource for serialization, validate resolved data, create DOM containers without interpolating model text into HTML, and explicitly clean up chart instances when nodes disappear. Buffer incomplete directives/JSON; only complete validated states may update charts. Define duplicate data names, missing references and stale revisions before implementation.

Prefer the ChartNexus runtime in the new component so validation, diagnostics and lifecycle remain consistent. A bridge to COSUI's existing chart component may be evaluated later as a separate profile; do not inherit map/radar support claims or formatter exceptions into ChartNexus.

## Implementation sequence and acceptance
1. Pin installable SDK/San versions and check package contents, browser exports, bundle cost and licenses. Root/source headers use Apache-2.0 while Dynamic UI package metadata says ISC; resolve the distribution notice requirements before release.
2. Establish a bilingual feature Spec and update the adapter RFC; define input, host callbacks, lifecycle, budgets and failure behavior.
3. Deliver JSON/San first: both input modes render in an actual Dynamic UI host; replacing data removes stale series; an invalid update preserves the last valid chart; selection reaches the host; disposal releases observers and instances.
4. Deliver Marklang second: a directive plus ml-data renders; fragmented input never renders partial charts; missing/duplicate references are diagnosable; replacement/removal releases instances; script-like labels remain text.
5. Add bilingual model recipes, repair examples, retrieval metadata and evaluation cases. Share ChartDocument/schema/capability sources across MCP and adapters; advertise only tested profiles.

Dependency: core/runtime → JSON/San proof → Marklang proof. COSUI implementation follows the first OpenUI slice unless reprioritized; standard A2UI investigation can continue independently. The old two-protocol P3 estimate must be revised for the additional SDK, San host and Markdown lifecycle work.

## Initial investigation record and open questions
At the time of the initial investigation, source review was complete; later host and installation evidence is in the integration guide. Streaming transport, SSR/hydration, live models and performance remain not-run. Required follow-up: pin published artifacts, inspect parser trust boundaries, reconcile action/event documentation differences, and test incremental rendering identity and cleanup. This is a documentation-only change; verify bilingual manifest/links and diff, with no business-logic test requirement.

## Immutable upstream sources
- [JSON protocol](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/json/content/index.md)
- [Dynamic UI integration](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/json/quick-start.md)
- [Dynamic UI implementation](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-dynamic-ui/src/index.ts)
- [Marklang directives](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/markdown/marklang/add-directive.md)
- [Marklang data](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/markdown/marklang/data.md)
- [Marklang API](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/markdown/marklang/api.md)
- [Existing chart API](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-dqa/src/chart/doc/api.md)
- [Existing chart implementation](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-dqa/src/chart/index.ts)
- [Dynamic UI package](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-dynamic-ui/package.json)
- [Marklang package](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/marklang/package.json)
