---
doc_id: spec-0035-spec
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
# M3: bounded radar, tree, Sankey and map

[简体中文](spec.zh-CN.md)

## Problem, goals and baseline
M1/M2 pass 207 unit/integration and 33 browser tests. Four 0.3 branches are reserved, not renderable. Implement A12–A15 from the technical RFC as complete chart paths without expanding native mode, factual retrieval, treemaps or online maps.

## Design and compatibility
Retain 0.1/0.2 and seven existing types. Independent 0.3 compilers resolve validated tables, then produce data-preserving options, typed mark identities and full accessible tables. Radar: 3–8 distinct indicators with explicit finite ranges, 1–6 uniquely named items; reject null/out-of-range. Tree: one root, unique IDs, valid parents, connected acyclic graph, ≤1000 nodes/depth16, default initial expansion depth2. Host expansion retained by ID/topology; SVG is an explicitly labelled collapsed overview with full source metadata. Sankey: ≤200 nodes/1000 edges, DAG, no self/duplicate edges, finite nonnegative weights; zero links remain in accessible data; report incoming/outgoing/difference without conservation assumptions. Map: host registry only, exact region keys, explicit domain, null/missing color. Core consumes metadata only; shared ECharts bridge validates and registers Polygon/MultiPolygon assets with id/revision/content hash/license/provenance/WGS84. Never fetch geometry or accept it from tool arguments. Limits: ≤5MiB/20000 points/1000 regions per asset, ≤8 registrations/20MiB source geometry per ECharts instance namespace; fail at capacity, no overwriting. Worker receives the same asset snapshot and validates it independently. Existing aggregate 1MiB source budget applies to resolved tables.

## Failure, lifecycle and resources
Structural/topology/range/asset errors produce stable diagnostics before replacing a chart. Rendering failures preserve committed data/revisions. Map registration is bounded and global because ECharts cannot unregister; incompatible assets never overwrite. No code execution, network or model SDK enters core. Diagram labels are retained in tables even when bounded layout suppresses or truncates them. New graph selection identities are node/edge/region, not fabricated positional identity. No new runtime dependencies beyond the existing ECharts peer; add one shared workspace bridge to prevent browser/SVG registration divergence.

## Acceptance
| ID | Observable outcome | Evidence |
| --- | --- | --- |
| AC12 | Radar ranges/units/identity preserved; invalid range/null/count rejected; browser/SVG, two themes/five levels | pass — [evidence](tasks.md) |
| AC13 | Tree rejects invalid topology/depth; duplicate labels allowed; collapse preserves data and compatible state; stable node events; explicit overview export | pass — [evidence](tasks.md) |
| AC14 | Sankey rejects invalid topology/weights/endpoints; zero edges retained in full table; stable node/edge IDs, duplicate labels safe; browser/SVG | pass — [evidence](tasks.md) |
| AC15 | Authored two-region map browser/SVG/worker equivalence; metadata/hash/geometry/capacity validation; null/absent regions distinct from zero; no network | pass — [evidence](tasks.md) |
| AC16 | Eleven chart resources/schema/capabilities/recipes/diagnostics and bilingual docs agree; old suites pass; no M4 benchmark/publication claims | pass — [evidence](tasks.md) |

## Tasks, release and rollback
Execute radar → tree → Sankey → map, with tests and resources per path. Update paired docs and manifest; link tasks/evidence. Remain unpublished experimental 0.3. Rollback disables individual new capabilities without rewriting old documents. No commit/push/release requested. Open design questions: none; measured implementation limits and failures must be recorded.
