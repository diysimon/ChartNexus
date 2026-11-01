---
doc_id: spec-0037-spec
version: "0.2"
status: done
updated: 2026-11-01
language: en
---

# Developer and agent resources

[简体中文](spec.zh-CN.md)

## Problem and goals
Existing capabilities and examples are hard to discover; model resources need searchable, synchronized guidance. Fix the boundary: the host owns invocation decisions, factual data and authorization; ChartNexus owns contracts, validation, faithful rendering of supported input, diagnostics and bounded compatibility. Enable developers to run and copy a working example and understand failure recovery; enable agents to discover supported versions, charts, recipes and host constraints.

## Non-goals and design
No model-vendor dependency, fact retrieval, model invocation/data-truth release gate, ChartDocument contract change, npm publication or data upload. Canonical schemas, capabilities, recipes and runtime remain authoritative. Add a runnable browser quickstart, bilingual guides, and bilingual retrieval entries generated into the index, JSONL and MCP resources. Maps remain host-registered and protocol version boundaries remain unchanged.

## Acceptance
| ID | Observable outcome | Evidence |
| --- | --- | --- |
| AC-01 | Bilingual responsibility, chart catalog, styles, versions and data limits agree with implemented capabilities | documentation and manifest checks |
| AC-02 | Runnable quickstart renders an actual chart, preserves it on malformed JSON and accepts a subsequent complete update | browser test |
| AC-03 | Agents discover/read bilingual boundary, catalog and usage guidance via MCP; index source hashes and generated copies match | generation checks and resource test |
| AC-04 | README exposes developer and agent paths; examples do not claim npm publication or universal production compatibility | review, build and local checks |

## Compatibility, resources and rollback
No changes to input/output contracts, budgets or data semantics. New guidance and retrieval entries are additive. Roll back the example/resources and regenerate without migrating user data. No unresolved product decisions; actual devices, production hosts and training outcomes are not verified in this task. See [tasks](tasks.md).

## Completion record

Delivered bilingual developer/agent guides, bilingual AI indexes, eleven 0.3 recipes, 22 synthetic input/output pairs and MCP resources; see [task evidence](tasks.md). The pairs are starter material for protocol serialization, not evidence of training effectiveness, model chart choice or factual correctness.
