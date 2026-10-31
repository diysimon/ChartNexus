---
doc_id: action-plan-2026-10-31
version: "0.2"
status: implementing
updated: 2026-10-31
language: en
---
# Detailed action plan and acceptance gates

[简体中文](../zh-CN/action-plan-2026-10-31.md)

## Scope, status and execution

Based on the [review](project-review-2026-10-31.md) and [design RFC](technical-design-2026-10-31.md), this covers the nine quality areas plus radar, node-link tree, Sankey and map. **M0–M3 (A01–A15) are complete locally; M4 remains open**. The review baseline was 147 tests and 18 browser tests; M0 passed 176 tests and 21 browser tests. M1/M2 passed 207 unit/integration tests and 33 browser tests, plus one real local Ollama streaming/cancellation smoke case. M3 passes 230 unit/integration and 44 browser tests; it does not add real-model benchmark results. The [review spec](../../specs/0030-project-review/spec.md) accepts review artifacts only; [0029](../../specs/0029-quality-expansion/spec.md) remains the incomplete scope umbrella.

Execute reviewable vertical units: spec/AC → code and resources → targeted tests → relevant full gates → evidence update. Resolve routine choices using the RFC; record breaking contracts through versioning/RFC rules. Keep a local preview working. Do not automatically commit, push, publish or create external issues.

Axx IDs are local planning identifiers, not GitHub issues. Estimates are working days for one developer familiar with the repository, including code and acceptance but excluding external waits. They are not dates or promises. Re-estimate after M0 and never remove acceptance requirements merely to declare timely completion.

## Milestones

| Milestone | Order | Exit criteria | Rough effort |
| --- | --- | --- | --- |
| M0 Correctness and baseline | A01 → A02 → A03 | Zero-sum/legend regressions fixed; entry versions aligned; facts/gaps traceable | 3–5 days |
| M1 Contracts and boundaries | A04 → A05; start A16 harness | 0.3 branches/migration and resource source inspectable; existing seven types unchanged | 4–6 days |
| M2 Chat host quality | A06 → A07; A08 → A09 → A10 → A11 | Layout, keyboard/table, lifecycle, state, real local streaming and host matrix verified | 7–10 days |
| M3 Four complete chart paths | A12 → A13 → A14 → A15 | Each has schema/compiler/theme/table/browser/SVG/events/resources/negative tests; map worker path complete | 10–15 days |
| M4 Trial and distribution | Final A16 → A17 → A18 | Frozen evaluation, all-package installs, performance baseline, CI and explicit support matrix | 4–7 days |

Total provisional effort: 28–43 working days without parallel agents; font/map/SDK surprises may require additional buffer. Prepare A16/A17 early, but final results must use frozen actual versions. Deliver usable increments at every milestone; do not defer existing correctness fixes until all charts exist.

## Work packages and acceptance

| ID | Work and primary location | Dependencies | Required AC | Evidence/status |
| --- | --- | --- | --- | --- |
| A01 | Capability/version/resource inventory; docs, recipes manifest, generate, check-docs | Review | AC01: one declaration and positive/negative example per supported type; mismatched paired status/date fails; unimplemented types excluded from model capabilities | done — [evidence](../../specs/0032-model-entry-consistency/tasks.md) |
| A02 | Zero-sum pie/donut and empty/colliding groups; core/tests | A01 | AC02: zero input has no nonzero sectors and unchanged values/identity; reordered groups retain identity; labels distinguish empty/colliding values; SSR/browser verified | done — [evidence](../../specs/0031-intent-semantics/tasks.md) |
| A03 | Align A2UI/OpenUI/COSUI model entries with host profiles | A01 | AC03: 0.2 chat host receives matching schema/description/recipe; legacy entry remains valid; unsupported versions diagnosed | done — [evidence](../../specs/0032-model-entry-consistency/tasks.md) |
| A04 | Freeze 0.3 union, event/notice contracts and projected schemas; schema/agent | A02/A03 | AC04: eleven branches, three data families, explicit migration; branch positive/negative and schema-projection equivalence tests | done — [evidence](../../specs/0033-contracts-core/tasks.md) |
| A05 | Extract data resolution/transforms/chart compilation/presentation; core | A04 | AC05: seven types preserve numeric/order/null/unit/row/aggregate golden semantics; no DOM/network/model SDK dependencies enter core | done — [evidence](../../specs/0033-contracts-core/tasks.md) |
| A06 | Pure presentation planning and dimensions shared by browser/SVG | A05 | AC06: title/legend/axes/scales fit the dimension matrix or explicitly fall back; resizing changes neither data nor data revision | done — [evidence](../../specs/0034-chat-host-quality/tasks.md) |
| A07 | Theme tokens, summary/table, keyboard access and export | A06 | AC07: contrast passes on declared surfaces; keyboard accesses full data/legend; null/units accurate; required SVG information does not depend on scrolling | done — [evidence](../../specs/0034-chat-host-quality/tasks.md) |
| A08 | Pending zero-size mount, recovery and transactional Marklang staging | A03 | AC08: hidden→visible recovers with one instance; no late mount after disposal; second-chart render failure preserves all old Marklang charts; no observer leaks | done — [evidence](../../specs/0034-chat-host-quality/tasks.md) |
| A09 | Optional stable keys, compatibility and legend-state retention | A04/A08 | AC09: reorder preserves keys, deletion removes state, new series visible, incompatible fields/units/type reset appropriate state; failure preserves revision | done — [evidence](../../specs/0034-chat-host-quality/tasks.md) |
| A10 | Neutral buffer and real Ollama framing/cancel/repair | A08/A09 | AC10: UTF-8 splits, missing termination, truncation, cancellation, late/stale/duplicate updates cannot miscommit; real local stream evidence | done — [evidence](../../specs/0034-chat-host-quality/tasks.md) |
| A11 | Four-host contract matrix; implement or explicitly reject Marklang features | A06/A07/A10 | AC11: pinned real SDK mount/update/select/error/dispose/theme/completion tests; unsupported cells explicit | done — [evidence](../../specs/0034-chat-host-quality/tasks.md) |
| A12 | Radar schema/compiler/examples | A04/A05/A06/A07 | AC12: 3–8 indicators, 1–6 items, explicit ranges/units; reject missing/out-of-range; preserve data/identity; browser/SVG, levels/themes | done — [evidence](../../specs/0035-chart-expansion/tasks.md) |
| A13 | Tree parent table, cycle checks, expansion state/export | A09/A12 | AC13: reject orphan/cycle/multiple roots/depth excess; duplicate labels valid; collapsing retains data; stable node events; explicit full/overview export | done — [evidence](../../specs/0035-chart-expansion/tasks.md) |
| A14 | Sankey nodes/links, topology/weights/identity | A09/A13 | AC14: reject cycles/self-links/missing endpoints/negatives/duplicate edges; zero links retained in table; no assumed conservation; correct node/edge events and SVG | done — [evidence](../../specs/0035-chart-expansion/tasks.md) |
| A15 | Map registry, GeoJSON limits, region matching and worker support | A04/A07/A09/A14 | AC15: authored two-region browser/SVG equivalence; reject missing/mismatched assets and unknown/duplicate regions; no version collisions/network; measurable capacity/worker budgets | done — [evidence](../../specs/0035-chart-expansion/tasks.md) |
| A16 | Separate dev/heldout, family-aware scoring, real model/Agent baseline | Harness in M1; final after A11–A15 | AC16: no held-out answers in model resources; initial/repair results separate; data hashes/rendered values checked; failures retained; versions/settings frozen | audited replacement holdout running; old development corpus rejected |
| A17 | All-package pack/install, bundle/performance | Early probes; final after A11–A15 | AC17: Node22/24 installs without workspace links; exports/worker/CLI/MCP/adapters work; resources/licenses included; typical/boundary performance report | local and Linux CI pass; see SPEC-0036 |
| A18 | CI, migrations, matrix, docs and demos | A16/A17 | AC18: supported cells link versions/evidence; required CI actually passes; generated docs/resources agree; no unresolved P1 before beta candidate | remote CI passes at7345f34; final report revision pending |

The three data families in A04 are ordinary tables (including parent-key trees), nodes/links graphs, and ordinary tables plus trusted map references, not three arbitrary JSON engines. A13–A15 ordering controls risk; it does not imply inappropriate semantic reuse.

## Mapping the original nine areas

| Original area | Tasks |
| --- | --- |
| 1 Responsive containers and labels | A06 |
| 2 Themes and accessibility | A07 |
| 3 Interaction preservation | A08/A09 |
| 4 Independent evaluation | A16 |
| 5 Real streaming | A10 |
| 6 Model protocol usability | A03/A04/A16 |
| 7 Protocol compatibility/verification | A11 |
| 8 Installation/pre-release verification | A17/A18 |
| 9 Contract stability/documentation | A01/A04/A05/A18 |
| Four new types | A12–A15 |

Remote MCP, universal device certification, every-model rankings, automatic fact retrieval and training a model are not required new features. Do not broaden corresponding support claims. Tree is not treemap; map is not an online map service.

## Verification matrix and completion

**Deterministic semantics:** every type covers minimal valid, empty/null/zero, extremes/limits, unknown fields, invalid encodings, reorder/update and numeric/identity preservation; graphs also cover topology. Confirmed counterexamples must become normal regressions, not remain only review probes. Automate projected-schema/capability/resource consistency.

**Presentation:** cover two themes and five levels for seven existing plus four new types. Use option/metadata combinations and representative browser/SVG visual cases; do not imply manual inspection of every combination. Test content widths 240/320/480/768px and heights 240/320/480px, long Chinese/English categories/titles, multiple series, zero/null, dual axes and heatmap scales. Pin browser/fonts/data/dimensions/theme/animation for references. Combine geometry checks and human samples; scrollWidth alone does not detect visual overlap. Below-minimum widths exercise fallback and full-data access.

**Lifecycle:** zero size, show/hide, repeated mount/dispose, resizing, removed series, type transitions, user legend changes, malformed documents, render-failure injection and upstream remount. Assert old chart/revision preservation, not merely error return values.

**Models:** initially propose 30 public development and 60 held-out tasks: 33 chart tasks (11×3), 12 edits, nine invalid/unsupported tasks and six recovery tasks. Separate task families beyond renaming or changing numbers. Run three repeats for each actually available model; report model/quantization/settings separately. Cross-provider runs require actual configuration. Chart-task scoring should allow semantically valid alternatives rather than require one arbitrary chart type.

Candidate gates: all deterministic data/identity invariants pass; no unsafe/cancelled commits; no unresolved P1. Proposed model targets are ≥95% first-pass structural validity and ≥95% task correctness after at most two repairs, to be frozen after the M1 baseline with denominators/confidence intervals reported. Models below targets remain experimental or unsuitable for automatic operation. Never implicitly alter data to improve scores or equate model variation with protocol incompatibility. These checks do not establish support for every model.

**Distribution/performance:** schema/core/runtime/render/agent/cli/mcp and all three adapters; Node22/24; pinned browser/React/San/SDKs. Test browser execution and Node imports separately. Measure raw/gzip and loaded combinations, plus 100/1000 rows and capability maxima on the same machine. Set absolute budgets after initial measurement. A same-machine p95 regression limit of 20% is a candidate gate; repeat noisy measurements rather than casually widening limits.

## First three executable changes

1. **Semantic correction PR:** F01/F02 only; add zero-sum/donut/empty/colliding/reordered-group regressions and bilingual notes. Do not mix 0.3 or new charts.
2. **Entry consistency PR:** A03 plus minimal recipe-inventory/status checks; real SDK descriptions match the enabled profile.
3. **0.3 contract and extraction PR:** freeze branch examples/negative cases before equivalent extraction. Implement new charts separately so refactoring does not conceal behavior changes.

These are proposed change boundaries, not existing PRs or publication instructions. Update task results/evidence after each unit. Close 0029 only when all required ACs have evidence; more documents or small edits are not substitutes for core completion.

## M4 checkpoint

A01–A15 remain locally accepted. A17 passes local and Linux CI Node22/24 isolated installs, each45 browser tests; A18 implementation passes all remote gates at7345f34. The rejected original family audit remains preserved. Replacement host-catalog families were [audited](../../specs/0036-trial-distribution/holdout-audit-v2.json) before requests;4 models ×3 repeats,720 rounds are running. See [M4 tasks/evidence](../../specs/0036-trial-distribution/tasks.md). The user authorized commits and SSH pushes. M4 and0029 stay open until final evaluation and report-revision CI complete; no npm publication.
