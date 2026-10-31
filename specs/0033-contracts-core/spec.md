---
doc_id: spec-0033-spec
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
[Other language](spec.zh-CN.md)

# M1 contracts and core boundaries

## Scope and accepted design
A04/A05 and the A16 harness foundation. Freeze eleven 0.3 intent branches, three data families, projection and explicit migration. Implement compilation for the existing seven types only; radar/tree/Sankey/map are schema-reserved until M3. Extract validation, data resolution/transforms, chart handlers and presentation without changing existing numeric semantics. Keep 0.1 native/intent and 0.2 readable.

## Acceptance (pass; see [evidence](tasks.md))
- AC01: eleven branch positive/negative and full/projected schema equivalence tests; missing type-specific settings fail structurally.
- AC02: explicit lossless migration, theme mapping and stable-key validation; reserved types fail compilation as unsupported.
- AC03: seven-type golden semantics and existing transforms/identity remain unchanged after extraction; no DOM/network/SDK in core.
- AC04: schema/capability/Agent resources synchronized; development/heldout harness isolates answers and scores data fidelity separately.

## Failure, resources, dependencies and delivery
Depends on M0 and the review RFC. Preserve committed charts on validation/render/transport failure; no user input is executed. Existing 1 MiB/4096px/data budgets remain; staging is capped at 16 charts and 2 MiB old/new source coexistence. New contracts are 0.3 or host opt-in; no automatic migration. Pure compiler remains DOM/network/model-SDK free. Update paired docs, manifests, generated schemas/resources and tests. Rollback disables new version/host options while retaining legacy data. Evidence in tasks; external unavailable checks remain not-run, never pass. No Git or external release actions.
