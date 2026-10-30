---
doc_id: development
version: "0.1"
status: experimental
updated: 2026-10-30
language: en
---

# Development foundation

[Other language](../zh-CN/development.md)

This is a local, unpublished experimental implementation. Protocol adapters, model evaluations, operation deduplication, stable row IDs, and interaction-state preservation are not implemented.

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

All packages are private workspaces. Names do not imply published npm packages or scope ownership. The full ECharts bundle is currently used; modular bundle optimization is deferred.

## Current contract
Schema version 0.1, native `echarts` or semantic `intent` mode. Intent uses inline fields/object rows or a host registry reference with exact revision. x/y/series field mappings are explicit. Bar/line/pie require string categories; scatter requires numerical coordinates. y is numerical or null, except pie requires nonnegative numbers. Grouped bar/line/scatter are supported; pie grouping is not. Duplicate categories within one series fail. Empty rows produce empty series.

Missing fields must be explicit null. No implicit numeric coercion, aggregation, time parsing, network resolution, or arbitrary transforms. References use a trusted synchronous host registry; native mode currently uses only inline option datasets/data. Native option validation is intentionally partial, not an exhaustive ECharts schema.

## Native profile and limits
Top-level native components: title, legend, grid, xAxis, yAxis, series, dataset, tooltip, color, backgroundColor, animation. Series: bar/line/pie/scatter. Callbacks, transforms, graphic, toolbox, rich text, external resources, and link hooks are rejected. Tooltip is forced to ECharts richText rendering and animations are disabled. Resource-like strings are conservatively rejected even inside labels.
Input budget: 1 MiB, depth 32, 100000 inspected nodes; 100 fields, 10000 rows, 50 series, 50000 expanded category/series points; dimensions at most 4096; exported SVG at most 8 MiB. Synchronous compilation/rendering has no hard deadline or process isolation. These are conservative starting limits, not performance guarantees; hosted untrusted rendering is out of scope.

## Runtime behavior
Full replacement uses notMerge, so removed series cannot remain stale. Validation failures leave the prior chart/revision intact. A render failure attempts restoration; unrecoverable failures request remounting. Selection events carry positional row identity, chart revision, and data revision; native selections have no row mapping. Resizing uses ResizeObserver. Disposing removes observer and instance. Zoom/legend preservation is not provided yet.

## Engineering status
`pnpm generate` regenerates types from JSON Schema; `generate:check` detects drift. `docs:check` verifies bilingual manifest entries and local links. `check` combines the implemented local gates; browser tests are separate. CI YAML is local configuration, not evidence of a successful GitHub run or enabled branch protection. Release jobs are not configured.

See [SPEC-0001](../../specs/0001-core-foundation/spec.md) and its [task evidence](../../specs/0001-core-foundation/tasks.md). Historical planning documents remain planning baselines; this page describes the current subset.

## Agent entry points
CLI and local MCP stdio now use a shared Node agent service. See [integration guide](agent-integration.md) for commands, client configuration, resources and explicit limits. Worker tool rendering has deadlines; direct renderSvg remains synchronous.
