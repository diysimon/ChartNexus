---
doc_id: spec-0020-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Strict native option validation
[简体中文](spec.zh-CN.md)
## Goal and scope
Provide an opt-in experimental strict subset for 0.1 native option, alongside the unchanged guarded-native-partial default. Reject unknown fields recursively and validate a small supported shape and cross-field invariants. Schema validation and compiler safety guards run before success. The strict result does not promise visual quality, complete ECharts semantics, or validate unsupported options; it does not change runtime compile or render behavior.
## Contract
`validateNativeStrict(document)` checks the existing 0.1 native document and safety profile, then the discoverable `native-strict-basic-0.1` option schema and semantic rules. Accept a bounded subset of bar/line category charts, numeric scatter and single pie, with explicit data, restricted title/legend/axes/colors. Reject unsupported component types, unknown nested fields, mixed coordinate systems, mismatched series lengths, duplicate category names and duplicate pie names. No dataset, transforms, formatter, external resources or arbitrary style options. Strict validation is explicit; default API and model calls remain unchanged. `validate_chart` accepts optional `nativeValidation: strict-basic-0.1` only for native documents. Report `native-strict-basic-0.1` on success; strict failure never falls back silently. Expose the versioned option schema and profile through MCP resources and capabilities.
## Acceptance
Tests cover permitted types and options, unknown nested/invalid fields with diagnostics, chart semantic invariants, security guard, invalid inputs, default backwards compatibility, discovery, MCP selection, SVG rendering and browser behavior where applicable. Paired docs, generated resources and checks. Do not claim complete native ECharts support or actual chart semantics beyond this subset.

Evidence: unit, SVG, stdio MCP and local Chrome tests pass. Real-model and complete native ECharts validation are not claimed.
