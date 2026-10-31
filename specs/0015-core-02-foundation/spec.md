---
doc_id: spec-0015-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Core 0.2 foundation
[简体中文](spec.zh-CN.md)
## Goal
Add an experimental, independently validated 0.2 intent profile for horizontal bars, area lines, donut pies and named, versioned visual presets. Keep 0.1 semantics unchanged; provide an explicit lossless 0.1-to-0.2 conversion and report native-mode validation boundaries.
## Scope and design
0.2 is opt-in and uses the existing data semantics, compiler, budgets and security guard. Named settings are a small JSON-only allowlist; model cannot supply theme code or external assets. Horizontal maps logical x categories to physical y axis, and logical y values to physical x. Area is only valid for line; donut only for pie; horizontal only for bar. Theme presets are compiled into option without runtime theme registration. Explicitly reject unrecognized 0.2 features and unsupported combinations. Conversion validates the 0.1 document and only converts supported intent input; native migration is rejected with a diagnostic. No aggregation, time, unit, raw option extension, native 0.2, live theme switching, patch, external theme or claimed accessibility guarantee is introduced in this increment.
## Acceptance
Version isolation, migration, invalid combinations, preservation of data and input, determinism, theme option, SVG rendering and browser rendering are tested; capabilities, model resources, bilingual docs and manifest synchronized. Tests cannot establish real-model success or full accessibility.
## Dependencies
Current schema, compiler, SVG renderer and browser runtime; previous 0.2 proposal remains open and may change before stability. Broader requested roadmap stages remain explicitly tracked as incomplete.

Evidence: 0.2 unit/SVG tests, local Chrome browser example, stdio MCP resource and validation tests pass; full roadmap and real-model/accessibility evaluations remain incomplete.
