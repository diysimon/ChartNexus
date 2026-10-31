---
doc_id: spec-0034-spec
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
[Other language](spec.zh-CN.md)

# M2 chat host quality

## Scope and accepted design
A06-A11. Pure dimension-aware presentation and theme tokens; deterministic summary/full table, keyboard legend/data access and static export metadata; pending-size coordination preserving immediate mount API; transactional Marklang; stable row keys and compatible legend retention; protocol-neutral buffering, real Ollama NDJSON terminal/cancel/repair and four pinned host profiles. No new M3 renderers, automatic factual retrieval, remote publication or undeclared zoom.

## Acceptance (pass; see [evidence](tasks.md))
- AC01: width 240/320/480/768 and height 240/320/480 with two themes/five levels fit or explicitly fall back; resize preserves data revision.
- AC02: contrast on declared surfaces, full data/null/unit/identity table, keyboard controls and static summary/table metadata.
- AC03: hidden initial mounts recover once; disposal cancels waiting; staging failure preserves old Marklang DOM and instances.
- AC04: stable keys survive reorder, compatible legend state retained; removed/new/incompatible series reset correctly; failure preserves revision.
- AC05: UTF-8 splits, framing, truncated/missing terminal, cancellation, epoch/revision and bounded repairs cannot miscommit; actual local Ollama streaming evidence.
- AC06: real pinned OpenUI/A2UI/COSUI JSON/Marklang tests cover applicable contract cells and explicit unsupported features.

## Failure, resources, dependencies and delivery
Depends on M0 and the review RFC. Preserve committed charts on validation/render/transport failure; no user input is executed. Existing 1 MiB/4096px/data budgets remain; staging is capped at 16 charts and 2 MiB old/new source coexistence. New contracts are 0.3 or host opt-in; no automatic migration. Pure compiler remains DOM/network/model-SDK free. Update paired docs, manifests, generated schemas/resources and tests. Rollback disables new version/host options while retaining legacy data. Evidence in tasks; external unavailable checks remain not-run, never pass. No Git or external release actions.
