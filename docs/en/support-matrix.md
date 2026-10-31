---
doc_id: support-matrix
version: "0.2"
status: experimental
updated: 2026-10-31
language: en
---
# Verified support matrix

[简体中文](../zh-CN/support-matrix.md)

Status is dimension-specific. All profiles are experimental, all 11 packages private/unpublished; none imply upstream endorsement. [M4 evidence](../../specs/0036-trial-distribution/verification.json) distinguishes installed artifacts, workspace tests and version-specific remote/model results.

| Surface | Exact tested baseline | Evidence / limit |
| --- | --- | --- |
| Native JSON | Schema 0.1, bar/line/pie/scatter | Core/browser regression; restricted option profile, not arbitrary ECharts |
| Intent | 0.1 four types; 0.2 seven; 0.3 eleven | [Contracts/migration](contracts-03.md), [chart tests](../../tests/chart-expansion.test.ts), [semantics](../../tests/intent-semantics.test.ts) |
| Themes/detail | light/dark, transparent chat default, five levels | [Chat host quality](chat-host-quality.md); bounded supported overrides |
| Maps | Host-owned Polygon/MultiPolygon WGS84 assets | [Map contracts](chart-expansion-03.md); synthetic fixture, no online maps/GIS certification |
| Node distributions | Node 22.22.3 / 24.22.1, ESM, pnpm 11.25.0, macOS arm64 / Linux x64 | Eleven packed packages installed independently; CLI/MCP/worker/resources/type-export resolution pass |
| Browser distributions | Chrome156.0.8078.74 / Chromium156.0.8078.4; ECharts 6.1.0 SVG | 45 tests from each isolated Node consumer; other browsers/devices not-run |
| OpenUI | react-lang 1.0.2 / React 19.2.4 / zod 4.3.6 | Real pinned Renderer chart component; [OpenUI tests](../../tests/browser/openui.spec.ts) and [four new types](../../tests/browser/chart-expansion.spec.ts); not every OpenUI feature |
| A2UI | react 0.9.1 / web_core 0.9.2 / React 19.2.4 | Actual v0.9 catalog/surface; [tests](../../tests/browser/a2ui.spec.ts), expansion host tests; not all catalogs/versions |
| COSUI JSON | cosmic-dynamic-ui 1.0.0 / San 3.15.5 | [Actual host tests](../../tests/browser/cosui.spec.ts), expansion host tests |
| COSUI Marklang | Marklang 1.0.1 | [Actual host tests](../../tests/browser/marklang.spec.ts); whole-document reset semantics |
| Agent / MCP | SDK 1.32.2, stdio | Installed official-client negotiation/tool/resource/SVG round trip; remote/desktop MCP not-run |
| Local models | Four local Ollama model digests frozen in run | Audited replacement host-catalog holdout running; old overlapping corpus rejected; no every-model or95% claim |
| CI / release | New separate required jobs | [CI41207042168](https://github.com/diysimon/ChartNexus/actions/runs/41207042168) passes at7345f34; final report revision pending; npm publication not-run |

Installed host tests cover representative existing charts plus each of radar/tree/Sankey/map in all four pinned hosts. This is not an exhaustive Cartesian product of every option × host × chart. Source/compiled-value tests and SVG tests cover deterministic semantics separately. Memory/latency figures are local observations, not cross-device guarantees. For repeatable commands and evidence boundaries see [trial/distribution guide](trial-distribution.md).
