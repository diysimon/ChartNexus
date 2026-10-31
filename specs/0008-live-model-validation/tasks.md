---
doc_id: spec-0008-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: en
---

# Local model and MCP validation

[Other language](tasks.zh-CN.md)

- [x] Implement a bounded local Ollama + real MCP runner and metadata.
- [x] Verify negative paths and run a real synthetic-data pilot.
- [x] Record bilingual instructions and actual evidence without claiming a benchmark.
- [x] Run applicable project checks.

## Evidence (2026-10-31)
- AC-01/02: real local Qwen 3.5 9B, four public tasks, 4/4 after one fenced-JSON normalization; two model-initiated validate_chart calls and three host-initiated SVG checksum validations. A two-task Mistral pilot returned 0/2 with invalid candidate formats. See [pilot record](../../docs/en/local-model-pilot.md).
- AC-03/04: `pnpm check`: 52 tests, generated resource checks, bilingual links, types/lint and demo build. Mock tests cover invalid JSON, unavailable local model, output conflict, unknown task, tool limits, tool allowlist and artifact checksum. Browser tests not rerun for this Node-only change. Remote models, desktop MCP, independent held-out tasks and repeated trials: not-run.
