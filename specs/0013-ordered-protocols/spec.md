---
doc_id: spec-0013-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Ordered profiles and stream robustness
[简体中文](spec.zh-CN.md)
## Goal
Extend opt-in host-supplied operation ordering to OpenUI and COSUI JSON while preserving existing document modes; harden host stream buffering and provide model-facing usage guidance. These are ChartNexus profiles, not protocol guarantees.
## Ten work items
1. Add opt-in ordered OpenUI profile with receipts and lifecycle ownership.
2. Add opt-in ordered COSUI JSON profile with receipts and lifecycle ownership.
3. Provide runnable OpenUI ordered host example.
4. Provide runnable COSUI ordered host example.
5. Verify OpenUI ordering, streaming and recovery in a real browser.
6. Verify COSUI ordering and recovery in a real browser.
7. Harden stream buffering and input boundaries.
8. Add targeted stream and ordering regression tests.
9. Update agent-facing diagnostics and usage resources.
10. Synchronize bilingual documentation, manifest and project gates.
## Acceptance and boundaries
Each host supplies operation IDs and captures base revisions before work. Pending, duplicate, stale and failed operations preserve the last valid chart; only successful runtime updates advance revision. OpenUI streaming does not commit before completion. Existing modes retain their behavior. Host callbacks provide receipts, not standard protocol events. Each mounted chart owns its controller. COSUI Marklang, real model streaming, interaction-state preservation, published packages and external integrations are out of scope. Record actual evidence and uncompleted items.

## Evidence
Local Chrome browser tests cover the two ordered profiles and the two legacy profiles; `pnpm check` covers type checking, lint, unit tests, generated resources and demo builds. Real model transport and the other excluded items remain not run.
