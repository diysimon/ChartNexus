---
doc_id: spec-0036-tasks
version: "0.3"
status: verifying
updated: 2026-10-31
language: en
---
# M4 execution and acceptance

[简体中文](tasks.zh-CN.md)

M4 is verifying until the full frozen evaluation finishes and final changes pass remote CI. [Structured evidence](verification.json) and [support matrix](../../docs/en/support-matrix.md) distinguish package, host, model and CI results.

| AC | Result | Evidence |
| --- | --- | --- |
| AC16 | Harness and scorer checks pass; replacement live run in progress | [Pre-run audit](holdout-audit-v2.json), [frozen provenance](evaluation-provenance-v2.json);60 tasks ×4 models ×3 repeats; private registries and independently authored marks; raw responses/failures retained. |
| AC17 | Pass locally and on Linux CI | Eleven isolated tarballs on Node22.22.3/24.22.1,45 installed-browser tests per runtime; exports/types/CLI/official MCP/workers/maps/host SDKs/resources/licenses. [Performance](performance.json), browser [22](browser-performance-22.22.3.json)/[24](browser-performance-24.22.1.json). |
| AC18 | Pushed implementation passes remote CI; final report revision to be checked | [CI41207042168](https://github.com/diysimon/ChartNexus/actions/runs/41207042168), commit7345f34: verify, browser, both package jobs and required all pass. |

## Implementation and regression findings

The shared ECharts module profile replaces full-bundle imports. Installed browser tests exposed missing ARIA registration on zero-share pies; fixed before acceptance. All packages include generated LICENSE/NOTICE. Consumer overrides pin reviewed lockfile versions; consumers resolve only tarballs and installed dependencies, without workspace links.

[Initial remote CI](https://github.com/diysimon/ChartNexus/actions/runs/41206228999), commit1eb69c6, exposed three checks: a seven-subprocess CLI test exceeded5 seconds, a forced SVG legend click failed, and offline consumers missed Rolldown's Linux binding. Split CLI cases without extending deadlines, use normal Playwright stability/hit checks, retain failed traces/screenshots, and resolve pinned consumer metadata online with an explicit Vite-import preflight. All affected checks passed in the next full remote run. Offline mode remains for warmed metadata/content caches. No assertions were removed or retries added.

## Evaluation qualification

The original [corpus audit](corpus-audit.json) rejected overlapping families; interrupted development [provenance](evaluation-provenance.json)/[snapshot](evaluation-summary.json) remain superseded records, not holdout evidence. The replacement corpus was audited/frozen before model requests. It holds out host-catalog compositions from thirty public tasks and teaching recipes; it does not claim separation from compiler tests, schema primitives or model knowledge. Author/reviewer are the same local agent.

The frozen scorer falsely rejects valid optional reference `keyField` because it changes mark representation. A separate, tested reporting correction preserves strict scores and original renders, validates original keys before normalization and still rejects wrong source/revision, duplicate keys, changed values, required identities and failed rendering. Both score versions and correction provenance are disclosed. No raw record, prompt, repair opportunity or frozen runner source is changed. See the [guide](../../docs/en/trial-distribution.md).

## Acceptance still being executed

Finish all720 rounds, inspect failures, export private-data-free aggregates and record each model's experimental status against the proposed95% targets. Then commit the final evidence/docs, push over SSH and verify that exact revision's required CI. Packages remain private; no npm publication is authorized or performed.
