---
doc_id: testing-evaluation
version: "0.2"
status: implementation-baseline
updated: 2026-11-01
language: en
---

# Testing, evaluation, and acceptance

[简体中文](../zh-CN/testing-evaluation.md)

## Test layers
| Layer | Required behaviors |
| --- | --- |
| Contract | Exclusive modes, unknown fields, version rejection, diagnostic shape |
| Compiler | Mappings, null/time/units, input immutability, determinism |
| State | Stale updates, duplicate operations, series deletion, failure preservation, late results after disposal |
| Browser | Mount, zero size, resize, events, cleanup, chart transitions |
| Adapter | Real host registration, binding, partial streams, errors, event return |
| Distribution | DOM-free Node imports, actual tarball installation, missing-peer diagnostics |
| Model | Initial generation, multi-turn edits, diagnostic repair, data fidelity |

Use visual snapshots for meaningful layout regressions; disable animations and pin fonts, DPR, dimensions, and browser. Similar screenshots do not establish numerical correctness; test values and fields separately. Real host support needs actual execution evidence; mocks establish only local adapter contracts.

## Initial evaluation corpus
Target 100 independent tasks: 30 creation, 25 multi-turn editing, 20 data semantics, 15 repair, and 10 protocol state. This is a construction target, not an existing asset. Start with 20 P0 tasks to validate design.
Multiple charts may solve a task. Do not judge model success against a single byte-identical option. Specify invariants, permitted solutions, numerical results, and interactions. Report human chart-appropriateness review separately from automatic renderability.

## Controls and run records
Compare direct native option, native option with diagnostics, and intent with compiler. Fix tasks/data and comparable context/budgets; count retrieval and tool-call costs.
Record exact provider/model ID, date, parameters, prompt/schema hashes, capability/data versions, seed if supported, attempt counts, termination reasons, tokens/cost/latency. Repeat stochastic runs and report sample sizes and variability; do not present a cherry-picked run as the aggregate result.
Declare repair limits and budgets before execution. Separate format repair from semantic model repair. Split train/dev/test by task family and prevent template/data near-duplicates across splits.

## Metrics
First-pass structural validity, end-to-end task success, bounded-retry repair, field/value fidelity, multi-turn correctness, event correctness, tokens, cost, and latency. Distinguish structural validity, compilation, rendering, and semantic correctness.
Model usability experiments may measure these metrics to improve documentation and integration. Model invocation and factual accuracy belong to the host and are not SDK acceptance or release gates. Never present invented percentages as achieved results; offline trace replay is not live-model evaluation.

## Performance and resources
Use public synthetic data at typical small and near-limit sizes. Measure compilation, initial rendering, updates, and resources after disposal separately. Record hardware, browser, size, chart type, and p50/p95. P0 sets limits and baselines; exceeding a budget must produce diagnostics or explicit degradation, never silent sampling that changes meaning.

## Release acceptance
Every required AC has evidence. No known unresolved data rewriting, arbitrary code execution, or state-corruption defects. Contracts and derived resources agree; supported versions have evidence and unverified capabilities are labeled. Bilingual notes, licenses, and migrations are complete.
Coverage is a supporting signal, not a substitute for critical behaviors. Reproduce defects with regression cases before fixing and verifying them.

## Implemented development fixtures (2026-10-31)
A public synthetic 20-task development corpus and offline candidate checker are available; see [evaluation baseline](evaluation-baseline.md). The 100-task corpus, held-out split, human review and actual model runs remain future work. Fixture self-checks do not establish model performance.
