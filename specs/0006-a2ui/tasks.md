---
doc_id: spec-0006-tasks
version: "0.1"
status: done
updated: 2026-10-30
language: en
---

# A2UI standard tasks

[Other language](tasks.zh-CN.md)

- [x] Pin upstream version and host integration mechanism.
- [x] Implement adapter and actual-host demo.
- [x] Verify AC-01–04 and record browser, test and size evidence.
- [x] Synchronize bilingual docs and model recipes.



## Evidence (2026-10-30)
- AC-01–03: pass for the chart profile using actual upstream host in Chromium 149.0.7827.55, Playwright 1.64.1; see the matching browser test in `tests/browser`. Covers both input modes, replacement, invalid/incomplete chart input, callbacks and removal. Marklang additionally tests incomplete source and missing/duplicate data.
- AC-04: pass: `pnpm check` (43 unit tests, production build, types/lint/docs) and `pnpm test:browser` (7 tests). See [integration guide](../../docs/en/genui-integrations.md) for versions, model examples and limitations.
- Not-run: real model, real streaming transport, other host/SDK versions, SSR/hydration, external clean installation, publication and remote CI. Host controls streaming completeness and trust; Marklang does not sanitize HTML.
