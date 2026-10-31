---
doc_id: spec-0021-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Intent labels and legend
[简体中文](spec.zh-CN.md)
## Goal and boundaries
Add optional declarative display controls to experimental 0.2 intent without exposing executable formatters or altering data, chart identity, aggregation or 0.1 behavior.
## Contract
`presentation.dataLabels: {show:boolean}` controls ECharts series label visibility. `presentation.legend: {show:boolean, position?:"top"|"bottom"}` controls legend visibility and placement. Both require `show` and reject unknown fields. When omitted, preserve existing defaults exactly. Display uses ECharts default label content (varies by chart type), no percent conversion, formatter or implicit data transformation. Top legend reserves space for title and cartesian grid; no promise of collision-free layout for all data or dimensions. Preset theme foreground is used for explicitly enabled labels. No user colors, label format templates, accessibility guarantee or legend interaction-state preservation.
## Acceptance
Verify all four chart types, true/false and omission, horizontal/area/donut, aggregation/sort/date/unit data integrity and selection metadata, theme combination, invalid input and version isolation, SVG and browser behavior, capability/MCP discovery and bilingual docs. Fixed-size examples do not prove universal visual quality.

Evidence: unit, SVG, MCP discovery and local Chrome tests cover the subset. Visual quality across all datasets and real-model behavior are not established.
