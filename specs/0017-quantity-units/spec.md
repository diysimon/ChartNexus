---
doc_id: spec-0017-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Explicit quantitative units
[简体中文](spec.zh-CN.md)
## Contract
Experimental 0.2 intent may declare `chart.encoding.y.unit`: `{kind:"currency",code:"USD"}`, `{kind:"percent",scale:"percent"|"ratio"}`, or `{kind:"unit",label:"kg"}`. Currency codes are three uppercase ASCII letters (syntax only, no currency registry validation); labels are 1–32 characters. Units annotate the quantitative axis name on bar, line and scatter. Pie with units is rejected until it has an accessible unit display design. Percent `percent` means values such as 25 denote 25%; `ratio` means 0.25 denotes 25%, but output explicitly says ratio and never converts or formats values as percentages. No conversion, rounding, inference or aggregation occurs. Units follow the value axis on horizontal bars. Unknown fields and invalid units fail schema validation; 0.1 remains unchanged.
## Acceptance
Check both percentage scales, currency and custom units, all permitted chart types, horizontal axes, theme/sort compatibility, source/registry non-mutation and unchanged numeric output, SVG/browser behavior, error cases, MCP discovery, documentation, generated resources and project gates. Real-model and accessibility evaluations are not claimed.

Evidence: unit and SVG tests and local Chrome 0.2 demo pass. No live-model or accessibility validation was performed.
