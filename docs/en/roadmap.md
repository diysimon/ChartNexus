---
doc_id: roadmap
version: "0.1"
status: implementation-baseline
updated: 2026-10-30
language: en
---

# Implementation roadmap and dependencies

[简体中文](../zh-CN/roadmap.md)

## Planning baseline
Estimate 6–8 weeks of sustained work by one primary developer for a public beta. This is an effort estimate, not a launch commitment. All phases are planned; documentation delivery does not mark implementation complete.

| Phase | Estimated effort | Deliverables | Exit criteria |
| --- | --- | --- | --- |
| P0 Design validation | 3–4 workdays | 3 RFCs, draft version matrix, 20 tasks | Executable decisions on modes, semantics, protocol entry points, budgets |
| P1 Core loop | 7–10 workdays | Schema/core/runtime, four intents, native mode, SVG | Keyless demo plus passing contract/browser tests |
| P2 Agent resources | 5–7 workdays | CLI/MCP, diagnostics, recipes, retrieval/examples | Tool loop and real MCP-client evidence |
| P3 Protocol integration | 7–10 workdays | OpenUI/A2UI, React, state/interaction | Display/update/event evidence in both hosts with separate profiles |
| P4 Beta quality | 5–7 workdays | 100-task target, compatibility report, bilingual site, release rehearsal | Actual tarball checks, known limits, all release gates |

Dependencies: P0 → P1 → P2. P3 upstream investigation starts in P0; adapter implementation depends on P1. P4 gathers evidence across phases. Do not wait until P3 to discover unsuitable A2UI versions or host mechanisms.

## First vertical task
Sales data → line chart → regional grouping → stacked bars → data replacement → stable regional selection event. Exercise native and intent inputs, first in DOM and later MCP/protocol hosts. Alpha may ship one protocol; claim two verified protocols only at beta.

## P0 work items
- S001: Inspect local/remote history, safely synchronize documents, create initialization spec.
- S002: Pin toolchain, protocol/SDK versions, ECharts baseline, and npm scope.
- S003: RFC-0001 inputs/data semantics; RFC-0002 operations/state/events; RFC-0003 adapters/capabilities/versioning.
- S004: Select 20 representative tasks and failures; set resource budgets and evaluation record format.
- S005: Establish minimal scaffolding and document checks, verify one bar-chart vertical slice, then enter P1.

These are planning IDs, not existing GitHub issues. Create formal specs/tasks and link evidence when work starts.

## Release scope
Alpha requires native input, four intents, data references, validation/compilation, DOM/SVG, CLI/MCP, one protocol, resources, and explicit limitations. Beta adds a second protocol, conflict/idempotency verification, state preservation, and release evidence.
Delays must narrow release claims or move milestones; never place unverified capabilities in supported columns. Maintainers update this roadmap and affected specs for material scope changes.

## Risks and responses
| Risk | Response |
| --- | --- |
| Native option surface too large | Capability profiles, explicit validation levels, controlled extensions |
| Protocol evolution | Exact version pinning, contract tests, separate adapters |
| Intent becomes another oversized language | Start with four charts; justify new fields using tasks |
| Unstable model output | Structured diagnostics, bounded repair, public controlled evaluations |
| Bilingual/schema drift | Shared-source generation, pair checks, same-PR updates |
| Excessive scope | Vertical milestones; defer framework and hosted-service expansion |

## COSUI scope addition (2026-10-30)
COSUI is a required P3 target with separate JSON/San and Marklang profiles. See [research and acceptance plan](cosui-integration.md). Suggested order: first OpenUI slice, COSUI JSON, COSUI Marklang, then standard A2UI integration after its version is resolved. The historical P3 estimate covers only two protocols and must be re-estimated. Alpha may retain one verified protocol; COSUI remains required work until both profiles have evidence, even if shipped after beta. Experimental chart profiles for COSUI JSON/San, Marklang and A2UI v0.9 React are now implemented; see [the integration guide](genui-integrations.md) for verification boundaries.
