---
doc_id: spec-0035-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
# M3 execution and acceptance evidence

[简体中文](tasks.zh-CN.md)

## Delivered

A12–A15 are complete locally. Four independent 0.3 compilers, strict type-local schemas, source tables and stable identities are connected to browser/SVG/worker rendering. Shared map preparation/registration lives in the new private @chartnexus/echarts workspace package, using the existing ECharts peer and no new third-party runtime dependency. Core imports only schema and pure utilities, never ECharts, DOM, network or model SDKs.

| AC | Result | Evidence |
| --- | --- | --- |
| AC12 radar | pass | [compiler tests](../../tests/chart-expansion.test.ts): explicit ranges/units, item/indicator limits, null/duplicate/out-of-range rejection, row keys/reorder, source preservation, two themes/five levels and SVG. [Browser tests](../../tests/browser/chart-expansion.spec.ts) verify actual selection and legend/data access. |
| AC13 tree | pass | Compiler tests cover orphan/self/cycle/multiple-root/duplicate/depth failures, duplicate labels and 1000-row fallback without data loss. Browser tests verify real node events, collapse/reorder/resize retention, topology reset and failed-update revision preservation. SVG identifies the collapsed overview and contains the full source hierarchy. |
| AC14 Sankey | pass | Compiler tests cover endpoints, self-links, duplicates, cycles including zero edges, negative/null/string weights, reference revision mismatch, node limits, zero-flow rendering, balances and literal label markers. Browser clicks emit node/edge identities. |
| AC15 map | pass | [Asset tests](../../tests/map-assets.test.ts) compare SHA-256 with Node crypto; test cloned assets, Polygon/MultiPolygon, Unicode keys, invalid geometry/metadata/hash, exact 20000-point boundary, eight-registration cap and same-revision replacement rejection. Compiler/browser tests distinguish zero/null/absent and preserve old revisions on failure; Agent tests render all four charts in bounded workers and reject tampered map hashes. |
| AC16 consistency | pass | [Recipe inventory](../../tests/resource-inventory.test.ts), full/projected schemas, generated resources/diagnostics and bilingual checks. All four charts mount in each actual pinned OpenUI/A2UI/COSUI JSON/Marklang SDK, retain charts on invalid input and dispose cleanly. Legacy suites remain passing. |

## Verification

[Structured evidence](verification.json) records environment and log fingerprints. `pnpm check` passed **230 unit/integration tests in 30 files**, 20 reference self-checks, generation, 94 bilingual pairs, formatting, lint, types and demo build. The final browser suite passed **44 tests**. No new live model evaluation ran; existing browser Ollama cases use mocked transport. Remote CI and all-package clean installation were not run.

Representative light/dark screenshots of each new chart were captured; radar light, tree dark, Sankey dark and map light were inspected. Visual review caught Sankey's internal-ID fallback and tree node/label overlap; fixed label mapping/position and map label contrast are reflected in final screenshots/tests. Marklang hidden recovery produced a ResizeObserver notification warning during full regression; scheduling the staged commit on the next animation frame, cancelling it on disposal, and asserting no page errors resolved it. Source tables always preserve original text even when visual truncation is necessary.

The full ECharts demo bundle still produces a size warning; bundle reduction/performance belongs to M4. Local workspace relinking used the existing offline pnpm store; this does not count as a clean published-package installation. Screenshots and local logs remain ignored. No commit, push or publication was performed.

## Remaining boundaries

See [usage and limits](../../docs/en/chart-expansion-03.md). Map assets are host-owned, not model-supplied; the authored two-region fixture is not a real boundary dataset. Tree SVG is an initial collapsed overview, not a browser-state export. Marklang retains its whole-document reset semantics. No every-model, universal protocol, device or comprehensive GIS/accessibility certification is implied. M4 final held-out evaluation, packaging, performance and remote CI remain open.
