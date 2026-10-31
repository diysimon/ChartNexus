---
doc_id: spec-0031-spec
version: "0.1"
status: done
updated: 2026-10-31
language: en
---
# Intent share semantics and unambiguous groups
[简体中文](spec.zh-CN.md)

## Scope and evidence
Implement A02 / F01–F02 from the review. Zero pie values currently produce equal sectors and empty group values can collide with the measure name. Fix existing 0.1/0.2 intent paths, including donut, without altering native mode or adding chart types.

## Contract and design
Pie series explicitly disable zero-sum sectors and empty placeholder circles. Nonempty all-zero pie/donut has optional RenderPlan.dataState `no-share`, a nonfatal NO_SHARE_DATA notice, visible subtitle and ARIA description. Empty pie has dataState `empty` and no no-share notice; positive data has neither exceptional state. Data and row/aggregate identity are unchanged. Chat minimal may hide the supplied title but must retain the no-share explanation. Funnel's reuse of pie compilation must not inherit pie-only properties or no-share semantics.

Grouped series receive an ID derived from group field, raw group value and measure field. Names preserve nonempty raw values. The empty group displays `(empty)` or the first unused `(empty) [n]` starting at 2, choosing against all raw group values independent of row order. Optional seriesMetadata records ID, group field, original value and display name. Sorting/reordering preserves IDs for the same semantic series; changing group/measure fields changes them. Existing grouped ECharts IDs change; callers must not persist old IDs across compiler versions. Events remain current positional/aggregate contracts; stable row IDs are not introduced.

Schema input shapes stay unchanged. Output metadata is additive. Core owns semantics; browser/SVG use the same option. Agent validation forwards notices/state. Shared info messages are English and hosts may localize by notice code. Preserve null rejection for pie and all native behavior. Resource limits remain unchanged; label disambiguation is bounded by the 50-series budget.

## Acceptance
| ID | Outcome | Verification | Status |
| --- | --- | --- | --- |
| AC01 | Zero pies/donuts have no nonzero sectors, positive data still renders, empty differs from zero | Core and actual SVG tests, browser transitions | pass |
| AC02 | Data, input, row mapping, aggregation metadata and registry revision preserved | Semantic tests across versions/variants | pass |
| AC03 | Empty/colliding labels are unique, original names recoverable, IDs stable on reorder | Core plus independent browser legend toggles | pass |
| AC04 | Native and funnel behavior does not acquire pie-only semantics | Regression tests | pass |
| AC05 | Agent outputs, capabilities, examples and bilingual docs agree | Agent tests and full gates | pass |

## Tasks, rollback and completion
See [tasks](tasks.md). Rollback restores prior compiler behavior without modifying user documents; known misleading zero-share behavior would return, so prefer a forward fix. No publication or Git action is included. Acceptance passed; see the linked task record and verification.json.
