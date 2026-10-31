---
doc_id: spec-0007-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: en
---

# Model resources and offline evaluation

[Other language](tasks.zh-CN.md)

- [x] Create 20 tasks and reference fixtures with diagnostic and semantic assertions.
- [x] Implement offline candidate evaluation with negative controls.
- [x] Add bilingual model entry, generated retrieval index and MCP discovery.
- [x] Verify tests, generation drift, bilingual docs and MCP stdio; record outcomes.

## Evidence (2026-10-31)
- AC-01/02: `pnpm check` and `pnpm eval:candidates /tmp/chartnexus-candidates.json`: 20/20 reference fixtures; `tests/evaluation.test.ts` checks equivalent input, wrong value, missing task, unknown ID and wrong diagnostic input. This is not model accuracy.
- AC-03: generation drift checks and `tests/mcp.test.ts` use official SDK over stdio to list/read index, bilingual entry, JSONL and tasks.
- AC-04: `pnpm check` passed: 45 tests, generated resources, bilingual links, lint/types and demo build. Real models, held-out data, visual grading, training and external publication: not-run. Browser checks not rerun for this Node/resource-only change.
