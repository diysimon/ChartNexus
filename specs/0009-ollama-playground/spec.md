---
doc_id: spec-0009-spec
version: "0.1"
status: done
updated: 2026-10-31
language: en
---

# Local Ollama chart playground

[Other language](spec.zh-CN.md)

## Outcome and boundaries
A localhost HTML playground lists installed Ollama models, sends user requests to the selected local model, validates ChartDocument and renders ECharts with diagnostics and inspectable model output. Existing unfinished evaluation work is preserved. It does not execute model code, directly contact remote model services or claim MCP/GenUI integration; selected Ollama cloud models may send data elsewhere.

## Design
A dedicated localhost Vite development server offers only model listing and chart generation routes, constrained to same-origin localhost requests and the fixed `127.0.0.1:11434` Ollama endpoint. Request and response sizes and duration are bounded; only known fields are accepted, no model-configured URLs. The system prompt supplies the canonical schema and capabilities; optional previous valid document supports edits. Browser validates before commit, keeps the last valid chart on failures, exposes raw output and diagnostics, supports cancellation and disposal, and never injects model HTML. JSON and single complete JSON fences are accepted.

## Acceptance
- AC-01: With a running local model, user selects it, submits a chart request and sees rendered data plus actual model output.
- AC-02: Invalid output, unavailable service and cancelled/stale request show accurate status and do not replace the prior valid chart.
- AC-03: Localhost-only routes reject cross-origin/invalid and oversized requests; both input modes use existing validation.
- AC-04: Bilingual usage, automated tests, real Ollama/browser evidence and limits are recorded; existing files/changes are preserved.

## Limits and rollback
Local development only, not a public server. Existing chart limits and trusted host registry rules apply. No model benchmarks, provider-wide compatibility, streaming or protocol event claims. Removing the dedicated server/page restores the previous state.

## Missing data feedback (2026-10-31)
A model-returned empty object shows a plain-language missing-data message explaining that online lookup is unavailable; preserve the previous chart. It is an indeterminate empty response, not proof of the exact model reasoning.
