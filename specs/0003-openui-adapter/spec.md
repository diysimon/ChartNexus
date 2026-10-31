---
doc_id: spec-0003-spec
version: "0.1"
status: done
updated: 2026-10-30
language: en
---

# OpenUI Lang integration

[简体中文](spec.zh-CN.md)

## Outcome and scope
Deliver a real OpenUI React host rendering ChartNexus charts from OpenUI Lang. Reuse the OpenUI parser and renderer and the existing ChartDocument compiler/runtime. Both native and intent documents remain supported; no model provider, standard A2UI or COSUI implementation is included.

## Design and contract
Use @openuidev/react-lang 1.0.2, React 19 and Zod 4. Register a ChartNexusChart component with a JSON document string property, which is parsed as data and passed to the existing validation pipeline. This avoids duplicating the ChartDocument schema and keeps the supported native option surface explicit; generated prompts must direct the model to the canonical schema and recipes. Streaming text may be incomplete; while the host is streaming do not commit a candidate. After streaming finishes, parse and validate; an invalid update preserves the previous valid chart and exposes diagnostics. Host can observe selections and diagnostics. Cleanup must dispose runtime on component removal. The chart ID must remain stable during updates; registry references require host-supplied trusted data registry.

## AC and verification
- AC-01: Real OpenUI Renderer parses generated language and displays intent and native charts in browser.
- AC-02: Complete updates replace old chart; incomplete streaming and invalid data preserve previous valid state and yield diagnostics on completion.
- AC-03: Chart selection is delivered to the host and unmount releases runtime.
- AC-04: Repository checks and browser tests pass; bilingual documentation, runnable demo and model-facing instructions state limits.

## Failure, limits and compatibility
Respect existing core budgets and runtime restrictions. Fail closed on malformed JSON; never evaluate model output. No protocol-wide compatibility or real model claim. SDK dependency license MIT; React and Zod MIT. Exact browser/SDK versions and results recorded in tasks. Bundle size and clean installation to be measured; npm publication not authorized. Revert adapter and demo without changing core contracts. Hosts must keep a last committed response for continuity if OpenUI removes its tree during a malformed response. API is experimental and unpublished.
