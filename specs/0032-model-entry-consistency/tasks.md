---
doc_id: spec-0032-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
[Other language](tasks.zh-CN.md)

# Resource and entry consistency evidence

- AC01–AC02 pass: [inventory tests](../../tests/resource-inventory.test.ts), 13 cases. Eleven canonical recipe entries cover all seven supported intent types, negative patches and a repair example; package/MCP values match canonical resources. Isolated fixtures reject date/status/body-only frontmatter drift.
- AC03–AC04 pass: [input contract tests](../../tests/input-contract.test.ts), 6 cases. Chat/non-chat and ordered/plain combinations compile, preserve legacy acceptance, reject legacy chat, isolate returned values, and verify the actual upstream OpenUI-generated prompt and A2UI property schema. COSUI exports the same helper for host prompt assembly.
- [MCP tests](../../tests/mcp.test.ts) compare discovered URI sets and retrieval records to the generated inventory, including newly rendered artifacts, instead of fixed counts.

## Gates and limits

`pnpm check`: pass, 176 tests / 24 files, 20 public reference self-checks, demo build. Installed Chrome browser suite: 21/21 pass. Node 22.22.3, pnpm 11.25.0, Chrome 156.0.8078.74. See [machine-readable evidence](verification.json). Existing large-bundle build warning remains an A17 task.

These are deterministic local and real local SDK/stdio checks. Browser Ollama responses are mocked. No new live-model evaluation, remote CI, all-package installation or publication was performed. M1–M4 remain open; no Git commit/push was performed.
