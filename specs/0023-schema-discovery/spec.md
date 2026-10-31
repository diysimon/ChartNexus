---
doc_id: spec-0023-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Version-aware schema discovery
[简体中文](spec.zh-CN.md)
## Goal
Make the implemented ChartDocument versions discoverable through the existing Agent/MCP tool and CLI without changing default 0.1 behavior.
## Contract
`get_chart_schema` accepts optional `schemaVersion: "0.1" | "0.2"`; omission returns the existing 0.1 schema. 0.1 `mode` behavior stays unchanged. 0.2 returns the independently generated experimental intent-only schema with or without `mode: intent`; `mode: echarts` returns `UNSUPPORTED_CAPABILITY`, never an empty or misleading schema. Unsupported versions are invalid arguments. CLI `schema --schema-version 0.2` forwards the same contract and accepts optional `--mode`. Returned schemas are cloned, never mutate canonical objects. Existing resources and APIs stay compatible.
## Acceptance
Test defaults, both versions, both modes, invalid versions, CLI usage and errors, genuine MCP stdio tool calls, schema validation and immutable resources; synchronize bilingual documentation and model retrieval. No claim that native 0.2 exists.

Evidence: Agent, CLI process and official MCP stdio tests cover version selection and errors. `pnpm check` validates generated resources and regressions.
