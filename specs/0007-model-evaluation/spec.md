---
doc_id: spec-0007-spec
version: "0.1"
status: done
updated: 2026-10-31
language: en
---

# Model resources and offline evaluation

[Other language](spec.zh-CN.md)

## Problem, scope and design
Existing MCP exposes schema, capabilities and two recipes but has no compact bilingual entry or model task corpus. Deliver a versioned synthetic 20-task offline development corpus, public/private split guidance, a deterministic candidate evaluator, and discoverable model/RAG resources sourced from canonical files. No provider calls, training-data claims, visual appropriateness scoring, publication or remote clients are in scope.

Candidate input is a JSON object keyed by task ID; values are ChartDocument candidates or diagnostic code/path objects. The evaluator uses the existing compiler and task-specific observable constraints on rendered plans or diagnostic codes; it reports validity and task checks separately. Self-check evaluates reference fixtures and negative controls, not model performance. Offline results must not be called live model evaluations. All inputs remain local; no code execution or network, existing compiler limits apply. Missing candidates fail, extra IDs are rejected, registry references use explicit fixture registries only.

## Acceptance
- AC-01: 20 stable, bilingual, synthetic tasks cover four charts, native option, edits, data semantics and diagnostics, each with executable assertions.
- AC-02: reference fixtures pass and a deliberately wrong candidate fails; external candidate JSON can be scored without exact document matching.
- AC-03: bilingual entry and versioned retrieval index link canonical schema/capabilities/recipes, and MCP exposes the index. Drift checks and stdio tests cover it.
- AC-04: `pnpm check` and offline evaluation pass; documentation distinguishes offline fixture checks and unverified live model / training usage.

## Compatibility and release
Additive resources and scripts; existing tool inputs and core unchanged. Rollback removes corpus/index and MCP resource. Family split metadata must not be described as a held-out secret test. Human assessment, live model metrics and provider integrations remain later work. See tasks.
