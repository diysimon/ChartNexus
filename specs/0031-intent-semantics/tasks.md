---
doc_id: spec-0031-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
[Other language](tasks.zh-CN.md)

# Semantic correction evidence

- AC01–AC04 pass: [core/SVG/Agent tests](../../tests/intent-semantics.test.ts), 10 cases, plus [browser tests](../../tests/browser/intent-semantics.spec.ts), 3 cases. Covers 0.1/0.2, zero/positive/empty, donut, aggregation/registry mapping, reorder, colliding labels, native/funnel isolation, actual SVG arcs and independent legend toggles.
- AC05 pass: capabilities, informational notice, canonical zero/empty-group recipes, model-entry and development docs synchronized. Agent validate/compile and real MCP stdio regressions pass.
- Browser transitions restore host ARIA attributes when leaving no-share or disposing; invalid updates preserve the current valid chart.

## Gates and limits

`pnpm check`: pass, 176 tests / 24 files, 20 public reference self-checks, demo build. Installed Chrome browser suite: 21/21 pass. Node 22.22.3, pnpm 11.25.0, Chrome 156.0.8078.74. See [machine-readable evidence](verification.json). Existing large-bundle build warning remains an A17 task.

These are deterministic local and real local SDK/stdio checks. Browser Ollama responses are mocked. No new live-model evaluation, remote CI, all-package installation or publication was performed. M1–M4 remain open; no Git commit/push was performed.
