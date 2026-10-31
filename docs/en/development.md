---
doc_id: development
version: "0.3"
status: experimental
updated: 2026-11-01
language: en
---

# Development foundation

[Other language](../zh-CN/development.md)

This is a local, unpublished experimental implementation. OpenUI Lang React, COSUI JSON/San, COSUI Marklang and A2UI v0.9 React chart profiles are experimental. Small local model pilots and bounded session-level operation deduplication exist; 0.3 stable row keys and compatible legend-state retention are implemented. The 720-round local evaluation and isolated Node22/24 package/host rehearsals are complete; measured models remain experimental. Broader hosts/devices remain unverified.

## Run
Use Node 22.22.3 (baseline) or a supported Node 24 runtime and pnpm 11.25.0. From the repository root:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm dev
pnpm demo:svg
pnpm exec playwright install chromium
pnpm test:browser
```

`pnpm dev` builds packages and starts Vite on localhost (default port 5173). Rebuild packages after editing library code. The JSON editor demonstrates six examples, validation errors, compiled options, and click events. SVG output is saved under ignored `outputs/`. No model keys or outbound model calls are required.

## Packages and APIs
- `@chartnexus/schema`: canonical JSON Schema, generated ChartDocument, diagnostic/result/data types.
- `@chartnexus/core`: `validateChart` (JSON/shape validation), `compileChart` (semantic/capability validation plus compilation), `capabilities`, `limits`.
- `@chartnexus/runtime`: `mountChart(container, onSelect?)` returns a Result containing update/resize/dispose/getRevision. One runtime owns one container and chart ID.
- `@chartnexus/render`: `renderSvg(document, { width?, height?, registry? })` returns static SVG or diagnostics.

All packages are private workspaces. Names do not imply published npm packages or scope ownership. The shared ECharts bridge now explicitly registers supported modules and SVG/ARIA components; see [M4 distribution and performance](trial-distribution.md).

## Baseline 0.1 contract
The current intent branches also include 0.2 and 0.3; see [contracts and migration](contracts-03.md). This section describes the retained 0.1 baseline.

Schema version 0.1, native `echarts` or semantic `intent` mode. Intent uses inline fields/object rows or a host registry reference with exact revision. x/y/series field mappings are explicit. Bar/line/pie require string categories; scatter requires numerical coordinates. y is numerical or null, except pie requires nonnegative numbers. Grouped bar/line/scatter are supported; pie grouping is not. Duplicate categories within one series fail. Empty rows produce empty series.

Missing fields must be explicit null. No implicit numeric coercion, aggregation, time parsing, network resolution, or arbitrary transforms. References use a trusted synchronous host registry; native mode currently uses only inline option datasets/data. Native option validation is intentionally partial, not an exhaustive ECharts schema.

## Native profile and limits
Top-level native components: title, legend, grid, xAxis, yAxis, series, dataset, tooltip, color, backgroundColor, animation. Series: bar/line/pie/scatter. Callbacks, transforms, graphic, toolbox, rich text, external resources, and link hooks are rejected. Tooltip is forced to ECharts richText rendering and animations are disabled. Resource-like strings are conservatively rejected even inside labels.
Input budget: 1 MiB, depth 32, 100000 inspected nodes; 100 fields, 10000 rows, 50 series, 50000 expanded category/series points; dimensions at most 4096; exported SVG at most 8 MiB. Synchronous compilation/rendering has no hard deadline or process isolation. These are conservative starting limits, not performance guarantees; hosted untrusted rendering is out of scope.

## Runtime behavior
Full replacement uses notMerge, so removed series cannot remain stale. Validation failures leave the prior chart/revision intact. A render failure attempts restoration; unrecoverable failures request remounting. Selection events carry chart/data revision and positional or aggregate identity; 0.3 can supply stable row keys. Native selections have no row mapping. Resizing uses ResizeObserver. Disposing removes observer and instance. Compatible chat/0.3 legend selection is retained; zoom retention is unsupported.

## Engineering status
`pnpm generate` regenerates types from JSON Schema; `generate:check` detects drift. `docs:check` verifies bilingual manifest entries and local links. `check` combines the implemented local gates; browser tests are separate. The verify, browser and Node22/24 package jobs have passed remote GitHub Actions; exact revisions are linked in [M4 evidence](../../specs/0036-trial-distribution/verification.json). This does not establish enabled branch protection. Release jobs are not configured.

See [SPEC-0001](../../specs/0001-core-foundation/spec.md) and its [task evidence](../../specs/0001-core-foundation/tasks.md). Historical planning documents remain planning baselines; this page describes the current subset.

## Agent entry points
CLI and local MCP stdio now use a shared Node agent service. See [integration guide](agent-integration.md) for commands, client configuration, resources and explicit limits. Worker tool rendering has deadlines; direct renderSvg remains synchronous.

## OpenUI Lang integration

Run `pnpm dev` and open `http://127.0.0.1:5173/openui.html`. The demo uses the actual OpenUI React Renderer and a local response; it does not call a model. `@chartnexus/adapter-openui` exports `createOpenUIChart({ registry?, onSelect?, onDiagnostics? })` for registration in an OpenUI library. The `ChartNexusChart(document)` prop is a JSON string containing a complete ChartDocument. Consult the canonical schema in `packages/schema/src/chart-document.schema.json` and `resources/recipes/` when generating prompts; `library.prompt()` describes the wrapper but does not embed the complete chart schema.

The adapter defers updates while OpenUI reports streaming and retains the previous valid chart on document errors. The host must preserve the last committed response while assembling streaming fragments: a malformed OpenUI program may remove the component before the adapter can retain it. Native and intent modes follow the existing core limits, including 1 MiB. Use a stable chart ID; for another ID remount the component. Supply registry references through a trusted host registry. Legacy chart selections use positional or aggregate identity; 0.3 can supply stable row keys. `onDiagnostics` receives errors and an empty list on recovery. No arbitrary executable callbacks are accepted from the model.

Verified against OpenUI React Lang 1.0.2, React 19.2.4 and Zod 4.3.6. This is an experimental OpenUI Lang component profile, not standard A2UI, COSUI, or all OpenUI hosts. Clean tarball installation and the pinned browser host have passed on Node22/24. Real model-generated OpenUI programs, SSR/hydration, broader SDK versions and npm publication remain unverified. See [SPEC-0003](../../specs/0003-openui-adapter/spec.md).

## Additional GenUI hosts

Run `pnpm dev` and open `/cosui.html`, `/marklang.html`, or `/a2ui.html`. Each demo uses its actual upstream SDK with locally generated example data; none invokes a model. See [GenUI integration guide](genui-integrations.md) for versions, model recipes, lifecycle and limitations.

## Offline model evaluation
Run `pnpm eval:self` for fixture checks, or `pnpm eval:candidates /path/to/candidates.json` to evaluate local candidate documents. See [evaluation baseline](evaluation-baseline.md) and [model entry](model-entry.md). This does not call a model.

## Local model and MCP pilot
See [local model pilot](local-model-pilot.md) for the bounded localhost-only Ollama runner, observed evidence and limitations. This is separate from offline fixture checks.

## Local Ollama playground
Run `pnpm dev:ollama` and visit `http://127.0.0.1:5180/ollama.html`; see [usage and limits](ollama-playground.md).

### Ordered runtime updates

`createUpdateController(runtime)` is an optional session-local wrapper. Capture `runtime.getRevision()` before starting asynchronous work, then call `commit({ operationId, baseRevision, complete: true, document }, registry?, signal?)`. Partial operations use `complete: false` without `document` and return `pending`. Successful retries with the same ID and canonical payload (including registry) return `duplicate`; changed payloads conflict. A stale base revision or pre-aborted signal never invokes the runtime. Failed updates may be retried. Deduplication retains at most 128 signatures, 4 MiB and 10 minutes; revision checks still apply after eviction. Dispose the controller and runtime separately. The controller does not interrupt synchronous rendering, preserve zoom/legend state, implement stream transport, or automatically protect protocol adapters; hosts must opt in and supply revisions.

### Experimental 0.2 intent subset

The separate 0.2 schema supports 0.1 intent data semantics plus `chart.orientation: "horizontal"` for bars, `chart.area: true` for lines, `chart.donut: true` for pies, and `presentation.theme` with `{ "id": "light" | "dark", "version": "1" }`. Themes are compiled into JSON options and do not load external assets. No accessibility claim is made. `migrateIntent01To02` explicitly converts schema-valid 0.1 intent documents without mutation; native migration is rejected. `validateChart` checks structure, while `compileChart` also checks supported combinations and data semantics. Existing 0.1 input behavior is unchanged. 0.2 native mode and arbitrary theme overrides are not implemented. The `get_chart_schema` tool defaults to 0.1; pass `schemaVersion: "0.2"` or retrieve `chartnexus://schema/chart-document/0.2` for 0.2. See [preview](../../examples/playground/core-02.html).

### Explicit sorting in 0.2

Set `chart.sort` to `{ "by": "category" | "value", "order": "ascending" | "descending", "nulls": "first" | "last" }` for a bar, line or pie chart. Sorting is opt-in and stable; category comparison follows UTF-16 code-unit order, independent of locale. Null placement is independent of sort direction. Category sorting aligns all grouped series; value sorting with a grouping field and all scatter sorting are rejected rather than implicitly aggregating. Selection `rowIndex` still refers to the original source row within its data revision, not the sorted position. This does not introduce persistent row IDs or locale-aware collation.

### Units and calendar dates in 0.2

Bar, line and scatter may set `chart.encoding.y.unit` to `{ "kind": "currency", "code": "USD" }`, `{ "kind": "unit", "label": "kg" }`, or `{ "kind": "percent", "scale": "percent" | "ratio" }`. Codes are checked only for three uppercase ASCII letters, not against a currency registry. A `percent` value of 25 denotes 25%; a `ratio` value of 0.25 denotes 25%. The compiler adds an axis label and never converts values or formats ratios as percentages. Pie units are rejected.

For line charts only, x may be `{ "field": "day", "type": "temporal", "temporalKind": "date" }` with valid Gregorian `YYYY-MM-DD` dates in years 1000–9999. Render coordinates use UTC midnight and ECharts `useUTC`, preserving calendar dates without guessing a local timezone. No automatic sort is applied to series; explicit sorting is available. Offset-bearing instants are supported as described below; local times, other calendars and named timezones are not supported. See [date spec](../../specs/0018-temporal-date/spec.md) and [unit spec](../../specs/0017-quantity-units/spec.md).

### Explicit aggregation in 0.2

Bar, line and pie may declare `chart.aggregate: { "op": "sum" | "mean" | "count" }`; the compiler groups by the encoded x category and optional series. `count` counts non-null numeric y values; sum/mean ignore null and return null for an all-null group. An absent group/category combination remains a gap. Order is first appearance unless an explicit supported sort is requested. Finite IEEE-754 arithmetic does not guarantee exact decimal arithmetic. Overflow fails. Count with a y unit, scatter aggregation, and grouped value sorting are rejected; pie retains its nonnegative and non-null constraints after aggregation.

The render plan includes `aggregatePoints` aligned with series data, including operation, category, series, sourceCount and nonNullCount. The selection event reports `identity: "aggregate"`, `rowIndex: null`, and this metadata; no raw rows or source indices are exposed. Gaps have no aggregate identity. Non-aggregated selections remain positional. Aggregate metadata is scoped to the data revision and is not a stable row ID. See [spec](../../specs/0019-explicit-aggregation/spec.md).

### Opt-in strict native validation

`validateNativeStrict(document)` checks an experimental bounded subset of 0.1 `mode: echarts` documents: explicit bar/line category data, numeric scatter or a single pie. Unknown nested fields, duplicate category/pie names, mismatched lengths and incompatible axes are rejected. It first applies the existing native safety guard, then validates [the option schema](../../packages/schema/src/native-strict-basic-0.1.schema.json) and specific cross-field rules. The allowed components and options are intentionally small; dataset, arbitrary styling and other ECharts features may be valid ECharts but are outside this subset. Passing does not establish full ECharts semantics, data truth or visual quality.

In MCP call `validate_chart` with `nativeValidation: "strict-basic-0.1"`; success reports `native-strict-basic-0.1`, with no silent fallback. The default remains `guarded-native-partial`. Read `chartnexus://schema/native-strict-basic/0.1` and `chartnexus://capabilities/native-strict-basic-0.1` for discovery. Compilation and rendering still use the default guard: hosts requiring strictness must explicitly validate the exact document before committing it. This check does not change 0.1 native rendering behavior.

### Data labels and legend in 0.2

Set `presentation.dataLabels: { "show": true | false }` and optionally `presentation.legend: { "show": true | false, "position": "top" | "bottom" }`. Both objects require `show`; omit them to preserve existing defaults. Labels use ECharts default content for the chart type, without a formatter or percentage conversion. A top legend reserves space in cartesian charts; exact layout depends on data, chart size and font. When a light or dark theme is selected, explicitly enabled labels use its foreground color. This does not promise universal legibility, accessibility, custom formatting, or legend state preservation.

### Explicit instants in 0.2

Line x may use `type: "temporal", temporalKind: "instant"`, with values like `2024-03-01T08:00:00+08:00` or `2024-03-01T00:00:00Z`. A full time and explicit offset are required; offsets are limited to ±14:00 and fractions to 1–3 digits. `-00:00`, leap seconds, invalid dates, local datetimes and numeric timestamps are rejected. The chart uses UTC coordinates and UTC display, without guessing local timezone. Explicit category sorting compares instants, not their strings; without sorting, input order remains. Different strings denoting the same instant within one chart are rejected, including across groups, to prevent silent merging. Original input and source row mapping are retained; named display timezones are not supported. See [spec](../../specs/0022-explicit-instants/spec.md).

### Version-aware schema discovery

MCP `get_chart_schema` accepts optional `schemaVersion: "0.1" | "0.2" | "0.3"` and `mode`; 0.3 also accepts `chartType` for a projected branch. Defaults remain 0.1; 0.2/0.3 accept only intent, and requesting either with `mode: "echarts"` fails with `UNSUPPORTED_CAPABILITY`. In CLI use `pnpm cli schema --schema-version 0.3 --chart-type bar`. Available branches and rendering limits are listed in the support matrix.

### Combo and funnel charts in 0.2

`chart.type: "combo"` creates a bar for `encoding.y` and a line for `chart.secondary.field` from the same categorical x and source rows. With a shared axis (default or `secondary.axis: "shared"`), declare the same unit for both measures or omit both; hosts must ensure omitted units are compatible. An explicitly requested `secondary.axis: "right"` requires units for both measures, permits different units and does not convert values. Interpret dual axes carefully; different scales can exaggerate relationships. Grouped series, aggregation, value sorting, temporal x and horizontal/area variants are not supported. See the [combo recipe](../../resources/recipes/combo.json).

`chart.type: "funnel"` takes categorical x and nonnegative numeric y; it keeps input order unless an explicit supported sort is requested. No conversion rates or implicit ordering are inferred. Grouping, unit and donut/area/horizontal variants are not supported. See the [funnel recipe](../../resources/recipes/funnel.json). Both profiles are experimental; successful rendering does not prove chart selection or visual quality.

### Categorical heatmaps in 0.2

Use `chart.type: "heatmap"` with ordinal string x/y fields and `chart.heatmap: { "field": "orders", "min": 0, "max": 10 }` for a distinct numeric field. The range must be explicit and non-degenerate; non-null values outside it are rejected. A null value produces no drawable cell, while zero remains zero. Duplicate x/y pairs are rejected even if a row is null; sparse cells are not invented. Categories follow first appearance; selected visible cells report the original source row index. This first profile does not support sorting, grouping, aggregation, unit, or label/legend overrides, and uses a fixed color scale. See [recipe](../../resources/recipes/heatmap.json) and [spec](../../specs/0027-heatmap/spec.md).

## M0 semantic corrections

Intent pie/donut distinguishes positive, empty and all-zero data. Zero totals draw no sectors, show “No shares: all values are zero.” even at minimal detail, and expose an informational notice. Empty data draws no placeholder circle. Browser ARIA host attributes are restored when leaving no-share or disposing. Native charts retain their previous behavior; funnels do not inherit share semantics.

Grouped series IDs now encode group field, raw group value and measure field. Empty names use the first unused `(empty)` / `(empty) [n]`; nonempty values are preserved. `seriesMetadata` retains raw values; existing grouped IDs change and should not be persisted across this compiler change. Event row identities remain positional/aggregate.

Recipe copies, discovery and retrieval are generated from [manifest](../../resources/recipes/manifest.json). `docs:check` validates frontmatter status against the manifest and paired update dates. See [semantic spec](../../specs/0031-intent-semantics/spec.md) and [entry spec](../../specs/0032-model-entry-consistency/spec.md).

## M1/M2 implementation

See [0.3 contracts and migration](contracts-03.md) and [chat host quality/support matrix](chat-host-quality.md) for current version discovery, dimensions, tables, lifecycle, legend retention and real local Ollama streaming evidence. Legacy spec evidence remains historical.

## M3 chart expansion

0.3 now supports radar, tree, Sankey and trusted regional maps in addition to the original seven types. See [contracts, host MapRegistry, resources and preview](chart-expansion-03.md). Browser/SVG/worker and four pinned upstream SDK paths have local evidence; M4 evaluation/distribution evidence is recorded separately in the trial guide. Fixed renderer-owned label callbacks preserve text literally; model callbacks remain forbidden.

## M4 verification commands

`pnpm test:packages --browser` verifies all eleven tarballs in an isolated consumer. `pnpm benchmark` enforces bundle budgets and records performance; `pnpm eval:independent:check` checks the independent scorer. Full live evaluation is opt-in, local-only and may take hours; see [trial/distribution](trial-distribution.md) and the [support matrix](support-matrix.md). Node 22.22.3 and 24.22.1 installations pass locally and in Linux CI. Use `--offline` only with a warmed metadata/content cache; final evaluation and exact-revision CI status are in M4 evidence.
