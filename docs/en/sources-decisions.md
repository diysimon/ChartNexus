---
doc_id: sources-decisions
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# Sources, decisions, and open questions

[简体中文](../zh-CN/sources-decisions.md)

## Verified sources (2026-10-29)
- [ChartNexus main](https://github.com/diysimon/ChartNexus/tree/main): only LICENSE was returned; description matches the selected positioning; license is Apache-2.0.
- [OpenUI React README](https://github.com/thesysdev/openui/blob/main/packages/react-lang/README.md): documents defineComponent/createLibrary, Zod props, prompt generation, Renderer, streaming parsing, and action interfaces.
- [OpenUI A2UI README](https://github.com/thesysdev/openui/blob/main/packages/a2ui/README.md): describes itself as an experimental A2UI v1.0 profile using OpenUI Lang statements for components. It is not evidence of standard A2UI compatibility.
- [AG-UI README](https://github.com/ag-ui-protocol/ag-ui): positions AG-UI as an event protocol between agents and UI.
Research read main documentation, not immutable SHAs. These summarize evidence at that time; implementation must resolve releases/tags/commits again. Upstream performance claims are not this project's benchmarks.

## Unverified items
Standard A2UI access encountered redirects and did not establish a reliable canonical repository/spec version. ChartNexus has no working implementation, published packages, compatibility tests, or model evaluation results yet. These documents do not establish completion.

## User decisions
ChartNexus name; multiple models/UI protocols plus agents, MCP, RAG, and training resources; Apache-2.0; bilingual project documentation delivered locally.

## Proposed implementation baseline
Dual inputs, framework-neutral core, upstream parser reuse, TypeScript/pnpm, JSON Schema, layered tests, and a 6–8-week beta estimate. Use these to begin design; field-level APIs are not frozen.

## P0 decision register
| Item | Owner role | Evidence/exit condition |
| --- | --- | --- |
| Standard A2UI version and host | Protocol implementer + maintainer | Canonical source, exact version, custom-component smoke |
| OpenUI package version | Protocol implementer | Pin plus registration/streaming/event example |
| Node/ECharts baselines | Core implementer | Support status, peer range, import/render tests |
| npm scope and publishing credentials | Repository maintainer | Ownership and least-privilege setup |
| Resource budgets | Core/runtime implementer | Benchmarks, limits, over-limit errors |
| Private security reporting | Repository maintainer | Actually enabled and accessible channel |
| Model schema subsets | Model integration implementer | Entry-point conversions and negative cases |

Roles do not imply hired staff or assigned GitHub users. Record each decision's date, reason, evidence, and status in a formal RFC/spec.
