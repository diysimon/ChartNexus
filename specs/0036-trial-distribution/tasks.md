---
doc_id: spec-0036-tasks
version: "0.5"
status: done
updated: 2026-11-01
language: en
---
# M4 execution and acceptance

[简体中文](tasks.zh-CN.md)

M4 engineering and evaluation are complete; all profiles remain experimental and unpublished. Completing the measurement does not qualify a model for automatic production use. See [structured evidence](verification.json).

| AC | Result | Evidence |
| --- | --- | --- |
| AC16 | Complete: 720/720 rounds; four models, three repeats; failures retained | [Aggregate](evaluation-summary-v2.json), [integrity audit](evaluation-integrity-v2.json), [provenance](evaluation-provenance-v2.json), [pre-run scope audit](holdout-audit-v2.json) |
| AC17 | Pass: eleven isolated tarballs, Node22/24 locally and on Linux CI; 46 browser tests per consumer | [Performance](performance.json), browser [22](browser-performance-22.22.3.json)/[24](browser-performance-24.22.1.json), structured package evidence |
| AC18 | Pass: verify/browser/both package jobs/required | [Remote CI](https://github.com/diysimon/ChartNexus/actions/runs/41230226310) at `2261351`; final documentation commit checked separately at delivery |

## Implementation and regression findings

The shared ECharts module profile replaces full-bundle imports. Installed browser tests exposed missing ARIA registration on zero-share pies; fixed before acceptance. All packages include generated LICENSE/NOTICE. Consumer overrides pin reviewed lockfile versions; consumers resolve only tarballs and installed dependencies, without workspace links.

[Initial remote CI](https://github.com/diysimon/ChartNexus/actions/runs/41206228999), commit1eb69c6, exposed three checks: a seven-subprocess CLI test exceeded5 seconds, a forced SVG legend click failed, and offline consumers missed Rolldown's Linux binding. Split CLI cases without extending deadlines, use normal Playwright stability/hit checks, retain failed traces/screenshots, and resolve pinned consumer metadata online with an explicit Vite-import preflight. All affected checks passed in the next full remote run. Offline mode remains for warmed metadata/content caches. No assertions were removed or retries added.

## Evaluation qualification

The original [corpus audit](corpus-audit.json) rejected overlapping families; interrupted development [provenance](evaluation-provenance.json)/[snapshot](evaluation-summary.json) remain superseded records, not holdout evidence. The replacement corpus was audited/frozen before model requests. It holds out host-catalog compositions from thirty public tasks and teaching recipes; it does not claim separation from compiler tests, schema primitives or model knowledge. Author/reviewer are the same local agent.

The frozen scorer falsely rejects valid optional reference `keyField` because it changes mark representation. A separate, tested reporting correction preserves strict scores and original renders, validates original keys before normalization and still rejects wrong source/revision, duplicate keys, changed values, required identities and failed rendering. Both score versions and correction provenance are disclosed. No raw record, prompt, repair opportunity or frozen runner source is changed. See the [guide](../../docs/en/trial-distribution.md).

## Native compatibility closure

Restored MarkLine/MarkPoint/MarkArea registration without changing the guarded native contract or expanding strict-basic validation. [SVG regression](../../tests/native-markers.test.ts) and [browser regression](../../tests/browser/native-markers.spec.ts) reproduce the missing labels before the fix, then verify all three labels and clean replacement/disposal afterwards. Byte budgets remain unchanged and pass.

The model run used the original frozen engine. Only the two recorded engine source/build files changed afterwards; [exact render replay](render-replay.json) re-rendered all 323 originally successful renders, including semantically wrong candidates, with 323 matching SVG hashes. No new model calls, altered scores or dropped failures are hidden in this replay. It is evidence for these observed candidates, not every possible document.

## Model results and qualification

| Model | First-pass structure | First-pass correctness | After-repair correctness | Strict after-repair score |
| --- | --- | --- | --- | --- |
| `qwen3.5:9b` | 127/180 (70.6%) | 51/180 (28.3%) | 60/180 (33.3%) | 6/180 |
| `mistral:latest` | 106/180 (58.9%) | 43/180 (23.9%) | 53/180 (29.4%) | 38/180 |
| `qwen3.5:27b` | 175/180 (97.2%) | 111/180 (61.7%) | 122/180 (67.8%) | 26/180 |
| `goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest` | 0/180 (0.0%) | 0/180 (0.0%) | 0/180 (0.0%) | 0/180 |

All four models remain experimental because after-repair correctness is below the proposed 95% target. Qwen3.5:27b meets the separate first-pass structural target (175/180). The reporting-only optional-key correction retains strict scores. The diagnostic subset's JSON Pointer ambiguity, zero-shot schema-only prompting, same-author review and host-catalog scope limit interpretation; see [guide](../../docs/en/trial-distribution.md). This is neither a beta release nor a universal model ranking. Private corpora and raw responses remain ignored; no npm publication occurred.
