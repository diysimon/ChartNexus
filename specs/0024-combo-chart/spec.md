---
doc_id: spec-0024-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Single-axis bar-line combination
[简体中文](spec.zh-CN.md)
## Contract
Experimental 0.2 intent `chart.type: "combo"` uses the existing ordinal x and quantitative y as the bar series and `chart.secondary: {field, unit?}` as a line series from the same table and category axis. Both fields must be distinct, numeric or null; if units are specified they must be specified for both and be identical. With no units, the caller is responsible for ensuring compatible quantities. No implicit conversion. Support themes, labels, legend and explicit category sorting. Reject series grouping, aggregation, stack, value sorting, temporal x, horizontal orientation and extra variants rather than guessing semantics. Preserve source row positions and input/reference immutability. Render only within existing resource limits.
## Acceptance
Validate schema, correct values/row indexes, nulls, category ordering, same/mismatched units, invalid options, reference revisions, SVG/browser, MCP capability discovery, bilingual docs and existing regressions. This is a single axis; dual-axis and other mixed chart types remain future work.

Evidence: local unit, SVG and Chrome tests pass. Real-model and comprehensive visual quality verification remain not run.

A later [dual-axis extension](../0026-dual-axis/spec.md) adds explicit right-axis support; the original single-axis contract remains available.
