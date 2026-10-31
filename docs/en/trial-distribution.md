---
doc_id: trial-distribution
version: "0.1"
status: experimental
updated: 2026-10-31
language: en
---
# M4 trial and distribution

[简体中文](../zh-CN/trial-distribution.md)

M4 implementation is available; **acceptance remains open** until the full frozen model run and remote CI are complete. See [SPEC-0036](../../specs/0036-trial-distribution/spec.md), [evidence](../../specs/0036-trial-distribution/verification.json) and the [support matrix](support-matrix.md). Packages remain private and unpublished.

## Independent evaluation

**Corpus audit: not accepted as independent held-out evidence.** [Audit](../../specs/0036-trial-distribution/corpus-audit.json) found shared semantic families (all-zero pie and numeric-only scatter variants). The running 60-task set is a **private development baseline** despite its historical `split: heldout` labels. A new family-separated corpus and fresh run are required for AC16. Privacy/exclusion from resources does not establish independence.


The public development corpus contains 20 legacy tasks plus [10 new 0.3 tasks](../../resources/evaluation/development-03.json). The locally authored private corpus has 60 tasks: 33 chart tasks (11 × 3), 12 edits, nine invalid inputs and six recoveries. It is excluded from Git, packages, retrieval, training examples and MCP resources. Data are synthetic, Apache-2.0; no production or retrieved facts. Semantic families include combinations of identity, ordering, missing values, signed ranges and topology; sharing a protocol/schema is allowed. This is project-authored evaluation, not an externally audited benchmark.

The runner whitelists only requests, exact source data, prior/invalid documents and host map metadata. Expected values and assertions never enter messages. Type-directed tasks receive projected schemas; this measures instructed chart construction, not unrestricted chart recommendation. Explicitly requested types are scored as requested; the scorer can accept multiple allowed types for future choice tasks. Whole data-object hashes preserve field/row order and values, canonicalizing object-key order. Independent assertions inspect compiled values/structure and requested document options. They are not pixel comparisons or a proof of every possible semantic equivalent.

Freeze model digest/quantization, Ollama version, source **and built JS** hashes, lockfile, prompt, schema projections, corpus and seeds before requests. Settings: JSON mode, thinking disabled, temperature 0.2, seeds 42/43/44, 32768 context, 2048 output tokens, 90-second request deadline, 2 MiB response limit. Three repeats per model, at most two repairs; only parser/compiler/renderer diagnostics trigger repairs. A valid but incorrect chart does not receive oracle hints or extra attempts. Diagnostics for invalid-document tasks come from the actual Agent validation tool. This is host-orchestrated Agent-assisted generation, not autonomous MCP tool selection by the model.

Report first-pass JSON/structure, compilation, source/mark fidelity, correctness, actual worker SVG hash, latency and failures separately. Summary rates use the planned denominator and explicitly expose pending tasks; incomplete rates cannot qualify a model. Wilson intervals are descriptive attempt-level intervals; repeated tasks are correlated. Proposed 95% structural/after-repair targets are evaluation criteria, not a verified service promise. Models below them stay experimental. An interrupted pre-freeze pilot was retained; no failures were removed or used to tune prompts. The corpus has been exercised by that pilot and must not be advertised as an untouched external holdout.

```sh
pnpm eval:independent:check
pnpm eval:independent --corpus .local/m4/heldout.json --models qwen3.5:9b,mistral:latest,qwen3.5:27b,goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest --output outputs/m4-baseline-v1
# Resume only after the original process exits, using the identical arguments:
pnpm eval:independent --corpus .local/m4/heldout.json --models qwen3.5:9b,mistral:latest,qwen3.5:27b,goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest --output outputs/m4-baseline-v1 --resume
```

The private file exists only in the maintainer checkout. Other consumers supply an independently authored corpus; public development tasks can exercise the runner but are not held-out evidence. Raw requests/results stay under ignored `outputs/`; `freeze.json`, `summary.json`, `status.json` and per-model attempt JSONL support inspection/resume. Drift in code, prompt, corpus, model digest or Ollama/settings refuses resume. Fatal interruption preserves existing attempts. Do not run live models on every PR; no cloud endpoint, model download or scheduled evaluation is configured.

## Installed distributions

`pnpm test:packages --offline --browser` builds, packs all 11 packages and installs file tarballs into a fresh OS temporary directory, with no ancestor workspace or package-source symlinks. Existing package-store bytes may be reused; this is installation isolation, not an empty download cache. The rehearsal pins unique transitive versions from the reviewed lockfile and uses actual peer versions. It does not certify future semver resolutions. Online installation without `--offline` is available when the cache is missing. Both Node 22.22.3 and 24.22.1 passed locally on macOS arm64, including the same tarball hashes and 45 browser tests each.

Audits check allowed archive paths, LICENSE/NOTICE, JS/type exports, all static Agent/MCP resources, isolated import resolution, installed CLI bins, stdio MCP resource/SVG hash, SVG/map worker-relative imports, browser rendering and pinned React/San adapters. Consumer TypeScript resolves installed declarations using NodeNext with third-party `skipLibCheck`; no broad third-party type certification is implied. Consumers/logs are retained for investigation; use the printed exact temporary directory for cleanup. No registry publication occurs.

## Modules, size and performance

The shared bridge explicitly registers ten ECharts series modules (combo composes bar+line), SVG renderer, supported components, label layout and ARIA. Both browser and workers use the same profile. The installed regression caught a missing ARIA registration for zero-share pie; it is fixed. This internal profile preserves the four-type native mode; it does not expose arbitrary ECharts plugins.

[Byte budgets](../../resources/performance-budgets.json) freeze measured minified ESM all-export bundles plus 10% headroom. `includePeers:false` externalizes **all third-party dependencies**, including Ajv; true bundles dependencies/host SDKs. Runtime is approximately 35.4 kB gzip with dependencies external, 362.3 kB bundled. These are SDK measurements, not the multipage demo. The demo can still warn about large SDK chunks.

```sh
pnpm benchmark
node --expose-gc scripts/benchmark.mjs --compare /absolute/path/to/prior-baseline.json
```

`pnpm benchmark` enforces deterministic byte budgets, records compile/SVG median/p95, post-GC heap observations and boundary cases: 100/1000/10000 rows, radar 6×8, tree 1000 nodes, Sankey 200 nodes/1000 links, map 1000 regions, native 50 series/50000 points. Browser tests record 10 post-warmup mount/render, update and disposal samples for each row count and assert no retained instance/SVG/accessibility DOM. Heap deltas do not prove absence of leaks. Use an otherwise idle same machine/runtime for optional 20% p95 comparison; CPU/model names alone do not certify equivalent load. No absolute cross-device SLA is asserted. Missing byte budgets fail the gate; timing comparisons are opt-in because shared CI hardware is noisy.

## CI and migration

Required CI aggregates independent verify, browser and Node22/24 package jobs. Failures preserve package/performance/browser artifacts. The workflow is implemented locally; **no remote run of the uncommitted changes exists**. A successful old commit does not satisfy this gate. [0.3 migration](contracts-03.md) remains explicit via `migrateIntentTo03`; native stays on 0.1 and type-irrelevant fields fail rather than being discarded. No user-data migration or release is performed by M4. Keep 0029 and M4 open until final model results and the authorized pushed revision pass CI.

## Aggregate report

```sh
node scripts/report-independent-evaluation.mjs outputs/m4-baseline-v1 specs/0036-trial-distribution/evaluation-summary.json
```

This command exports only aggregate metrics, failure categories and provenance. It can run during evaluation; generated timestamps and pending counts identify incomplete snapshots. Review final failures before accepting any model.
