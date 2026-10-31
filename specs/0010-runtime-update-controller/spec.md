---
doc_id: spec-0010-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---

# Ordered runtime updates

[Other language](spec.zh-CN.md)

## Goal and scope
Add an optional session-scoped update controller to the existing runtime, protecting explicit operations from stale async results and duplicate delivery. Preserve native and intent inputs, host registry semantics, existing chart lifecycle and invalid-update preservation. No implicit protocol mapping, no promise of remote durability, zoom/legend preservation or stable row IDs.

## Contract and data flow
A controller wraps an existing ChartRuntime and accepts JSON operations with operationId, baseRevision, complete and, for complete updates, document. Capture baseRevision before starting async work; commit only if it matches runtime.getRevision. Partial updates return pending without rendering or caching. For successful operations, a bounded session cache returns a duplicate receipt for the same ID and canonical JSON payload including registry; different payload under the same ID fails. Failures are not cached, preserving retries. Respect pre-aborted AbortSignal before any commit; synchronous runtime updates cannot be interrupted mid-render. Dispose the controller to clear its cache; the host separately owns runtime disposal.

Cache capacity 128 entries, 4 MiB signatures, 10-minute TTL. Evicted/expired IDs have no permanent deduplication; revision checks remain authoritative. Registry is trusted host input and is included in the 1 MiB fingerprint inspection budget. Invalid JSON, duplicate conflict, stale revision, disposed and cancelled operations return diagnostics, not exceptions. Protocol adapters must opt in and provide correct revisions; existing adapters do not magically gain ordering.

## Acceptance
- AC-01: complete valid updates apply once; same operation retry produces duplicate without rendering; changed payload conflicts.
- AC-02: stale/out-of-order, partial, cancelled and invalid updates do not replace last valid chart or advance revision.
- AC-03: cache capacity/expiry, disposal and registry behavior have deterministic tests; distinct operation ownership and memory limits are documented.
- AC-04: bilingual docs, RFC, tests and engineering gates pass. Browser integration only claimed if explicitly tested.

## Release/rollback
Additive experimental API; remove controller without modifying core schema. A later change must integrate explicit protocol revisions and interaction state; this stage is not full streaming transport.
