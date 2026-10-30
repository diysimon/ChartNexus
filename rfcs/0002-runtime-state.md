---
doc_id: rfc-0002-runtime-state
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: en
---

# Runtime and state

[Other language](0002-runtime-state.zh-CN.md)

Decision status: experimental subset. Full operation semantics remain planned.

## Proposal
One runtime owns one DOM container and chart ID. Compile before rendering. Replace options with notMerge to remove stale series. Only successful renders advance revision. Validation failure keeps prior output. Rendering failure attempts to restore the previous plan; recovery failure requires remounting. ResizeObserver and dispose own cleanup.

## Alternatives and limits
Default ECharts merging risks stale series. Full replacement sacrifices zoom/legend preservation, which is explicitly deferred. A separate operation controller with baseRevision, operationId, and deduplication will be designed before protocol updates. Current updates are synchronous and ordered by the caller. Selection identity is positional plus revisions; do not claim stable row IDs.

## Validation
Real browser tests cover mode/type switching, series replacement, invalid update preservation, clicks, resizing, and disposal. SSR is separately tested and does not prove interactivity. Hardware deadlines are not provided by synchronous rendering.
