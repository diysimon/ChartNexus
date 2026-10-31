---
doc_id: model-resources
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# Model, agent, RAG, and training resources

[简体中文](../zh-CN/model-resources.md)

## Shared sources
Capability definitions, canonical JSON Schema, and versioned examples are shared sources. Generate tool parameters, model-schema subsets, API documentation, and retrieval indexes from them rather than separately maintaining divergent specifications. Bridges such as OpenUI Zod use a declared convertible subset and fixture tests; arbitrary schemas are not assumed to convert losslessly.

## Capability discovery
Manifests contain id, version, description, inputSchemaRef, outputFormats, constraints, requires, examples, and status. Models retrieve summaries first and task-specific schemas/recipes next. Do not inject all ECharts documentation and diagnostics by default.
Support tool calls, structured JSON, and designated text blocks with shared semantic validation. Provider schema-subset conversion must detect lost information and reject unsupported constraints rather than silently weakening requirements.

## MCP and CLI
Initial tools: list_capabilities, get_chart_schema, validate_chart, compile_chart, render_chart; finalize names/arguments in RFCs. Supply schema, recipe, and diagnostic resources, and prompts where clients support them.
Start with local stdio and stateless validation/compilation. Rendering returns structured metadata and controlled artifact references without assuming HTML or interactive-chart support. Enforce input, artifact-size, and execution limits; process real data only within authorized scope.
CLI and MCP share core logic. CLI supports machine-readable JSON, stable exit codes, and stderr logging; never executes shell from prompts. CLI success is not real MCP-client evidence; verify both separately.

## RAG resources
Each entry includes id, language, title, summary, capabilityIds, schemaVersion, source, license, updatedAt, contentHash, and body. Bodies independently explain purpose, inputs, outputs, limitations, correct examples, and common failures. Languages share a semantic ID.
Export Markdown and JSONL indexes searchable by capability/error/task without a vector-database dependency. llms.txt is navigation, not a guaranteed client protocol. Historical versions carry explicit version/status; default retrieval targets supported versions.

## Training examples
Records include taskId, familyId, split, language, input, expectedProperties, targetDocument/operations, diagnostics, provenance, license, schemaVersion, and validation. Tool traces record arguments, returns, and observable results; do not require hidden chain-of-thought collection.
Label synthetic data and generation configuration; retain provenance through human edits. Verify third-party licenses individually; public access is not training permission. Do not publish uncertain-license examples or collect production conversations/business data by default.
Separate training, development, and held-out evaluation; do not generate training samples from hidden-test answers. Before publication run deduplication, sensitive-content checks, contract validation, numerical checks, and sampled visual review.

## Agent skills and repository guidance
Consumer skills explain discovery, minimal schemas, validation/repair, and delivery. Contributor AGENTS explains boundaries, commands, specs, and evidence. Do not combine them into a single oversized prompt.
Skills reference versioned documentation; minimal examples work without model keys. Each new capability includes at least one positive example, one failure, and a diagnosable repair path.

## Implemented local baseline (2026-10-31)
The [model entry](model-entry.md), generated [inventory](../../resources/model-index.json), and [JSONL retrieval corpus](../../resources/model-retrieval.jsonl) are available locally and via MCP. The JSONL includes source bodies, hashes and public task reference answers; it is not an independently held-out evaluation corpus. Other training and publishing controls above remain planned.
