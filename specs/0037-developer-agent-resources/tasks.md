---
doc_id: spec-0037-tasks
version: "0.2"
status: done
updated: 2026-11-01
language: en
---

# Execution and evidence

[简体中文](tasks.zh-CN.md)

- AC-01: bilingual [boundary](../../docs/en/product-boundary.md), [chart catalog](../../docs/en/chart-catalog.md) and [agent guide](../../docs/en/agent-guide.md).
- AC-02: [quick start](../../docs/en/getting-started.md) and [browser example](../../examples/playground/quickstart.ts), including valid, invalid and recovery cases.
- AC-03: add bilingual guidance to the generated index, JSONL and existing MCP resource; check discovery, contents and hashes.
- AC-04: update README and model entry; run local gates and record not-run items.

## Verification

- AC-01: pass. Bilingual boundary, chart catalog, developer quick start and agent guide are in the docs manifest. All eleven types have 0.3 recipes; `tests/resource-inventory.test.ts` checks positive/negative cases and SVG rendering.
- AC-02: pass. `tests/browser/quickstart.spec.ts` verifies initial rendering, malformed JSON, unknown fields, last-chart retention and recovery in local Chromium. The isolated browser suite passed 47/47 before the final agent-only resources were added; the example code was unchanged afterward.
- AC-03: pass. A real MCP stdio client reads bilingual guides, root AI indexes, the six new 0.3 recipes and 22 example pairs. Resource tests check source, license, hashes, faithful inputs, chart coverage and trusted map prerequisites. The final resources were repacked and all eleven packages plus MCP passed in isolated Node 22 and Node 24 consumers. The documented installed-consumer Vite command and browser chart were also checked manually.
- AC-04: pass. `pnpm check` completed generation, bilingual docs, formatting, lint, types, 259 tests and demo build; README has bilingual entry points. The guide's Node retrieval example was executed.

Not run in this task: production host/mobile devices, remote CI, model training or npm publication. The host owns model invocation and factual correctness; these are not SDK gates. Private data and previous held-out outputs were not added to public resources.
