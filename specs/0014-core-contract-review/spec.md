---
doc_id: spec-0014-spec
version: "0.1"
status: completed
updated: 2026-10-31
language: en
---
# Core contract and capability review
[简体中文](spec.zh-CN.md)
## Problem and evidence
The implemented 0.1 schema, compiler, native guard and host profiles do not have a single evidence-graded capability review. Earlier design documents include future contract fields. In particular native nested options are not comprehensively validated.
## Goals and non-goals
Inventory current behavior with source and test evidence; evaluate 25–30 representative tasks, identify gaps; propose 0.2 boundaries, migration and a prioritized implementation sequence. This review does not implement 0.2, add chart types or claim real-model benchmark results.
## Method and dependencies
Inspect schema, compiler, runtime, adapters, resources and tests. Use targeted compiler probes to distinguish rejection from acceptance. Record coverage levels: source, compiler probe, existing test, browser or not-run. Existing tests and probes are not equivalent to full semantic or visual verification. Keep all findings bilingual and register in the documentation manifest.
## Acceptance
- Current features, limits, environment and partial native validation are documented with evidence.
- At least 25 distinct tasks have explicit 0.1 outcomes, gaps and desired verification.
- 0.2 draft specifies layers, representative contracts, error handling, theme precedence, version migration, open decisions and acceptance gates without claiming implementation.
- Documentation and generated resource checks pass; do not overwrite existing work.
## Release and rollback
Documentation-only experimental proposal. No schema or runtime changes; rollback by removing review documents and links.

## Evidence
28 task assessments are documented; ten compiler probes passed. `pnpm docs:check`, `pnpm generate:check` and formatting checks are recorded separately. No new model, visual or complete browser evaluation is claimed.
