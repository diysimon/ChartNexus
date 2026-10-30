---
doc_id: spec-0001-spec
version: "0.1"
status: done
updated: 2026-10-30
language: en
---

# SPEC-0001: Core development foundation

Status: Done; date: 2026-10-30. Authority: user requested code development.

## Scope
Four private schema/core/runtime/render workspaces, dual input, four intent charts, synchronous host data references, DOM/SVG, offline demo, and basic CI. Excludes MCP, UI protocols, publishing, operation deduplication, and full native ECharts option coverage.

## Design decisions
schemaVersion 0.1 is experimental and unpublished. JSON Schema owns shape; TypeScript types are generated. Intent uses explicit x/y/series encodings; pie uses x categories and y values; scatter requires quantitative x/y. Data consists of field names and object rows; references resolve host id/revision without network access.
Native mode supports declared safe components and four series types only. No code execution, external resources, HTML tooltip, or custom series. Limits: 1 MiB input, depth 32, 10000 rows, 50 series, dimensions up to 4096. Synchronous compilation/ECharts cannot be hard-interrupted; structural budgets constrain work. Process-isolated deadlines are deferred to service hosting and are not claimed.
Full replacements use notMerge; zoom/legend preservation is deferred. Failed updates preserve the last valid rendering; a runtime cannot change chartId. Selection events include chart/data revisions and positional row identity for intent, never a fabricated stable rowId.

## Acceptance criteria
- AC-01: Mutually exclusive modes; unknown fields, functions, nonfinite values, dangerous keys, and over-limit input produce diagnostics.
- AC-02: Four intent charts, grouping, nulls, fields, and data revisions compile correctly; inputs remain immutable and results deterministic.
- AC-03: Browser mount, type changes, series deletion, data updates, invalid-update preservation, resize/dispose work.
- AC-04: DOM-free Node compilation produces real SVG without credentials.
- AC-05: Generated artifacts, bilingual docs, examples, and CI agree; versions are pinned.

## Verification and resources
Vitest covers contracts/semantics/SSR; Playwright covers real browser lifecycle and selection; build/docs checks apply. Synthetic sales data only. Record evidence in tasks; no live-model or external-protocol claims.

## Compatibility, risks, rollback
Private packages are not published. Preserve source documents; no historical migration yet. Local ECharts 6.1.0/Node 22 evidence does not establish universal compatibility. Reverting local edits does not change remote state. Record failed Git synchronization as a separate blocker.
