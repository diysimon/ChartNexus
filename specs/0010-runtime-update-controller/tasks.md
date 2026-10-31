---
doc_id: spec-0010-tasks
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---

# Ordered runtime updates

[Other language](tasks.zh-CN.md)

- [x] Implement bounded revision/idempotency controller without changing existing runtime contract.
- [x] Test out-of-order, cancellation, duplicate conflict, expiry, size and disposal.
- [x] Synchronize bilingual docs, diagnostics and RFC; record actual evidence.
- [x] Run project gates.

Evidence: `pnpm check` passed (60 tests, 54 bilingual pairs, 290 links; offline evaluation 20/20). Browser and protocol integration for this controller: not run.
