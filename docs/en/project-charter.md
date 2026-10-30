---
doc_id: project-charter
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# Project charter and scope

[简体中文](../zh-CN/project-charter.md)

## Positioning
ChartNexus is Apache ECharts infrastructure for language models, agents, and generative UI. It provides versioned chart contracts, validation and compilation, rendering runtimes, protocol adapters, and model resources.
Its purpose is to make ECharts easier to use and chart generation, editing, and interaction verifiable. Model agnosticism means no vendor lock-in, not equal success across models. Protocol agnosticism means extensible adapters, not existing support for every protocol.

## Users and tasks
- Application developers: embed model output while retaining their data permissions and frontend stack.
- Agent developers: discover capabilities, retrieve minimal specifications, validate, and repair charts.
- Protocol and framework maintainers: integrate ECharts through stable contracts without duplicating compilation or rendering.
- Resource consumers: use retrieval and training resources with versions, provenance, licensing, and validation records.

## Product principles
1. Preserve native ECharts expression alongside a constrained intent mode.
2. Separate data, chart descriptions, and UI state; do not require models to rewrite large real datasets.
3. Identical inputs, compiler versions, data revisions, and explicit environment parameters produce reproducible render plans.
4. Return structured diagnostics; never manufacture success by dropping fields, changing values, or executing model code.
5. SDK, CLI, MCP, and UI adapters share one core that runs without model credentials.
6. Ship documentation, examples, schemas, capability manifests, evaluations, and implementation together.

## v0.1 alpha scope
- Native JSON option input with declared capability boundaries.
- Intent: bar, line, pie, and scatter charts with explicit field mappings.
- Small inline datasets and host-registered data references with revisions.
- Validation, compilation, browser DOM rendering, and static SVG.
- Full specification replacement, data replacement, and basic selection events.
- CLI, local stdio MCP, one UI protocol integration, model resources, and offline examples.

## v0.2 beta scope
A second UI protocol, conflict and duplicate-request handling, interaction-state preservation, a public compatibility matrix, cross-model evaluation, and release workflows. Design cross-protocol state correctness during alpha and broaden validation during beta.

## Deferred scope
General BI, database query engines, arbitrary code execution, hosted model proxies, dedicated model training, a complete ECharts option schema, every frontend framework, native mobile rendering, and unconditional support for all protocols. Schedule PNG, advanced charts, and remote MCP by demand.

## Decisions and authority
The user selected ChartNexus, Apache-2.0, and this documentation delivery. This is an implementation baseline, not evidence of working software, upstream endorsement, or npm name availability. External releases, data uploads, and outbound messages require authorization in the relevant task; a roadmap is not authorization.
Record implementation scope changes through the spec workflow. Breaking contracts and core boundary changes require an RFC reviewed by a maintainer.
