---
doc_id: contracts-03
version: "0.1"
status: experimental
updated: 2026-10-31
language: en
---
[Other language](../zh-CN/contracts-03.md)

# ChartDocument 0.3 and core boundaries

0.3 is experimental and intent-only. Its canonical schema has eleven type-specific branches. All eleven compiler types are implemented: bar, line, pie, scatter, combo, funnel, heatmap, radar, tree, Sankey and map. Map rendering requires a trusted host asset. See the [four new chart contracts](chart-expansion-03.md). A schema-valid document is not a renderer-support claim.

## Contract and discovery

`chartDocument03Schema` and `projectChartSchema03(type)` come from `@chartnexus/schema`; projections are exact branches from the same union. Ordinary charts/radar/tree use inline or referenced tables. Sankey uses `{kind:"graph",nodes:<table>,links:<table>}`. Maps use a table plus trusted `chart.mapRef:{id,revision}` and explicit color domain. Heatmap requires its heatmap configuration structurally. Unknown fields are rejected, with property paths in diagnostics. Numeric ranges, references, keys and supported combinations still need compilation.

MCP: `get_chart_schema({schemaVersion:"0.3",chartType:"bar"})`. CLI: `pnpm cli schema --schema-version 0.3 --chart-type bar`. The default schema tool remains 0.1. Full schema and implemented capabilities have `/0.3` resources; all eleven types appear in `charts` with type-specific and host-asset constraints. `getChartInputContract({schemaVersion:"0.3",chatPresentation:true})` returns a complete matching example; its default recommendation remains 0.2 for existing hosts.

## Explicit migration and identity

`migrateIntentTo03(document, registry?)` validates and compiles the old intent before checking the converted 0.3 structure. It changes only the version and converts `{theme:{id,version:"1"}}` to `{theme:"light"|"dark"}`. Unsupported or type-irrelevant old fields are rejected, never silently discarded. Native documents stay on 0.1; migration is never automatic.

Optional `data.keyField` names a declared field containing unique nonempty strings up to 256 characters. Source order and numeric values do not change. `RenderPlan.rowKeys` follows the same sorting/selection mapping as rowIndices. 0.3 events declare `eventVersion:"0.3"`; keyed selections have `identity:"key"`, rowKey and current rowIndex. Without keys they remain positional; aggregated selections retain aggregate metadata rather than fabricated row keys. Nonfatal notices are structured code/severity/path/message with optional params. M3 adds node/edge/region identities for tree, Sankey and map; see the expansion guide.

## Internal responsibilities and evaluation foundation

Core now separates version validation, data-table resolution, legacy compilation, explicit transforms, temporal parsing, combo/funnel/heatmap handlers and presentation. The dispatcher exposes versions without importing DOM/network/model SDKs. Existing chart reuse inside the legacy 0.2 implementation is preserved for numeric equivalence; the four M3 types use independent compilers.

M0 source/option/row-index golden fixtures and existing aggregation, temporal, unit and failure tests guard extraction. `scripts/evaluation-harness.mjs` separates model-visible prompts from expected source hashes/rendered values, records initial versus at-most-two-repair outcomes and requires model/settings/compiler provenance. Its synthetic tests are harness tests, not held-out model results. Actual private suites must stay out of resources/retrieval; final A16 remains M4 work.

See [M1 spec](../../specs/0033-contracts-core/spec.md) and [tasks](../../specs/0033-contracts-core/tasks.md).
