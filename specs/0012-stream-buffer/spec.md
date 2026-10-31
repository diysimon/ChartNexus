---
doc_id: spec-0012-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Streamed document buffering
[简体中文](spec.zh-CN.md)
## Goal and boundary
Enable a host to buffer decoded JSON document fragments without publishing partial documents to the A2UI data model. Use the existing ordered profile to validate and render complete updates. This helper does not implement model, network, A2UI framing, or transport cancellation.
## Contract
Create a single-use buffer with a unique operation ID and base revision captured when work starts. Append decoded text, then explicitly finish only when the transport has completed successfully. Finish parses exactly one JSON value and returns a complete operation; the runtime validates the document before rendering. Cancellation, errors and oversize input discard buffered data. Limits: 1 MiB UTF-8 document, 16,384 fragments. The host must decode bytes incrementally and abort/close its own transport. Failed and cancelled buffers are terminal; create a new buffer to retry. A stale completed operation is still rejected by the ordered controller.
## Acceptance
Unit tests cover fragments, Unicode boundaries, size, invalid JSON, cancel and terminal behavior. A browser test uses a real ReadableStream with the A2UI processor, demonstrating partial, completion, cancellation and malformed recovery while preserving the prior chart. No real model or remote transport is claimed.
## Rollback
Remove this optional host helper and demo; existing chart and adapter contracts remain intact.

Evidence: local Chrome A2UI browser tests 3/3; stream buffer unit tests included in `pnpm check`. Remote/model transport: not run.
