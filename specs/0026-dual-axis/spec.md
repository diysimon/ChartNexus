---
doc_id: spec-0026-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Explicit dual-axis combo
[简体中文](spec.zh-CN.md)
## Contract
The experimental 0.2 bar-line combo accepts `chart.secondary.axis: "right"` to place the line on a second quantitative axis. Both measures must explicitly declare their units, which may differ; values are never converted. `axis: "shared"` or omission keeps the existing single-axis equality rule. Names and theme styles follow their own axes; series data and source-row identity remain unchanged. A dual-axis design can visually exaggerate relationships; user or model must request it explicitly. Existing combo constraints remain in force.
## Acceptance
Test USD/percent and ratio without conversion, required units, shared compatibility, row identity, sorting, theme, SVG/browser and discovery; maintain 0.1 behavior. This does not prove chart choice is appropriate or visual quality across all data.

Evidence: local unit, SVG and Chrome tests pass. Real-model and comprehensive visual quality verification remain not run.
