---
doc_id: project-review-2026-10-31
version: "0.1"
status: reviewed
updated: 2026-10-31
language: en
---
# ChartNexus technical review: 2026-10-31

[简体中文](../zh-CN/project-review-2026-10-31.md)

## Conclusion and scope

The project is an **experimental implementation with real local end-to-end paths**, not a generally verified GenUI chart layer. Its direction is sound: data contracts, model-independent compilation, host adapters, browser/SVG rendering and shared CLI/MCP services. Preserve these boundaries. Correct semantic errors, align model entry points and close host lifecycle gaps before expanding chart types. A rename, wholesale rewrite or full ECharts-option replication in intent is unnecessary.

The reviewed baseline is `54fbf2a3f7f21a5f5d565e8aed885fe2aac2aa16`, with a clean worktree before review. This work adds review, design, planning and reproduction artifacts only; it does not fix product behavior, commit or publish. This document is a baseline snapshot; subsequent status belongs in the [action plan](action-plan-2026-10-31.md). Cross-package proposals are in the [technical design RFC](technical-design-2026-10-31.md).

Source, schemas, capabilities, adapters, tests, pipelines, resource generation and specs were inspected. Full local gates, browser regressions, targeted counterexamples and one offline package installation were executed. No new real-model calls, remote CI inspection, all-device certification or full security audit was performed. Memory was used for navigation only; findings below rely on current source and checks.

## Capabilities and evidence

| Area | Actual state | Boundary |
| --- | --- | --- |
| 0.1 intent | Bar, line, pie, scatter and bounded grouping/stacking implemented | Not equivalent to full ECharts |
| 0.1 native JSON | Guarded partial validation and optional strict-basic validation | Default compilation is not comprehensive semantic validation; strict is a small subset |
| 0.2 intent | Seven types: bar, line, pie, scatter, bar-line combo, funnel, categorical heatmap | No 0.2 native mode; many valid-combination rules live only in compilation |
| Chat presentation | Host opt-in, two themes, transparent/theme background, five levels, fixed 80px category labels | No container-aware layout or general table/keyboard equivalent; palette repeats after four colors |
| Runtime | Lifecycle, ResizeObserver, invalid-input preservation, revision/dedup wrapper | No retry after initial zero-size mount; interaction state and stable row identity incomplete |
| Protocols | Experimental OpenUI Lang, A2UI v0.9, COSUI JSON/San and Marklang | Specific SDK/host evidence only; Marklang lacks chat profile and ordered updates |
| Agent | Schema/capability discovery, validate/compile/SVG, stdio MCP, CLI and RAG resources | Tool success is not model-task success; desktop clients and remote transport unverified |
| New charts | Radar, node-link tree, Sankey and map planned | None implemented; must not appear in supported capabilities |
| Distribution | All packages remain private alpha | Only schema received a clean-install check in this review; full dependency closure unverified |

Checks in this review:

- Node **22.22.3**, pnpm **11.25.0**, matching the declared Node baseline.
- `pnpm check`: **147/147 unit/integration tests passed**, plus generation, docs, format, lint, types and demo build. The 20/20 evaluator self-check uses public reference answers; it is not a model success rate.
- Local Chrome **156.0.8078.74**: `pnpm test:browser` **18/18 passed**. Ollama page tests use mocked responses, not live model calls.
- The demo's main shared asset is approximately **1.29 MB**, **422 KB gzip**, with a >500 KB build warning. This measures the demo, not a standalone SDK bundle.
- The `@chartnexus/schema` tarball contains schemas, declarations, exports and LICENSE; offline installation into a clean temporary directory and importing its public package name succeeded. Other packages, platforms and complete dependency installation remain unverified. The initial npm attempt could not write the user cache; a temporary cache resolved this without changing user-cache permissions.
- The [probe script](../../specs/0030-project-review/probes.mjs) and [baseline observations](../../specs/0030-project-review/baseline-observations.json) preserve semantic counterexamples.

## Findings

P1 means correctness or essential contract work before broad trials. P2 means engineering and experience requirements before a stable beta. No P0 was confirmed; this is not proof of security. Reproduction and source-based conclusions are distinguished.

| ID | Priority/evidence | Finding and impact | Decision |
| --- | --- | --- | --- |
| F01 | P1, reproduced | A `[0,0]` pie compiles with ECharts `stillShowZeroSum=true`; SVG contains two nonzero semicircle sectors, implying equal shares where no share exists | Disable zero-sum sectors explicitly, preserve values and expose a no-share state/notice; also test donut |
| F02 | P1, reproduced | Groups `''` and `'value'` both receive series name `value` when y is `value`; the legend cannot distinguish them | Separate identity and display labels; define empty-label and collision handling with raw values recoverable |
| F03 | P1, reproduced | A heatmap without heatmap configuration passes Schema but fails compilation; one chart object mixes fields for seven types | Keep structural/semantic layers but encode type-local structure in discriminated schemas and expose small per-chart branches |
| F04 | P1, source/probe | OpenUI/A2UI descriptions still request 0.1, while chat presentation accepts only 0.2 | Generate version-correct descriptions/examples from capabilities; match schema to the enabled profile |
| F05 | P1, source inference | Runtime rejects zero-size mount; React mount effects run once and have no retry path when containers become visible | Adapter-level pending mount, latest complete-document buffering and cancellation on unmount; preserve old mount error contract |
| F06 | P1, source inference | Marklang disposes old charts and replaces DOM before mounting/rendering the next charts; subsequent failures cannot restore them; chat settings accepted through shared options are unused | Declare capabilities explicitly; stage in an isolated measurable surface and swap only after success; clean failed staging and retain old charts |
| F07 | P2, source/tests | Every update uses `notMerge:true`; no independent interaction state, stable row keys or reset contract | Optional host state policy and semantic compatibility checks; start with legend, zoom only in declared profiles |
| F08 | P2, limited evidence | Fixed 80px truncation and one narrow fixture do not constitute responsive layout; hover excludes keyboard/touch; title/legend/dual-axis/export spacing lacks a common contract | Separate pure presentation planning from measurements; deterministic tables/summaries and a full layout matrix |
| F09 | P2, source/probe | Recipe manifest has two entries; four new recipes are separately hardcoded in generators/resources. Docs checks validate IDs/language/version/links but not status, dates or completion | Explicit capability/resource registry and consistency checks across schemas, recipes, tools, docs and release evidence |
| F10 | P2, source | Core index is about 1200 lines; heatmap borrows scatter, funnel converts through pie, combo recursively compiles twice | Incrementally separate resolution, transforms, chart compilation and presentation; stop adding global branches |
| F11 | P2, evidence gap | Tiny model pilots reuse failed tasks; public evaluation answers are available as resources; the tracked runner primarily targets 0.1 | Separate development resources from held-out evaluation, add 0.2/new-version repair metrics, never call public-answer resources held-out |
| F12 | P2, verification gap | CI exists but remote outcomes were not checked; no complete package clean-install, performance baseline or release matrix | Tarball integration, Node 22/24, pinned SDKs, browser evidence and license review before any release decision |

Source references: [compiler](../../packages/core/src/index.ts) (series naming around L286, default animation L295, 0.2 dispatch from L402), [chat presentation](../../packages/core/src/chat-presentation.ts), [runtime](../../packages/runtime/src/index.ts), [Marklang](../../packages/adapter-cosui/src/marklang.ts), [OpenUI](../../packages/adapter-openui/src/index.ts), [A2UI](../../packages/adapter-a2ui/src/index.ts), [generation](../../scripts/generate.mjs), [docs checker](../../scripts/check-docs.mjs). Line numbers describe the baseline and may move.

## Corrections to earlier interpretations

1. Seven implemented chart types means specific subsets, not verified zero-sum behavior, all dimensions, visual semantics, interaction or model success. Counterexamples require separate acceptance.
2. The previous attribution of transient narrow-layout overflow to “ECharts update animation” was unsupported: intent explicitly sets `animation:false`. Waiting for stable layout passes, but the root cause has not been isolated; ResizeObserver/layout scheduling is only a possibility.
3. Git ahead counts use local tracking refs. Earlier SSH URL pushes do not automatically refresh the HTTPS origin tracking ref. The count is not evidence that four commits remain unpushed. This review did not query remote state.
4. SPEC-0029 is still incomplete. A fixed label limit does not close responsive-layout acceptance. Plans, test counts and completion must remain separate.

## Preserve these decisions

Keep core free of DOM/network/model SDKs, JSON inputs non-executable, trusted registries, complete validated commits, worker deadlines/concurrency limits, separate adapters and bilingual resources. Native remains a controlled extension path rather than the model default. Remote MCP, every framework binding, automatic data retrieval and elaborate styling are not current foundational quality gates.

Proceed with **semantic corrections and entry alignment → contracts/resources → layout/accessibility/state/real streaming → one complete new chart at a time → independent evaluation and distribution acceptance**. Build evaluation infrastructure early and reuse it throughout.
