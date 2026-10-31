---
doc_id: core-protocol-0.2
version: "0.1"
status: proposal
updated: 2026-10-31
language: en
---
# ChartDocument 0.2 core protocol proposal
[简体中文](../zh-CN/core-protocol-0.2.md)

This is a **design proposal**, not an implemented schema or final standard; names and examples require review before implementation. The [capability and task review](core-capability-review.md) supplies evidence. It does not authorize breaking the existing 0.1 implementation or claim that any UI protocol adopts these fields.

**Implementation update:** A limited experimental 0.2 intent subset now exists for horizontal bars, area lines, donut pies and versioned light/dark presets. The remainder of this document is still a proposal; native 0.2, restricted calendar-date, unit, sorting and explicit aggregation subsets are implemented; explicit offset-bearing instants are implemented; named timezones remain unimplemented. See [development](development.md).

A separate opt-in `native-strict-basic-0.1` validation subset is implemented; default 0.1 native compilation remains partially guarded. See [development](development.md).

## Design decisions

- Retain `mode: intent` and `mode: echarts`; do not constrain models to one simplified chart language. Core accepts JSON, executes no code, uses no network and does not depend on host language or current time.
- Separate four layers: the **document** describes chart, data and presentation intent; **operations** update an instance; the **rendering environment** supplies dimensions, locale, fonts and registered themes; **protocol adapters** map outer data models and events. The host controls access to data and external resources.
- Capability profiles must be discoverable by chart, field, option, output and validation level. Schema validity, semantic validation, rendering and task correctness are separate outcomes.
- Retain source input unchanged and produce a separate plan recording schema/profile, compiler version, data revision, theme version and explicit environment. Do not treat ECharts defaults as explicit user intent.

## Proposed data and chart contract

| Area | Candidate 0.2 principle | Rules needing acceptance |
| --- | --- | --- |
| Fields and data | Keep inline/reference mutually exclusive; candidate field metadata includes type and unit; only the host resolves references | Preserve values and row order; exact reference ID/revision; unknown fields fail |
| Time | Distinguish calendar dates and instants; instants use explicit offset or timezone | Unambiguous parsing, explicit sorting; never guess machine timezone |
| Quantities and units | Separate display unit, underlying value and scale; formatting cannot alter values | Explicitly declare whether percentages use 0–1; no implicit numeric string conversion |
| Missing values | Distinguish explicit null, absent row and zero; permit only documented alignment behavior | Preserve numbers; generated gaps traceable |
| Transforms | Declare sorting and aggregation explicitly; neither is implicit by default | Finalize sum/count/mean scope, null and stable sorting; retain aggregate provenance |
| Charts | Extend four current types first with orientation, area/donut variants, labels, legend and a multiple-measure design | Separate type and variant; no implicit axis/data remapping; declare each capability profile |
| Native mode | Retain JSON option entry; identify `guarded` and more strictly validated subsets | Guarded passthrough is not full ECharts semantic validation; dangerous features remain rejected |

The following example uses the implemented 0.2 intent subset:

```json
{
  "schemaVersion": "0.2",
  "id": "sales",
  "mode": "intent",
  "data": { "kind": "inline", "fields": ["month", "revenue"], "rows": [{ "month": "Jan", "revenue": 120 }] },
  "chart": { "type": "bar", "orientation": "horizontal", "encoding": { "x": { "field": "month", "type": "ordinal" }, "y": { "field": "revenue", "type": "quantitative" } } },
  "presentation": { "theme": { "id": "light", "version": "1" }, "legend": { "show": true } }
}
```

The meaning of x/y in horizontal orientation remains open. One candidate keeps x/y as data roles and lets the compiler map physical axes; migration and model documentation must explain it. If task review shows this is unintuitive, consider `category/value` roles before finalizing the schema.

## Theme and style proposal

Themes are versioned, trusted host-registered resources; models do not supply executable themes, external links or dynamic code. Start with candidate light, dark and high-contrast presets; claim accessibility only after contrast and visual acceptance. Proposed final option precedence: **compiler safety rules > explicitly permitted document overrides > selected theme > profile defaults**. Safety rules cannot be overridden; native option/theme conflict behavior must be decided separately before implementation. Missing themes or version mismatch produce diagnostics, not silent substitution. Record color, background and font constraints. Same input, theme and environment should yield deterministic results; verify browser and SVG independently.

## Operations, diagnostics and events

Start with complete document replacement and the existing session-level operationId/baseRevision/complete; hosts capture the revision before asynchronous work. Deduplication applies only within the existing bounded session cache; same ID with changed content conflicts, failures are not cached as successes, and partial streams do not render. Partial patches, cross-session idempotency and collaborative merging are not mandatory for 0.2 unless conflict and replay semantics are separately designed. Synchronous rendering cannot promise mid-render cancellation.

Diagnostics retain code, severity, JSON Pointer path, message and recoverable; distinguish invalid input, unsupported capability, insufficient validation, render failure and semantic ambiguity, without echoing sensitive rows by default. Stable row IDs, aggregation provenance, selection privacy and state restoration need separate designs; otherwise mark positional identity and revision.

## Versioning and migration

- Existing `schemaVersion: "0.1"` retains its semantics and is not silently interpreted as 0.2; accept only the implemented experimental 0.2 intent subset; reject unsupported fields and native 0.2.
- Recommend separate 0.1 and 0.2 schemas, capability profiles and compilation paths; publish a support matrix and separate package from document version. A single dispatch entry point is an implementation choice.
- Offer only **explicit** 0.1 → 0.2 migration: retain source fields, data, row order, null and behavior; reject loss or unreproducible behavior with path diagnostics, never guess values or convert units. Do not promise that all 0.2 documents downgrade to 0.1.
- Comparison tests cover the 0.1 baseline, successful and rejected migrations, both modes, safety, themes and DOM/SVG numeric consistency. Record profile, theme version and migration report in production. Each UI adapter independently declares accepted versions; compatibility is not automatic.

## Implementation priorities and gates

1. Foundation: machine-readable capability matrix, native validation levels and diagnostics, coexistence and migration tests.
2. Data semantics: design then implement time, units, null/absent rows, sorting and explicit aggregation; include positive/negative examples and numeric invariants.
3. Charts: horizontal bars, area, donut, labels and legend first; then combinations and other types driven by task evidence.
4. Themes: versioned presets, precedence and fixed-environment DOM/SVG visual acceptance before broader styling.
5. Quality: compare real-model generation, validation, repair and multi-turn editing; use evaluation data isolated from public RAG/training resources, and test performance, accessibility and installed artifacts.

Before listing an item as supported, require schema/semantic, numeric fidelity, safety, positive/negative examples, browser and SVG where applicable, bilingual documentation and model tasks; mark missing checks not-run.

## Open decisions

Horizontal encoding roles, time representation, unit vocabulary, aggregate provenance, theme/native conflicts, unknown nested native fields, warnings versus errors, row identity and state restoration remain unresolved. Decide these with task and compatibility tests, not field naming alone; the broader 0.2 proposal is not implemented.
