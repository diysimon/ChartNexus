---
doc_id: spec-0029-spec
version: "0.1"
status: implementing
updated: 2026-10-31
language: en
---
# Reliability and chart expansion
[简体中文](spec.zh-CN.md)

## Problem and goals
The experimental 0.2 intent profile has seven chart types and local host evidence, but chat layout, real-model reliability and distribution are not yet release-grade. Deliver the nine quality areas and add bounded radar, tree, Sankey and map intent profiles. Preserve the existing native and intent contracts; never execute model output or fetch map resources supplied by a model.

## Design and compatibility
Work incrementally behind explicit contracts, preserving 0.1 and existing 0.2 behavior. Each new chart requires its own spec defining data semantics, validation, limits, selection identity, accessible presentation, SSR and failure behavior before implementation. Radar requires explicit indicators and ranges; tree requires unique node identity and acyclic parent relationships; Sankey requires valid nodes, links and nonnegative values with cycle handling; map requires a host-registered trusted map with explicit region identity and no implicit network access. These are design constraints, not claims of support.

## Acceptance and dependencies
| Area | Acceptance evidence | Status |
| --- | --- | --- |
| Responsive chat layout | Long labels, legends, narrow/wide containers and resize verified without changing data | not-run |
| Themes and accessibility | Contrast on declared surfaces, keyboard and text alternatives reviewed; limits recorded | not-run |
| Interaction state | Compatible updates preserve explicitly defined state; incompatible changes reset safely | not-run |
| Independent evaluation | Held-out tasks, reproducible scoring and real model results without answer leakage | not-run |
| Real streaming | Real model transport, cancellation, truncation, errors and concurrency tested | not-run |
| Model usability | Evidence-driven schemas, examples and bounded repair measured against baseline | not-run |
| Protocols | Version matrix, contracts and real host evidence; Marklang chat profile evaluated | not-run |
| Distribution | Packed packages installed and exercised in a clean external project; licensing reviewed | not-run |
| Stability and documentation | Versioning, migration and bilingual documentation reconciled with evidence | implementing |
| New charts | Radar, tree, Sankey and map each have contracts, schema, compiler, resources, tests and browser/SVG evidence | not-run |

Responsive presentation and quality rules precede chart expansion; contracts precede implementation. Actual model, host, device and package evidence are recorded separately from simulations. Do not claim universal model or protocol compatibility.

## Resources and release
Synchronize schema, capabilities, generated types, recipes, MCP/RAG resources and bilingual documentation for each implemented capability. No publication is authorized by this spec. Roll back a new capability without changing existing chart semantics.

## Completion record
Planning and stale development-guide status correction only. All other rows remain open until supported by evidence.

A fixed 80-pixel category-label limit, overlap hiding and hover tooltip are implemented and checked with a narrow long-label example; adaptive sizing, other layouts and accessible alternatives remain open.
