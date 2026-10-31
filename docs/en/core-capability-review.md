---
doc_id: core-capability-review
version: "0.1"
status: assessment
updated: 2026-10-31
language: en
---
# Core capability inventory and task review
[简体中文](../zh-CN/core-capability-review.md)

Baseline: experimental 0.1 workspace on 2026-10-31, including uncommitted changes; this is not a release claim. Evidence: [schema](../../packages/schema/src/chart-document.schema.json), [compiler](../../packages/core/src/index.ts), [native guard](../../packages/core/src/native.ts), [runtime](../../packages/runtime/src/index.ts), [capabilities](../../packages/core/src/capabilities.json), and [tests](../../tests/core.test.ts). A compilable chart type does not imply every option, environment or model is verified.

Evidence: **T** = existing automated test; **P** = targeted `compileChart` probe in this review; **S** = source inspection; **N** = desired functionality absent or task not tested. T/P are not complete product acceptance; browser evidence is stated separately.

This table is the 0.1 review baseline. An experimental 0.2 subset has since been added; see [development](development.md).

## Current capability matrix

| Area | Current 0.1 behavior | Evidence and limits |
| --- | --- | --- |
| Intent charts | bar, line, pie, scatter; bar/line grouping by string field and stacking | T; category x is a string, scatter x is numeric, y is numeric or null; pie values are nonnegative and cannot be grouped |
| Intent settings | x/y, series grouping field, stack and title | S; no orientation, theme, styling, temporal type, aggregation, sorting or unit field |
| Data | Inline or host registry with exact revision; each declared field must occur in every row, missing values explicitly null; no implicit coercion | T; 100 fields and 10000 rows per table; no nested objects |
| Null and ordering | Input order preserved; missing grouped bar/line combinations filled with null; duplicate category within a group rejected | T; no declarative sorting or aggregation |
| Native option | Top level limited to title, legend, grid, xAxis, yAxis, series, dataset, tooltip, color, backgroundColor and animation; series limited to four types | S/T; recursive guard blocks some keys and URL-like strings, disables animation and forces richText tooltip; **nested option semantics are not comprehensively validated** |
| Native nested options | Example line `areaStyle` and pie `radius` compile; nonexistent `notARealOption` is also accepted | P; acceptance is not rendering correctness or a support promise; cross-environment option acceptance not completed |
| Chart state | Full replacement; revision increments after success; invalid updates retain the chart; optional controller checks revisions and IDs | T and limited browser examples; no zoom/legend preservation, stable row IDs or native patch |
| Environments | Browser SVG and Node static SVG; experimental OpenUI, A2UI and COSUI JSON host profiles | S/existing browser tests; remote transport and other SDK versions unverified; Marklang has no ordering controller |
| Themes | No intent theme contract; native color fields can enter the restricted profile | S/P; no presets, theme discovery or accessibility acceptance |
| Budgets | JSON input 1 MiB, depth 32, 50 series, 50000 expanded points, dimensions 4096; SVG output 8 MiB | S; limits are not performance guarantees and combinations can hit earlier limits |

## 28 representative tasks

“Expressible” means the stated case can pass its current path, not that a real model or visual result is verified. “Native candidate” means no known guard prohibits the option; unless marked P it was not probed. This is a design review, not a held-out benchmark. The [20 public synthetic evaluation tasks](evaluation-baseline.md) include reference answers.

| # | Representative task | 0.1 result / evidence | Gap and acceptance needed |
| --- | --- | --- | --- |
| 01 | Monthly revenue bar | Intent expressible T | Check labels, values and narrow layout |
| 02 | Monthly revenue line | Intent expressible T | Verify continuous rather than categorical time |
| 03 | Category share pie | Intent expressible T | Test zero total and labels |
| 04 | Two-value scatter | Intent expressible T | Dense-point legibility |
| 05 | Regional grouped bars | Intent expressible T | Group ordering and stable identity |
| 06 | Regional stacked bars | Intent expressible T | Negative stacking semantics |
| 07 | Horizontal categorical bar | Intent cannot express P; native candidate N | Define orientation and axes |
| 08 | Area-filled line | Intent cannot express S; native compiles P | Rendering and style semantics unverified |
| 09 | Donut | Intent cannot express S; native compiles P | Radius, labels and visual checks |
| 10 | Temporal line | Intent lacks temporal P | Date vs instant, timezone and sorting |
| 11 | Revenue and growth dual-axis | Intent cannot express S; native candidate N | Multiple measures, axis binding and units |
| 12 | Bar/line combination | Intent cannot express S; native candidate N | Mixed series and data alignment |
| 13 | Missing grouped month | Null alignment T | Explain absent row vs explicit null |
| 14 | Numeric string | Rejected T | Only explicit conversion with provenance |
| 15 | Sum duplicate categories | Ambiguity rejected T | Explicit aggregation, grouping and provenance |
| 16 | Sort by descending amount | Intent cannot express P | Direction, stability and null order |
| 17 | Currency/percentage units | No intent unit P | Precision, units, scale; no implicit multiplication |
| 18 | Dark theme | No intent theme P | Palette, contrast, export and overrides |
| 19 | Custom series color | No intent field S; native color accepted by top-level guard S | Safe colors and precedence |
| 20 | Data labels and legend | No intent fields S; native candidate N | Overlap and readability checks |
| 21 | Funnel | Intent and native series unsupported S | Order, negatives and transformations |
| 22 | Heatmap | Intent and native series unsupported S | Two categorical axes, values and color semantics |
| 23 | Radar | Intent and native series unsupported S | Units, ranges and missing values |
| 24 | Tree/Sankey/graph | Intent and native series unsupported S | Hierarchy/graph data, cycles and budgets |
| 25 | Map | Native map/geo forbidden S | Geography resources, security and licensing |
| 26 | Host data reference | Exact revision T | Availability and data disclosure boundary |
| 27 | Preserve zoom and legend | Full replacement gives no preservation guarantee S | Explicit state policy and invalidation |
| 28 | Stable identity on click | Positional index + revision S | Row IDs, aggregate provenance and event privacy |

## Priority findings

1. **P0 native semantic-validation gap:** nonexistent nested fields can pass; publish machine-readable validation levels and an unknown-field policy so agents do not mistake compile success for correctness.
2. **P0 data semantics:** temporal, units, aggregation, sorting, null and absent rows need explicit contracts without silent coercion or invented values.
3. **P1 expressiveness and defaults:** orientation, area, donut, labels, legend and color need declarations consistent with rendering.
4. **P1 state and identity:** current operations are complete documents with bounded session deduplication; selection is positional, not stable identity.
5. **P1 theme and environment:** version presets and override order; specify font/locale/size conditions and verify DOM and SVG separately.
6. **P2 evidence and evaluation:** the 20 public tasks are not held out; add numeric invariants, visual review, performance and unseen data.

See the [0.2 proposal](core-protocol-0.2.md). Full model, browser and visual evaluations were not run for all 28 tasks in this review.

Reproduce the ten compiler probes with `pnpm build && node scripts/audit-core-contract.mjs`; the script asserts the observed acceptance/rejection and does not test rendering. Result on 2026-10-31: 10/10 expected outcomes.
