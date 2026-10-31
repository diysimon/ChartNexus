---
doc_id: spec-0004-spec
version: "0.1"
status: done
updated: 2026-10-30
language: en
---

# COSUI JSON / San spec

[Other language](spec.zh-CN.md)

## Outcome and boundary
Integrate COSUI JSON / San through its actual upstream host with ChartDocument intent and native modes, reusing the existing compiler and runtime. Do not execute model input, fetch arbitrary data, implement another parser, publish packages, or claim unrelated protocol versions.

## Contract, data flow and failure
Host parses its protocol, resolves component data and supplies a complete document to the adapter. The runtime validates, compiles and renders it; errors are surfaced as diagnostics while preserving the last valid chart when the host keeps the component mounted. An incomplete stream must not commit. Selection goes to an explicitly configured host callback; registry data is trusted host input. Existing resource limits apply. Dispose the chart and observers when the host removes the component. Protocol-specific lifecycle, duplicate identifiers and data binding require upstream verification before public API freeze.

## Acceptance and evidence
- AC-01: the real upstream host displays both input modes in a browser.
- AC-02: valid updates replace prior series; incomplete/invalid updates retain last valid chart and report errors.
- AC-03: selection reaches the host; removal disposes resources.
- AC-04: positive, failure and recovery examples, bilingual docs, browser tests and repository gates have recorded evidence.

## Dependencies, release and open questions
Verify exact upstream package/host version, supported custom registration, binding and lifecycle, licenses and bundle cost before implementation. COSUI Marklang follows COSUI JSON; A2UI is independently versioned. SDK availability, streaming semantics, duplicate keys, SSR/hydration and real-model behavior remain open until measured. Adapter removal rolls back integration without core changes. No release is authorized.
