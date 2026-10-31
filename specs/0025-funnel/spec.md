---
doc_id: spec-0025-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Explicit funnel chart
[简体中文](spec.zh-CN.md)
## Contract
Experimental 0.2 `chart.type: "funnel"` uses the categorical x and nonnegative numeric y contract of pie, with ECharts funnel `sort: "none"` to preserve the input order unless the existing explicit category/value sort is selected. No implicit sorting, conversion or aggregation. Support explicit aggregate, selection provenance, sorting, labels, theme and legend like the corresponding pie subset. Reject grouped series, unit, donut, area, horizontal orientation and other incompatible features. Funnel does not infer conversion percentages or enforce a decreasing sequence. No changes to 0.1 or guarded native profile.
## Acceptance
Test preservation/order, zeros/negative/null/duplicates, aggregation, identity, sorting, limits, reference input, SVG/browser, capability/MCP discovery and bilingual resources; label remaining visual/model limitations.

Evidence: local unit, SVG and Chrome tests pass. Real-model and comprehensive visual quality verification remain not run.
