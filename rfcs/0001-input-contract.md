---
doc_id: rfc-0001-input-contract
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: en
---

# Input and data contract

[Other language](0001-input-contract.zh-CN.md)

Decision status: experimental implementation, not a stable published API. The user authorized development on 2026-10-30. SPEC-0001 is the bounded implementation scope.

## Problem and proposal
Models already know ECharts option, while simple intents reduce field-mapping errors. Support mutually exclusive native/intent documents under schemaVersion 0.1. Keep JSON Schema canonical and generate TS. Use scalar object rows and explicit x/y/series encodings; hosts resolve references by id and exact revision.

## Alternatives and limits
A mandatory new DSL would restrict ECharts expression; unrestricted option would defeat capability controls. The chosen native profile is limited and diagnosed. Time parsing, aggregation, native external data binding, and extension registries are deferred. Missing categorical x values are invalid; nullable y values preserve gaps. No data mutation or numeric coercion.

## Compatibility and validation
No old published version exists. Future breaking changes need a schema version. Test dual-mode exclusion, forbidden values, reference revisions, duplicate categories, grouping alignment, empty data, and numerical fidelity. Source and generated types must match.
