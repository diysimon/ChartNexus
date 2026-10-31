---
doc_id: spec-0036-tasks
version: "0.2"
status: verifying
updated: 2026-10-31
language: en
---
# M4 execution and acceptance

[简体中文](tasks.zh-CN.md)

M4 is **verifying, not done**. The implementation and local distribution gate are complete; full model evaluation and remote CI acceptance remain open. [Structured evidence](verification.json) and [support matrix](../../docs/en/support-matrix.md) are the current authority.

| AC | Result | Evidence |
| --- | --- | --- |
| AC16 | harness pass; full live run in progress | 30 public development / 60 private tasks; frozen four-model × three-repeat run (720 planned task rounds). [Provenance](evaluation-provenance.json), [aggregate snapshot](evaluation-summary.json). Source/data/mark fidelity, bounded real-diagnostic repairs, raw failures, SVG hashes, resume and drift guard. No final success-rate claim. |
| AC17 | pass locally | Eleven identical tarballs installed in independent consumers on Node22.22.3 and24.22.1, each 45 browser tests. Exports/types/resources/licenses, installed CLI/official MCP/worker/map and pinned actual GenUI SDK hosts pass. [SDK/performance](performance.json), browser [22](browser-performance-22.22.3.json)/[24](browser-performance-24.22.1.json). |
| AC18 | implementation pass; remote not-run | Separate verify/browser/Node22+24 jobs and required aggregate, failure artifacts, support/migration docs. No remote execution can attest to uncommitted changes. |

## Changes and investigation

The shared ECharts module profile replaces full-bundle imports. Installed browser tests caught missing ARIA registration on zero-share pies; fixed and the complete installed suite passed. All packages now include generated LICENSE/NOTICE. pnpm11 consumer overrides live in pnpm-workspace.yaml; initial online fresh resolution attempted newer transitive patches, so the final reproducible rehearsal pins reviewed lockfile versions and uses the existing content store. Consumer resolution remains isolated from workspace packages.

The initial model pilot and a runner startup failure remain in ignored outputs; neither is counted as the final baseline. The frozen version uses only parser/compiler/renderer failures for repairs: oracle mismatch alone does not grant retries. A synthetic subprocess test checks actual runner execution, at-most-two repairs, repeat accounting, no duplicate resume records and refusal of corpus drift. Four local models are enrolled; incomplete attempts are not acceptance. Published aggregate snapshots omit private prompts, source data, expected values and model output.

## Remaining acceptance

1. Let the full local run finish (or resume the exact frozen version after interruption), generate the aggregate report, review failures and apply model-specific experimental status. Do not tune against this corpus and call it a new holdout.
2. After an authorized commit/push, require the corresponding remote verify/browser/package jobs and required aggregate to pass. No previous revision substitutes for this evidence.
3. Review any newly discovered P1 before beta consideration. Packages remain private; M4 and umbrella0029 remain open.

Reproduction and private run locations are in the [guide](../../docs/en/trial-distribution.md). Raw logs/temp consumers are retained locally. No commit, push or release was performed.

## Final local checks

`pnpm check` passed 231 tests in31 files, 20 legacy +10 new public reference checks, generation/format/lint/types, 98 bilingual pairs and demo build. Three CLI tests initially exceeded their existing5-second deadlines under simultaneous live-model load; the same thresholds passed after briefly suspending the model client and reducing redundant runner-test corpus traversal. The final runtime test checks3 repeats/9 invalid attempts; an earlier30-repeat-round/90-attempt rehearsal is also retained. No timeout thresholds were widened. Performance timings overlap model load and are observational.

## Corpus audit correction

The [corpus audit](corpus-audit.json) rejects the current set as independent held-out evidence because some semantic families overlap public examples. It remains a useful private development run, with all failures retained. AC16 requires a new family-separated corpus and fresh evaluation, in addition to finishing/reviewing current baseline results. Frozen labels are preserved as provenance, not treated as validation.

## Remote CI investigation

The first SSH push (`1eb69c6`) ran [CI 41206228999](https://github.com/diysimon/ChartNexus/actions/runs/41206228999): 230/231 unit tests and44/45 browser tests passed, while installed consumers lacked Rolldown's Linux native binding. Split the seven-process CLI cases into independently timed cases without extending timeouts. Let legend clicks use Playwright stability/hit-target checks instead of force, and retain failed traces/screenshots. A frozen workspace store does not guarantee complete registry metadata for a fresh offline consumer; remote consumers now resolve reviewed, pinned versions online and explicitly import Vite before browser checks. Local warmed-cache offline rehearsal remains available. Follow-up CI must confirm these changes; no failure is waived.
