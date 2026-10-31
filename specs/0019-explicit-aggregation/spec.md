---
doc_id: spec-0019-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Explicit aggregation for categorical charts
[简体中文](spec.zh-CN.md)
## Contract
Experimental 0.2 intent bar, line and pie charts may declare `chart.aggregate: { op: "sum" | "mean" | "count" }`. Group by the encoded x category and, when present, series field; preserve first-seen group and category order. `count` counts non-null numeric y values; sum/mean ignore null and yield null when all y values are null. An absent category/series combination is a gap, not an aggregate. Never coerce data or aggregate without explicit declaration. Validate the source table and revision first; reject invalid values, unsupported scatter, count with y units, and non-finite arithmetic. Finite IEEE-754 arithmetic does not guarantee exact decimal arithmetic. Pie's existing nonnegative/non-null constraint applies after aggregation.
## Identity and privacy
Retain aggregate provenance aligned to the resulting rendered point: operation, category, series (or null), input row count and non-null input count. An aggregate selection has identity `aggregate` and rowIndex null, never a made-up source row; it does not expose raw row values or source row indexes. It is scoped by chart and data revision. Gaps carry no provenance. Sorting must reorder provenance in lockstep. The previous position selection contract remains unchanged for non-aggregated charts; hosts may opt to disclose more via their own data layer.
## Acceptance
Test nulls, zeros, duplicates, first-seen order, grouped gaps, all operations, overflow, count/units rejection, sorted provenance, temporal dates, reference revisions, immutability, rendering and browser selection. Record explicit limitations; 0.1 remains unchanged. No model accuracy, live remote transport or stable row IDs are claimed.

Evidence: unit and SVG tests cover aggregation and provenance, and a local Chrome test checks aggregate selection. No real-model evaluation was performed.
