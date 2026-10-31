---
doc_id: spec-0036-spec
version: "0.1"
status: verifying
updated: 2026-10-31
language: en
---
# M4: evaluation, distribution and release evidence

[简体中文](spec.zh-CN.md)

## Problem and baseline
M3 is locally verified (230 tests, 44 browser tests); independent model evaluation, installed tarballs, bundle/performance and remote CI remain unverified. Implement A16–A18 of the [action plan](../../docs/en/action-plan-2026-10-31.md).

## Goals and design
Freeze corpus, prompt, compiler/schema/model digests and settings before evaluation. Separate public development and private held-out families; expose only requests/data, never scorer expectations. Score first pass and at most two diagnostic-guided repairs separately, retain raw failures and exact denominators. Preserve original business data and independently check compiled marks and task semantics. Run local Ollama only; no factual retrieval or cloud upload.

Pack every workspace package and install tarballs in an isolated consumer. Audit exports, declarations, resources, licenses, worker-relative imports, CLI/MCP and actual browser adapters under Node 22/24. Measure SDK raw/gzip separately from demo, compiler and browser lifecycle performance at typical and boundary sizes. Keep package compatibility and schema contracts unchanged unless a verified defect requires a focused fix.

## Acceptance
| ID | Outcome | Evidence |
| --- | --- | --- |
| AC16 | Frozen independent evaluation with provenance, fidelity, first/repair scores and failures; three repeats per tested model; proposed 30 dev / 60 held-out coverage | tool pass; full run in progress |
| AC17 | All 11 tarballs clean-install on Node22/24; exports/types/worker/CLI/MCP/browser/adapters/resources/licenses verified; reproducible bundle/performance baseline | pass locally; see tasks |
| AC18 | Separate required CI gates; linked support/migration docs and demos; generated resources agree; actual remote CI success before acceptance | local implementation; remote not-run |

## Failure, resources and compatibility
Timeouts/invalid output count as failures; no silent skipped tasks or fabricated results. Freeze source hashes including uncommitted implementation. Private raw evaluation data stays ignored. Install scripts never publish and fail on missing licenses, leaked source/private assets or workspace resolution. Benchmark absolute thresholds follow measurements, not guesses; cross-machine ratios are not comparable. Existing 0.1/0.2/native paths remain covered.

## Tasks and dependencies
Evaluation harness/corpus → frozen runs; packaging → Node/browser consumers; measurement → budget; CI/docs → final checks. See [tasks](tasks.md). Paired documents and manifest accompany implementation. No new production dependency is planned.

## Release and rollback
All packages remain private experimental alpha. No commit, push or publication is authorized by this spec. Remote verification requires a subsequent authorized push; local checks cannot close that gate. Rollback removes new developer tooling/CI gates without migrating user data.

## Open questions
Actual model success, Node24 availability and remote CI evidence are measurements/dependencies, not assumptions. Final acceptance records every unresolved item.

## Authorized closure / 2026-10-31

The user explicitly authorized finishing remaining work, committing and pushing over SSH. Replace the rejected corpus with pre-run audited host-catalog composition families: successful reference selection, authorized-vs-draft selection, non-lexical revision selection, atomic catalog/schema edits, revision rebasing and catalog-visible diagnostics. These are held out from the thirty public evaluation tasks and teaching recipes, not from compiler unit tests or general schema knowledge. Freeze private registries and independent expected marks; expose only metadata, never registry rows or expected answers. Run all four available local models three times, retain below-target outcomes as experimental, then commit/push and verify actual remote CI. No npm publication.
