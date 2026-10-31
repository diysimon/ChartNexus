---
doc_id: spec-0011-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# A2UI ordered chart updates
[简体中文](spec.zh-CN.md)
## Problem and goal
The A2UI chart component renders complete documents but does not protect asynchronous host updates from stale delivery. Add an explicit opt-in profile using the existing controller and real A2UI data binding.
## Design and boundaries
The host selects ordered mode and supplies a JSON-encoded operation in the existing document binding. It captures baseRevision before asynchronous work, creates unique operation IDs and supplies complete operations; partial operations have no document. The component reports receipts and diagnostics through host callbacks. This is a ChartNexus profile, not an A2UI protocol field or automatic ordering of incoming messages. Existing document mode stays unchanged. Controller ownership follows component mount; the host owns transport, frame buffering, cancellation and revision capture. No network or state preservation is added.
## Acceptance and evidence
Browser tests must exercise the official A2UI processor and React surface, out-of-order operations, duplicates, incomplete operations, invalid updates, recovery and disposal; unit tests remain required. Record actual results after verification.
## Dependencies and rollback
Depends on runtime controller and existing A2UI profile. Remove opt-in mode to roll back; old document mode remains compatible. Stream transport and cross-protocol ordering remain future work.

Browser evidence: official A2UI host and legacy profile passed in local Chrome (2 tests). Cancellation before commit is covered by controller unit tests; transport cancellation was not tested.
