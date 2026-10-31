---
doc_id: spec-0027-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Categorical heatmap profile
[简体中文](spec.zh-CN.md)
## Contract
Experimental 0.2 `chart.type: "heatmap"` uses ordinal string x and y fields and `chart.heatmap: {field, min, max}` for the numeric color value. Fields are distinct; min/max are explicit finite values with finite difference and min < max. Non-null values must lie in range; null is a missing cell, never zero. Duplicate x/y pairs, including null rows, fail as ambiguous. Categories follow first input appearance; no generated cross-product, sorting, grouping or implicit aggregation. Selection rowIndex points to the original source row for visible cells; null rows have no rendered cell. The color scale is a fixed built-in palette shown via visualMap, not an inferred unit or user-supplied formatter. Legend and data-label overrides are rejected in this first profile; existing named themes apply to axes/background. No 0.1/native mode changes.
## Acceptance
Test values, null, ranges, duplicates, source identity, sparse cells, reference revision, limits, input immutability, SSR/browser and MCP discovery. Document partial profile, paired languages and actual evidence; no broad visual or model accuracy claim.

Evidence: unit, SVG, MCP recipe and local Chrome selection tests pass. No broad visual, accessibility or real-model evaluation is claimed.
