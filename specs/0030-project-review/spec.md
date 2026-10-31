---
doc_id: spec-0030-spec
version: "0.1"
status: reviewed
updated: 2026-10-31
language: en
---
# Evidence-based review and implementation design
[简体中文](spec.zh-CN.md)

## Scope
Review baseline 54fbf2a and produce a rigorous assessment, technical RFC and actionable plan for the nine quality areas plus radar/tree/Sankey/map. This is a documentation and diagnostic-probe task, not implementation of those features. No production behavior changes, publication, commits or external messages.

## Goals and method
Inspect actual contracts, source, generators, host lifecycle, tests and distribution. Reproduce important findings, distinguish source inference from demonstrated failures, rerun existing gates, and record limitations. Preserve model independence, controlled native/intent inputs and bilingual resources. Use [tasks](tasks.md) for evidence; SPEC-0029 remains open.

## Acceptance
| ID | Criterion | Evidence | Result |
| --- | --- | --- | --- |
| REVIEW-01 | Current implementation and test baseline inspected | verification.json; review report | pass |
| REVIEW-02 | Important findings have source or reproducible evidence with severity | probes.mjs; baseline-observations.json; F01–F12 | pass |
| REVIEW-03 | Technical choices cover contracts, presentation, state, transport, charts, map trust, Agent and packaging | technical-design RFC D01–D10 | pass |
| REVIEW-04 | Nine areas/four types mapped to dependencies and observable ACs | action plan A01–A18 | pass |
| REVIEW-05 | Paired docs/manifest and local links consistent | pnpm docs:check; pnpm generate:check; git diff --check | pass |

## Deliverables and compatibility
[Review](../../docs/en/project-review-2026-10-31.md), [proposed design](../../docs/en/technical-design-2026-10-31.md), [action plan](../../docs/en/action-plan-2026-10-31.md), bilingual counterparts and evidence. New 0.3 API names and thresholds are proposals, not supported contracts. Existing code remains unchanged. Rollback removes review artifacts without affecting charts.

## Completion boundary
Review artifacts are complete; implementation work is not. No new live-model runs, remote CI result, complete security/accessibility certification or all-package installation is claimed. Only schema package received the clean-install check. Do not close SPEC-0029 based on this review.
