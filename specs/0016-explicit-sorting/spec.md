---
doc_id: spec-0016-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Explicit category sorting
[简体中文](spec.zh-CN.md)
## Goal and contract
Add opt-in `chart.sort` to experimental 0.2 intent for bar, line and pie: `{ by: "category" | "value", order: "ascending" | "descending", nulls: "first" | "last" }`. Category sorting uses deterministic JavaScript UTF-16 code-unit ordering without locale; value sorting is numeric. Null position is independent of direction; ties retain first appearance. 0.1 and 0.2 without sort preserve current behavior. Reject scatter sort and any value sort with a series grouping field rather than inventing aggregation. Grouped category sorting applies the same permutation to all series, preserving gaps and original row indices. Host references use the same compiled plan and data revision. Source data and registry remain unchanged.
## Acceptance
Test ascending/descending, ties and null, grouped gaps and original row identity, inline and reference inputs, pie and horizontal chart, invalid combinations, deterministic results, schema/agent discovery and actual SVG/browser behavior. Synchronize bilingual docs and manifest. Sorting is not aggregation, temporal interpretation, locale-aware collation or a stable row ID. No 0.1 semantics change.

Evidence: unit tests cover ordering and original indices, SVG rendering and local Chrome click mapping. Full real-model and locale-aware behavior not tested or claimed.
