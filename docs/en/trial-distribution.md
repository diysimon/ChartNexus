---
doc_id: trial-distribution
version: "0.6"
status: experimental
updated: 2026-11-01
language: en
---
# M4 trial and distribution

[简体中文](../zh-CN/trial-distribution.md)

See [SPEC-0036](../../specs/0036-trial-distribution/spec.md), [evidence](../../specs/0036-trial-distribution/verification.json) and the [support matrix](support-matrix.md). M4 engineering/evaluation is complete with linked remote CI evidence; model quality remains experimental. All eleven packages remain private and unpublished.

## Evaluation provenance and scope

The first private corpus **failed family separation**: zero-share pie and numeric-scatter families overlapped teaching examples. Its interrupted development results and [rejection](../../specs/0036-trial-distribution/corpus-audit.json) remain preserved; private storage does not establish independence.

The replacement [pre-run audit](../../specs/0036-trial-distribution/holdout-audit-v2.json) qualifies sixty newly authored host-catalog composition tasks against thirty public development tasks and teaching recipes. It covers exact authorized snapshots, draft decoys, withdrawn lexically-newer revisions, atomic graph retargeting, presentation-preserving edits, stale-revision diagnosis and recovery. Counts: 33 chart tasks (eleven types × three), twelve edits, nine invalid documents, six recoveries. This is held out from public teaching/evaluation families, **not** from protocol primitives, compiler tests or general model knowledge. The author and reviewer are the same local agent; no external audit or broad benchmark claim.

Synthetic source tables and expected marks were authored locally. Models receive only catalog metadata, prompts, prior/invalid documents and host map metadata. Registry rows and expected answers never enter requests, teaching/RAG resources, packages or MCP resources. Independent numeric/tree/edge assertions are authored from source tables; compiling reference documents checks consistency but does not generate the expected values. This specifically measures type-directed chart construction and authorized source/revision selection, not factual retrieval or unrestricted chart recommendation.

[Run provenance](../../specs/0036-trial-distribution/evaluation-provenance-v2.json) freezes source and built-JS hashes, lockfile, prompt, corpus, local model digests and Ollama version before requests. Settings: JSON mode, thinking disabled, temperature0.2, seeds42/43/44, context32768, output2048 tokens,90-second request deadline,2MiB response limit. Four local models × sixty tasks × three repeats =720 rounds. At most two repairs use actual parser/compiler/renderer diagnostics. Oracle mismatch alone never grants a repair. This is host-orchestrated Agent-assisted generation, not autonomous MCP selection. No cloud upload or model download.

## Scoring and reporting correction

The frozen strict scorer hashes source objects and compares independent compiled marks and required document fields. During the run it incorrectly rejected valid optional `keyField`: keyed marks use `{id,value}` while unkeyed marks use scalar values. The reporting-only `reference-keyfield-equivalence-v1` correction first validates/compiles the original candidate, then removes optional reference keys only when the remaining source object exactly matches the expected source hash. Original validation and actual SVG render must pass. Wrong sources/revisions, invalid/duplicate keys, changed numeric marks, required identity assertions and render errors remain failures. Inline data are not normalized. Explicit original-document assertions remain authoritative even if the normalized source object matches; a regression test covers exact `/data` assertions. Tightening this guard left all885 existing attempt scores unchanged.

Raw strict scores, responses, SVG hashes and all failures remain immutable. Corrected scores and their deltas are reported separately, with the correction-module hash. No requests, settings, repair opportunities or model prompts changed. This post-hoc representation correction is disclosed rather than presented as a pre-registered metric. It is still not a general proof of every semantic equivalent or a pixel comparison.

Reports separate first-pass JSON/structure/compilation/source/mark fidelity/correctness, after-repair counts, latency, tokens and failure categories. Planned denominators and pending counts are explicit; incomplete results cannot qualify a model. Wilson intervals are descriptive: repeats are correlated, not independent population samples. Proposed95% structural and after-repair targets do not promise production reliability. Below-target models remain experimental; completing evaluation does not make them pass.

```sh
pnpm eval:independent:check
pnpm eval:independent --corpus .local/m4-holdout-v2/corpus.json --models qwen3.5:9b,mistral:latest,qwen3.5:27b,goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest --output outputs/m4-holdout-v2
# After the original process exits, append --resume using the same arguments.
node scripts/report-independent-evaluation.mjs outputs/m4-holdout-v2 outputs/m4-holdout-v2/aggregate.json --semantic
```

Private corpus/raw logs stay ignored in the maintainer checkout. Other users supply independently authored corpora. `freeze.json`, `status.json`, `summary.json` and per-model JSONL support audit/resume. Changed source, corpus, prompt, model, Ollama or settings refuse resume; semantic rescoring also refuses source/corpus drift. Aggregate export excludes prompts, rows, expected values and model text. Exception text is mapped to stable categories because JSON parse errors can embed private response excerpts. Diagnostic code and JSON-pointer matches are reported separately without relaxing exact correctness. Live models are not called on every PR; no scheduled run is configured.

For the completed v2 run, the semantic aggregate was exported before marker registration changed. Its identical reproduction uses the retained, ignored `.local/m4-holdout-v2/frozen-checkout` at91f8f66, with absolute run/output paths; [provenance](../../specs/0036-trial-distribution/evaluation-provenance-v2.json) discloses restoration of the original declaration bytes for one equivalent union-order variation. Running semantic rescoring from the changed final engine correctly refuses source drift. The private corpus and frozen snapshot are not shipped in public clones. Use `node scripts/replay-frozen-renders.mjs outputs/m4-holdout-v2 outputs/m4-holdout-v2/render-replay.json` in the maintainer checkout to verify the final engine instead.

## Interpretation limits

This is a zero-shot schema-plus-diagnostics baseline: no recipe retrieval, RAG examples, few-shot demonstrations or provider-enforced JSON Schema is injected. JSON mode is requested, with the projected schema supplied as text. It measures this particular entry design on host-catalog compositions, not universal model ability, ordinary inline-chart success or every model/host combination.

The nine diagnosis tasks do not explicitly prescribe JSON Pointer notation in their request/system text. Early completed models select the correct error code but use dotted paths; repair feedback supplies the actual pointer, yet can also induce an unwanted repaired chart. Keep all exact-match failures and separately report code/path agreement. Treat this subset as an exploratory contract-following probe, not clean evidence that a model cannot diagnose a revision conflict. Production should return the validator's structured diagnostic directly; it already computes the authoritative path. Do not tune prompts on this set and advertise the next run as an untouched holdout.

## Installed distributions

`pnpm test:packages --browser` builds and packs all eleven packages, then installs tarballs in a fresh OS temporary directory without ancestor workspace/source symlinks. Reviewed lockfile versions are pinned; actual peer versions are exercised. CI resolves registry metadata online because a frozen workspace install may cache package bytes without all optional-platform metadata needed by a fresh consumer. `--offline` remains available for a warmed metadata/content cache. Neither mode certifies all future semver resolutions.

Audits verify archive paths, LICENSE/NOTICE, JS/type exports, static resources, installed CLI, official stdio MCP negotiation/tool/resource/SVG round trip, worker-relative imports, host map assets and actual pinned GenUI adapters. Vite import checks native bundler dependencies before browser tests. TypeScript resolves installed declarations with NodeNext and third-party `skipLibCheck`. Node22.22.3/24.22.1 each passed46 installed-browser tests locally on macOS arm64; current remote status is in structured evidence. Temp consumers and failure logs remain available. No npm publication occurs.

## Modules and performance

The shared bridge registers ten ECharts series modules (combo composes bar+line), SVG renderer, components, label layout and ARIA. Installed testing caught and fixed missing ARIA for zero-share pies. Native mode retains its four-type restriction; arbitrary plugins are not exposed.

[Budgets](../../resources/performance-budgets.json) freeze measured all-export minified ESM raw/gzip bytes plus10% headroom. `includePeers:false` externalizes all third-party dependencies including Ajv; true includes host SDKs/dependencies. Runtime is about35.4kB gzip external and370.8kB bundled. These are SDK measurements, not demo sizes.

```sh
pnpm benchmark
node --expose-gc scripts/benchmark.mjs --compare /absolute/path/to/prior-baseline.json
```

Benchmarks enforce byte budgets and record compile/SVG median/p95 and post-GC heap at100/1000/10000 rows, radar6×8, tree1000 nodes, Sankey200 nodes/1000 links, map1000 regions, native50 series/50000 points. Browser lifecycle testing records ten samples after two warmups and asserts disposed instance/SVG/accessibility DOM cleanup. Heap observations do not prove zero leaks. Timing under simultaneous model load is observational. Optional20% p95 comparison requires an otherwise idle identical machine/runtime; there is no cross-device SLA or hard timing gate on shared CI.

The final [same-machine comparison](../../specs/0036-trial-distribution/performance-comparison.json) also passed after all model calls and package jobs stopped. It compares typical100/1000/10000-row compile/SVG p95 against a second post-model baseline, with no widened20% threshold. Boundary and heap measurements remain observational; the earlier model-loaded baseline is not a controlled timing comparison.

## CI and migration

Required CI aggregates verify, browser and Node22/24 package jobs; failed traces/screenshots and package/performance reports are retained. Actual pushed-revision runs, including failures and fixes, are linked in [M4 tasks](../../specs/0036-trial-distribution/tasks.md). Old-revision success cannot certify later edits. [0.3 migration](contracts-03.md) is explicit via `migrateIntentTo03`; native remains0.1 and type-irrelevant fields fail. M4 does not migrate user data or publish packages.

## Native compatibility closure

Restored MarkLine/MarkPoint/MarkArea registration without changing the guarded native contract or expanding strict-basic validation. [SVG regression](../../tests/native-markers.test.ts) and [browser regression](../../tests/browser/native-markers.spec.ts) reproduce the missing labels before the fix, then verify all three labels and clean replacement/disposal afterwards. Byte budgets remain unchanged and pass.

The model run used the original frozen engine. Only the two recorded engine source/build files changed afterwards; [exact render replay](../../specs/0036-trial-distribution/render-replay.json) re-rendered all 323 originally successful renders, including semantically wrong candidates, with 323 matching SVG hashes. No new model calls, altered scores or dropped failures are hidden in this replay. It is evidence for these observed candidates, not every possible document.

## Model results and qualification

| Model | First-pass structure | First-pass correctness | After-repair correctness | Strict after-repair score |
| --- | --- | --- | --- | --- |
| `qwen3.5:9b` | 127/180 (70.6%) | 51/180 (28.3%) | 60/180 (33.3%) | 6/180 |
| `mistral:latest` | 106/180 (58.9%) | 43/180 (23.9%) | 53/180 (29.4%) | 38/180 |
| `qwen3.5:27b` | 175/180 (97.2%) | 111/180 (61.7%) | 122/180 (67.8%) | 26/180 |
| `goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest` | 0/180 (0.0%) | 0/180 (0.0%) | 0/180 (0.0%) | 0/180 |

All four models remain experimental because after-repair correctness is below the proposed 95% target. Qwen3.5:27b meets the separate first-pass structural target (175/180). The reporting-only optional-key correction retains strict scores. The diagnostic subset's JSON Pointer ambiguity, zero-shot schema-only prompting, same-author review and host-catalog scope limit interpretation; see [guide](../../docs/en/trial-distribution.md). This is neither a beta release nor a universal model ranking. Private corpora and raw responses remain ignored; no npm publication occurred.
