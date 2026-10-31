---
doc_id: spec-0008-spec
version: "0.1"
status: done
updated: 2026-10-31
language: en
---

# Local model and MCP validation

[Other language](spec.zh-CN.md)

## Objective and scope
Run a reproducible, bounded pilot against an actual local Ollama model using public synthetic tasks and the official MCP SDK stdio client. Preserve the existing corpus and scorer. No remote model call, private inputs, credentials, hidden benchmark, training, model rankings or release.

## Contract and safety
Runner sends each task prompt, explicitly provided data/previous or input document, schema and capability profile; exclude reference outputs, expected assertions and retrieval corpus. Ask the model to validate with the real MCP tool before producing JSON. Capture metadata, token counts when supplied, timings, tool-call names and outcomes, raw output and score in an explicitly named local ignored output. Limit task count, request size, generation and tool rounds; use timeout and cleanly close client. A failed task is recorded, never silently omitted. Existing compiler budgets apply. The local service is restricted to localhost; no arbitrary endpoint or shell execution from model output. Treat local tools as data; no model-provided paths or arbitrary tools.

## Acceptance
- AC-01: A versioned runner executes selected task IDs against a real local model, emits candidates, reproducible metadata and scored results without disclosing answers in prompts.
- AC-02: The runner discovers and calls the real MCP stdio server and records independently whether tool discovery and model-initiated calls succeeded.
- AC-03: Test bounded failures, invalid model output, missing IDs, tool restrictions and offline behavior; run project gates.
- AC-04: Provide bilingual instructions and a truthful pilot record including model and small sample, errors and unverified items.

## Dependencies and limits
Requires an already running local Ollama service and installed model; device/runtime/model results vary. Fixture and model samples are public development data, not held-out independent benchmarks; model output is untrusted. No desktop application integration or model comparisons claimed. Roll back runner and docs without changing core.

## Evidence and limits
Real local Ollama + official MCP stdio pilot and host-initiated SVG checksum verification are recorded in [the pilot guide](../../docs/en/local-model-pilot.md). No live remote model, desktop client, held-out comparison, full 20-task run or repeated trial is claimed.
