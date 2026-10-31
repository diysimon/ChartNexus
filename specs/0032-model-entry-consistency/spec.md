---
doc_id: spec-0032-spec
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
[Other language](spec.zh-CN.md)

# Resource inventory and model input contracts

## Scope and design
Implement A01/A03 of M0. Recipe manifest is the source of recipe discovery, copies and retrieval entries. Every supported intent type has a positive recipe and declarative negative case. Public synthetic recipes are development resources, not held-out evaluation. Document checks parse frontmatter and reject paired status/date drift.

A shared runtime helper recommends 0.2 intent and returns its schema, resource URI and a canonical complete example. Non-chat hosts preserve 0.1 intent/native acceptance; chat hosts accept only 0.2 intent. Ordered hosts describe a wrapper with host-owned operation IDs and revisions. OpenUI/A2UI descriptions consume this contract; COSUI exposes it for host prompt assembly. No 0.3, new chart types, remote calls, or Marklang chat support.

## Acceptance
- AC01: All declared recipe versions/types compile; negative patches yield declared diagnostics; generated MCP resources match canonical bytes/values.
- AC02: Document status/date mismatches fail the checker.
- AC03: Helper examples match schema/compiler/profile; legacy non-chat input remains accepted; chat rejects legacy versions; returned values are isolated.
- AC04: Actual OpenUI prompt and A2UI schema contain the matching description; existing host browser regressions pass.

## Failure, compatibility and evidence
No runtime acceptance or revision semantics change. Generation drift fails checks. Existing recipe URIs remain valid. New resources are additive. Rollback reverts helper/descriptions/resources together. No external dependencies or new data limits. Depends on review and SPEC-0031; acceptance evidence is recorded in tasks.

All ACs pass; evidence is mapped in [tasks](tasks.md).
