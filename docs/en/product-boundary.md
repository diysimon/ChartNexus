---
doc_id: product-boundary
version: "0.1"
status: experimental
updated: 2026-11-01
language: en
---

# Product boundary and ownership

[简体中文](../zh-CN/product-boundary.md)

ChartNexus provides versioned chart documents, validation/compilation, browser and SVG rendering, pinned GenUI adapter profiles, and model-facing resources. The host supplies complete data or authorized data references. Input flows through an optional protocol adapter → ChartDocument → validation/compilation → renderer → host component. Use a renderer directly without MCP or a model service.

| Responsibility | ChartNexus | Host / data / model |
| --- | --- | --- |
| Choosing whether to show a chart or invoke a component | Describe supported capabilities and input | Select and invoke the component |
| Truth, provenance and authorization of business data | Validate supported structure and references; do not infer facts | Retrieve, authorize and verify data |
| Rendering supplied values | Preserve values, units, nulls, identity and declared transformations; report unsupported input | Choose explicit operations and provide an appropriate container |
| Broken, incomplete or stale output | Return diagnostics; retain a prior chart where the selected runtime/adapter guarantees it | Assemble complete messages, manage retries, ordering and fallbacks |
| Themes and information density | Bounded light/dark, transparent background and five detail levels in the opt-in chat profile | Set host policy and ensure readable surrounding surfaces |
| Model interoperability | Publish schema, capabilities, examples and diagnostics; test usability | Select/configure models, prompt and tools; no guaranteed invocation or accuracy |

We do not fetch facts, silently repair business data, execute model code, provide arbitrary ECharts options, or guarantee every protocol/model. The guarded native profile has partial validation. Schema validation is not a truth check, security certification, or a guarantee of good chart choice. Existing model evaluations are diagnostic evidence of one setup, not a universal product acceptance threshold. A model failure to choose a component or generate factual data is not a ChartNexus rendering failure.

Before production, verify the exact host/SDK/browser, stream assembly, error handling, resource limits, delivery/versioning and operational policy. Server rendering and remote services need host-specific isolation and access control; local stdio MCP is not a public server. See [support matrix](support-matrix.md) and [getting started](getting-started.md).
