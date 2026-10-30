---
doc_id: spec-0002-spec
version: "0.1"
status: done
updated: 2026-10-30
language: en
---

[Other language](spec.zh-CN.md)

# SPEC-0002: CLI and local MCP

Status: Done. Authorized by the user request to continue development on 2026-10-30.

## Scope and design
Add a Node-only agent service shared by CLI/MCP. Five tools: list_capabilities, get_chart_schema, validate_chart, compile_chart, render_chart. Canonical JSON Schema remains in schema; tool input contracts are shared JSON definitions, not duplicated per adapter. validate_chart performs semantic compilation as well as shape checks and returns a compact result without data echo.
CLI accepts a JSON document from an explicit file or stdin and returns JSON. render may write SVG only through an explicit CLI --output path, with exclusive creation (no overwrite); MCP has no filesystem/path tools. Unknown flags/arguments are errors. Exit codes 0 success, 1 input/validation/tool failure, 2 usage/IO failure.
MCP uses official SDK stdio, exposes capability/schema/recipe/diagnostic resources, and maps tool failures to isError plus structured diagnostics. Rendered SVGs live in a per-server memory cache (8 artifacts, 16 MiB total, 10-minute TTL); callers receive a resource link, read via resources/read. Cache miss/expiry is explicit. Server startup logs never pollute stdout.
Render tool uses a worker with a 5-second deadline, cancellation, and maximum two concurrent jobs per service; this is worker isolation, not an OS security sandbox. Existing direct synchronous renderSvg stays unchanged. CLI/MCP requests never supply registry paths; factory integrations may supply a trusted in-memory registry. stdio executable starts without a registry, so referenced data reports DATA_NOT_FOUND.
Tool args limited to 1 MiB, transport JSONL frames 2 MiB; CLI input 1 MiB. Bound outputs to 8 MiB SVG and 4 MiB structured output. No remote transport, model provider, interactive MCP app, protocol adapter, telemetry, publication, or native-client installation.

## Acceptance
- AC-01: CLI capabilities/schema/validate/compile/render work; stdin/file/invalid flags/oversize/error exit codes tested; explicit outputs never overwrite.
- AC-02: Official SDK client launches actual stdio process, negotiates, lists and invokes five tools, reads resources, and completes error → repair → render → SVG resource read.
- AC-03: Input limits, unknown args/tools, cancellation/deadline, concurrency, cache eviction/expiry and missing resources are tested; stdout remains protocol-only.
- AC-04: Tool schemas and discoverable resources share canonical sources; bilingual guide/spec/evidence and full local gates pass.

## Dependencies and alternatives
Official @modelcontextprotocol/sdk 1.32.2 (MIT) handles negotiation/transport; do not hand-roll MCP. Node agent package avoids making CLI depend on MCP or core depend on Node. Worker rendering is necessary for bounded tool lifetime; synchronous render cannot enforce deadlines. Full remote service is deferred.

## Compatibility and rollback
All packages private and experimental. Core ChartDocument 0.1 unchanged; core validateChart remains structural while tool validate_chart is semantic (documented). Reverting these new entry points does not alter stored documents. Real SDK stdio verification is not evidence of any desktop client's rendering support or a live model.
