---
doc_id: spec-0003-tasks
version: "0.1"
status: done
updated: 2026-10-30
language: en
---

# OpenUI integration tasks

[简体中文](tasks.zh-CN.md)

- [x] Investigate upstream API and select SDK baseline.
- [x] Implement adapter and runnable real Renderer host.
- [x] Verify AC-01–04 with browser and repository checks.
- [x] Record evidence, limitations and bilingual guidance.

## Evidence (2026-10-30)
- AC-01–03: pass, `pnpm test:browser`; Chromium 149.0.7827.55, Playwright 1.64.1, four browser tests including actual OpenUI Renderer, two input modes, invalid JSON/field recovery, streaming retention, selection and unmount. The demo host retains the committed response during streaming.
- AC-04: pass, `pnpm check`: 43 unit tests, lint, strict types, generation, bilingual docs, production build. OpenUI demo chunk 358.11 kB / 110.87 kB gzip; shared ECharts chunk 1260.80 kB / 413.71 kB gzip. Browser tests are a separate command.
- Not-run: live model, standard A2UI, COSUI, SSR/hydration, clean external install, npm publication and remote CI. No claims beyond the tested OpenUI Lang React profile.
