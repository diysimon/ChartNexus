---
doc_id: spec-0001-tasks
version: "0.1"
status: done
updated: 2026-10-30
language: en
---

# Execution evidence

Status: Done. Verified locally on 2026-10-30. This completes SPEC-0001, not the entire alpha/beta roadmap.

- [x] T01: workspace + schema (AC-01, AC-05)
- [x] T02: compiler + data validation (AC-02)
- [x] T03: DOM + SVG + playground (AC-03, AC-04)
- [x] T04: tests + docs + local CI configuration (AC-05)

## Results
| AC | Result | Evidence |
| --- | --- | --- |
| AC-01 | pass | [Boundary tests](../../tests/core.test.ts): mode/schema rejection, invalid JSON values, dangerous keys, depth/size limits |
| AC-02 | pass | [Compiler tests](../../tests/core.test.ts): four charts, grouping/gaps, duplicate categories, reference revisions, determinism/immutability |
| AC-03 | pass | [Browser tests](../../tests/browser/playground.spec.ts): modes, series replacement, failed update preservation, zero size, dispose/remount, resize, real click events |
| AC-04 | pass | SSR tests for three chart types, `pnpm demo:svg`, Node 22 test invocation; browser tests also cover scatter |
| AC-05 | pass | `pnpm check`, generated types, bilingual manifest/link checks, pinned lockfile, offline frozen install |

## Commands and environment
- `pnpm check`: pass; format, ESLint, package and tooling TypeScript, 29 tests, demo production build.
- `node node_modules/vitest/vitest.mjs run`: 29 passed under Node 22.22.3 (before the final axis-layout-only adjustment; final full check uses pnpm's Node 24.19.0 runtime).
- `pnpm test:browser`: 3 passed with Playwright 1.64.1 and explicit local Chromium 149.0.7827.55 executable. CI installs its own matching Chromium; that remote run is not verified.
- `pnpm demo:svg`: pass; generated `outputs/sales.svg`.
- `pnpm install --offline --frozen-lockfile --ignore-scripts --store-dir .local/pnpm-store`: pass using the populated local cache, not a clean network install proof.
- Bilingual checker: 28 pairs / 136 local links passed before this evidence update; rerun after updating evidence.
- Visual inspection: chart rendered correctly after fixing a clipped x-axis title. Screenshot is local-only under `test-results/playground-captures-the-verified-development-preview/playground.png`.
- Git origin/HEAD synchronized to remote `4cf28d1bf8d7d9a1156cabb3af5c43b2c1395990`; existing user files preserved. Nothing committed or pushed.

## Remaining limits
No MCP, protocol integration, live-model evaluation, persistent operation controller, state-preserving updates, package publishing, clean tarball-install validation, GitHub Actions run, or branch protection is claimed. Full ECharts bundle produces a roughly 1.26 MB JS chunk (about 415 KB gzip); modularization is deferred. Synchronous render work has no hard deadline/process isolation. Resource budgets are starting constraints, not measured performance SLAs.
