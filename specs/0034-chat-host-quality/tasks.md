---
doc_id: spec-0034-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
# M2 execution and evidence

[简体中文](tasks.zh-CN.md)

## Completed work

- A06/A07: pure dimension-aware presentation, shared light/dark tokens, five detail levels, explicit narrow-layout fallback, complete source/rendered tables, keyboard legend controls and SVG title/data metadata.
- A08/A09: pending-size coordinator, transactional Marklang staging, keyed selections and compatible legend-state retention. Resize uses the committed snapshot without advancing revision; render failure preserves the previous state.
- A10/A11: neutral JSON buffer, strict Ollama NDJSON framing/terminal/cancel handling, stale-result protection and at most two repair attempts; pinned OpenUI, A2UI, COSUI JSON and Marklang fixtures.

## Acceptance evidence

| AC | Result | Evidence |
| --- | --- | --- |
| AC01 | pass | [presentation tests](../../tests/presentation-layout.test.ts): seven types × two themes × five levels × four widths × three heights; [browser geometry tests](../../tests/browser/host-quality.spec.ts) and long bilingual/dual-axis/heatmap samples fit or explicitly fall back; resize keeps revision |
| AC02 | pass | Same tests: text ≥4.5:1 and essential graphics ≥3:1 on declared surfaces; raw null/units/keys and SVG metadata preserved; browser keyboard table/legend access |
| AC03 | pass | Host quality browser tests: hidden recovery, disposed pending mounts, second-stage render failure retains old Marklang nodes; same-frame hide/update/show regression restarts size observation |
| AC04 | pass | Contracts and host quality tests: keyed reorder, legend retention/deletion/new visibility, incompatible unit reset, reserved JavaScript names and injected resize failure |
| AC05 | pass | [decoder tests](../../tests/ollama-stream.test.ts), [playground browser tests](../../tests/browser/ollama.spec.ts), existing ordered-controller tests and [real local streaming evidence](ollama-verification.json) |
| AC06 | pass | Real pinned SDK browser suites for OpenUI/A2UI/COSUI JSON/Marklang, ordered profiles and shared lifecycle; [matrix and explicit unsupported cells](../../docs/en/chat-host-quality.md) |

## Verification and limits

[Machine-readable evidence](verification.json): `pnpm check` passed 207 tests/28 files and 20 reference self-checks; full browser suite passed 33 tests. The initial final regression caught a same-frame Marklang visibility race (32 passed/1 failed); restarting observation and a deterministic regression fixed it before the 33/33 rerun. Light layout and dark heatmap screenshots were inspected locally; ignored screenshots/logs are not required repository assets. Automated combinations plus representative visual inspection do not mean every combination was manually inspected.

Real same-origin proxy → local Ollama → strict decoder → compiler: qwen3.5:9b Q4_K_M, one synthetic case, 127 fragments, 10755ms, first attempt preserves [3,5]; a separate live request cancellation passed. Browser Ollama failure/repair cases use mocked transport. This is not a held-out benchmark or every-model claim.

Only declared light/dark host surfaces have contrast evidence. Transparent charts require an appropriate host background; broad WCAG certification, arbitrary fonts/backgrounds, remote hosts, hydration and mobile certification are unverified. Marklang rejects ordered envelopes and resets state across whole-document swaps; it requires trusted/sanitized Markdown. Zoom retention and non-Ollama framing/SSE are unsupported. M3/M4 remain open; no commit, push or publication.
