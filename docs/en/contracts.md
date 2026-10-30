---
doc_id: contracts
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# Contracts, data, and compatibility specification

[简体中文](../zh-CN/contracts.md)

## Status
These are field-level design requirements. Names below are candidates, not published APIs before P0 RFC approval. schemaVersion is independent of package versions; 0.1 is the initial candidate.

## ChartDocument
Required fields: schemaVersion, id, mode. mode=echarts requires option and forbids chart; mode=intent requires chart and forbids option. Public extensions belong in namespaced extensions; reject unknown business fields by default.
Candidate data uses kind=inline fields/rows or kind=reference id/revision. Native inline dataset values and external binding cannot both be authoritative for the same dataset; return DATA_SOURCE_CONFLICT. Bind through stable dataset IDs, not array positions.
Keep the source document; do not overwrite user intent with normalized option. Compilation metadata includes compilerVersion, capabilityProfile, dataRevision, and explicit environment settings.

## Data semantics
- Missing/null: distinguish missing values from zero; no silent filling. Intent preserves gaps by default and checks chart capabilities.
- Numbers: finite values only; numeric strings require explicit conversion. Declare currency units and percentage scales.
- Time: explicit field types and parsing formats. Normalize offset-bearing ISO timestamps where appropriate; distinguish dates from instants. Offset-free timestamps require an explicit timezone, never a guessed machine timezone.
- Ordering: stable sort with field, direction, and null placement. Preserve input order without a sort instruction.
- Aggregation: allowlisted sum/count/mean operations with explicit group and output fields. Never auto-sum duplicate categories; diagnose ambiguous chart semantics.
- Row identity: hosts provide stable rowId. Without one, events explicitly use positional identity bound to the data revision.
- Large data: keep data in the host; give models field descriptions, necessary statistics, and authorized samples. Capability profiles declare and enforce limits.

## Operations and state
Candidate operation fields: operationId, chartId, baseRevision, type, payload. Candidate states: empty, ready, updating, error, disposed.
A repeated operationId with the same payload returns the prior result; different payload returns OPERATION_ID_CONFLICT. Stale baseRevision returns REVISION_CONFLICT. A successful application increments revision exactly once.
Validate and compile before committing. On rendering failure preserve the last successful snapshot and report retry state. Late asynchronous results after cancellation/disposal must not revive an instance. Idempotency caches declare session scope, capacity, and retention; do not promise permanent cross-process deduplication.

## Streaming
Text extractors accept only an agreed JSON object or designated code block; multiple candidates are ambiguous. Never silently invent numbers, rename fields, or execute expressions to repair JSON. Buffer upstream partial state without labeling it a valid ChartDocument. Commit only complete validated state.

## Diagnostics
Use code, severity, path (JSON Pointer), message, recoverable, and optional suggestions/details. Codes are stable; messages may improve. Do not echo rows, tokens, or sensitive absolute paths in details by default.
Initial codes: INVALID_SCHEMA, UNKNOWN_FIELD, UNSUPPORTED_CAPABILITY, DATA_SOURCE_CONFLICT, REVISION_CONFLICT, OPERATION_ID_CONFLICT, RESOURCE_LIMIT, RENDER_FAILED.

## Events
Events include eventId, chartId, chartRevision, dataRevision, type, payload. Selections carry stable row/series identity and necessary fields. Aggregated selections use group keys and aggregation metadata rather than fabricated row IDs. Do not send hover to agents by default; hosts choose subscriptions, throttling, and data disclosure.

## Compatibility and evolution
Each adapter records upstream package, exact tested version, protocol profile, supported operations, limitations, and evidence. Mark untested versions unverified, not supported.
Maintain separate protocol/model/chart/output-environment matrices. Model access does not establish task success; an MCP connection does not establish interactive-chart display.
Breaking schema changes require a new version, migration notes, and explicit rejection/conversion of old input. Migrations must preserve numerical meaning. Do not initially promise automatic migration of every historical experimental version.
