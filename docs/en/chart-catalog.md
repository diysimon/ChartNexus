---
doc_id: chart-catalog
version: "0.1"
status: experimental
updated: 2026-11-01
language: en
---

# Chart and capability catalog

[简体中文](../zh-CN/chart-catalog.md)

The experimental 0.3 intent profile supports eleven bounded chart types. These synthetic examples demonstrate contracts, not factual answers. Every link below is a complete 0.3 recipe. Earlier 0.1/0.2 recipes remain available in the manifest. Use the 0.3 schema projection for the selected type.

| Type | Input shape / principal limit | Runnable recipe |
| --- | --- | --- |
| bar | categorical x, numeric y; horizontal variant supported | [0.3 bar](../../resources/recipes/chat-bar-03.json) |
| line | categorical or explicit temporal x; numeric y; optional area | [0.3 line](../../resources/recipes/line-03.json) |
| pie | categories and nonnegative numbers; zero shares are not invented | [0.3 pie](../../resources/recipes/pie-03.json) |
| scatter | numeric x and y | [0.3 scatter](../../resources/recipes/scatter-03.json) |
| combo | one bar and one line; axis/unit rules apply | [0.3 combo](../../resources/recipes/combo-03.json) |
| funnel | categories and nonnegative values; no inferred conversion | [0.3 funnel](../../resources/recipes/funnel-03.json) |
| heatmap | categorical x/y and numeric value; explicit min/max; no duplicate cells | [0.3 heatmap](../../resources/recipes/heatmap-03.json) |
| radar | explicit indicators and ranges | [0.3 radar](../../resources/recipes/radar-03.json) |
| tree | unique node IDs, parent references and one acyclic root | [0.3 tree](../../resources/recipes/tree-03.json) |
| sankey | graph with nodes and nonnegative acyclic links | [0.3 sankey](../../resources/recipes/sankey-03.json) |
| map | region table, explicit color domain, trusted host map asset and revision | [0.3 map](../../resources/recipes/map-03.json) |

Presentation is host-controlled through the opt-in chat profile: light/dark, transparent or host-selected background, and minimal/simple/standard/detailed/comprehensive. The host settings take precedence. The native ECharts 0.1 input is separate and supports a guarded partial option profile. Refer to [contract](contracts-03.md), [presentation](chat-presentation.md), and [support matrix](support-matrix.md) for exact rules and tested versions.

Run `pnpm dev` and open `/chat.html` for presentation, `/expansion.html` for radar/tree/sankey/map, `/openui.html`, `/a2ui.html`, `/cosui.html` and `/marklang.html` for host integrations. See the [recipe manifest](../../resources/recipes/manifest.json) for resource URIs, negative cases and map prerequisites.
