---
doc_id: rfc-0003-adapter-boundaries
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: en
---

# Adapter and capability boundaries

[Other language](0003-adapter-boundaries.zh-CN.md)

Decision status: experimental adapter boundaries; implemented chart profiles are listed in the update below.

## Proposal
Outer adapters translate complete upstream chart components into ChartDocument and map runtime events back to hosts. Reuse upstream parsers and respect partial-stream boundaries. Expose a versioned capability profile with supported inputs/charts/outputs/limits. Core remains independent of transport, framework, model vendor, and credentials.

## Alternatives and dependencies
Do not implement every UI language parser or treat MCP as a browser renderer. Keep standard A2UI separate from OpenUI's experimental A2UI profile. Before implementation verify canonical specifications, exact SDK versions, bindings, lifecycle, event semantics, and schema subset conversions.

## Acceptance before adoption
Run the same chart task in two actual hosts; verify updates, errors, and events. Record version/profile evidence. Claims apply only to the tested profiles. This RFC does not block the independent core development slice.

## Implementation update (2026-10-30)
Experimental OpenUI, COSUI JSON/San and Marklang, and standard A2UI v0.9 React chart profiles now exist. The independent upstream parsers and host lifecycles remain outside core. These profiles do not establish compatibility with other hosts, versions, or a live model. See [integration guide](../docs/en/genui-integrations.md).
