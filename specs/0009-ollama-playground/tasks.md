---
doc_id: spec-0009-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: en
---

# Local Ollama chart playground

[Other language](tasks.zh-CN.md)

- [x] Implement restricted local server and interactive page.
- [x] Verify failures, cancellation, input bounds and real browser + Ollama generation.
- [x] Update bilingual docs, run gates and record evidence.

## Evidence (2026-10-31)
- AC-01: real local Ollama `qwen3.5:9b` + Chromium 149: user prompt generated bar chart values 120/180/150; a follow-up using the previous document generated a line chart with those values. Screenshot: ignored `test-results/ollama-live.png`.
- AC-02/03: `tests/browser/ollama.spec.ts` covers failed JSON, cancellation, unavailable service and native option; `tests/ollama-proxy.test.ts` covers same-origin, fixed endpoint, request limit, malformed upstream, timeout and invalid prior chart. Full browser suite: 10 passed.
- AC-04: `pnpm check`: 55 tests, generated resources, 52 bilingual pairs and build. No remote model, cloud Ollama configuration or public deployment was tested.

- Missing-data feedback: browser test covers `{}` and preservation of the previous chart; `pnpm check` passed. Online lookup remains unimplemented pending data-source choice.
