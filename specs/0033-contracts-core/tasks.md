---
doc_id: spec-0033-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
# M1 execution and evidence

[简体中文](tasks.zh-CN.md)

## Completed work

- A04: canonical 0.3 discriminated union, eleven branch projections, three data families, explicit intent migration, stable row-key/event contracts and versioned CLI/Agent discovery.
- A05: extracted validation, data, transforms, temporal handling, chart handlers and presentation. The seven implemented chart types retain M0 golden semantics; legacy 0.1/0.2 inputs remain readable.
- A16 foundation: evaluation harness separates model-visible prompts from answers/data hashes and records first versus repaired outcomes. No held-out model benchmark is claimed.

## Acceptance evidence

| AC | Result | Evidence |
| --- | --- | --- |
| AC01 | pass | [contracts tests](../../tests/contracts-03.test.ts): eleven branches, positive/negative full/projection validation, required heatmap settings and versioned discovery |
| AC02 | pass | Same tests: explicit migration/option equivalence, key uniqueness/sort mapping and reserved renderer rejection |
| AC03 | pass | [M0 golden fixtures](../../tests/fixtures/m0-semantics.json), contracts tests and existing core/aggregation/time/unit suites; core imports inspected, no DOM/network/model SDK dependencies |
| AC04 | pass | Generation/resource inventory gates, Agent/CLI/MCP tests and [harness isolation/fidelity tests](../../tests/evaluation-harness.test.ts) |

## Verification and limits

[Machine-readable evidence](verification.json) records Node 22.22.3, pnpm 11.25.0 and Chrome 156.0.8078.74. Local full check: 207 tests in 28 files, 20 reference self-checks, generation/docs/format/lint/types/demo build passed. Browser suite: 33 passed, shared with M2. The demo build still warns about the full ECharts bundle size; selective bundling/performance belongs to M4.

0.3 is experimental and intent-only. Radar/tree/Sankey/map structures are reserved, not implemented renderers. Migration rejects incompatible legacy fields instead of deleting them. Exact private held-out suites, cross-provider results, clean all-package Node 22/24 installation, remote CI and publication were not run. Final A16 remains open. No commit or push was performed.
