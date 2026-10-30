---
doc_id: spec-0002-tasks
version: "0.1"
status: done
updated: 2026-10-30
language: en
---

# Execution evidence

Status: Done. SPEC-0002 completed locally on 2026-10-30; this does not complete protocol adapters or the entire beta roadmap.

- [x] Shared agent tools and bounded renderer (AC-03, AC-04)
- [x] CLI and stdio MCP resources (AC-01, AC-02)
- [x] Process integration and failure tests (AC-01, AC-02, AC-03)
- [x] Bilingual docs and evidence (AC-04)

## Acceptance results
| AC | Result | Evidence |
| --- | --- | --- |
| AC-01 | pass | [CLI child-process tests](../../tests/cli.test.ts): JSON/stdin/file commands, semantic errors, usage/IO exits, size limits, real SVG output, overwrite refusal |
| AC-02 | pass | [MCP process tests](../../tests/mcp.test.ts): official SDK negotiation, five tools, resources, invalid field → valid chart → compile → render → resource read and SHA-256 |
| AC-03 | pass | [Agent/cache tests](../../tests/agent.test.ts): deadline, cancellation, busy/reclaimed capacity, invalid args, host registry, byte limits, expiry/eviction/session isolation; MCP oversized-frame test |
| AC-04 | pass | Canonical resources generation check, strict types/lint, bilingual checker, [integration guide](../../docs/en/agent-integration.md) |

## Executed checks
- `pnpm check`: pass, 43 tests across four files, including 14 new agent/CLI/MCP tests; production demo build passes with the existing full-ECharts bundle-size warning.
- After adding source bin launchers: format, ESLint, TypeScript and all 43 tests passed again. Integration tests now launch those source wrappers and reach compiled entry points.
- `node node_modules/vitest/vitest.mjs run tests/agent.test.ts tests/cli.test.ts tests/mcp.test.ts`: 14 passed on Node 22.22.3 before source-launcher-only changes. pnpm checks use bundled Node 24.19.0.
- `pnpm test:browser`: 3 passed, Chromium 149.0.7827.55 / Playwright 1.64.1. Browser functionality unchanged.
- Offline frozen-lockfile install passed with the populated local store. CLI actually produced `outputs/agent-chart.svg` (5015 bytes); output/store/dist remain Git-ignored.
- `node packages/cli/bin/chartnexus.mjs --help`: clean JSON output. Package-manager `.bin` shims are not established by this local setup; documented commands use Node directly.
- Documentation checker before this evidence update: 32 pairs / 156 local links. Final evidence is checked again before delivery.

## Verification limits
Tests use the official SDK Client and a real local stdio child process, not a native desktop client or live model. No user configuration was changed. No remote transport, A2UI/OpenUI adapter, model benchmark, package publication, commit/push, or remote GitHub CI run is claimed. Source package bin launchers are tested; clean published-tarball installation is not.
