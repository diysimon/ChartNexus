---
doc_id: chart-expansion-03
version: "0.2"
status: experimental
updated: 2026-11-01
language: en
---
# Four bounded chart types in 0.3

[简体中文](../zh-CN/chart-expansion-03.md)

## Contract and supported scope

Radar, node-link tree, Sankey and regional map extend experimental **0.3 intent**. All eleven branches now compile; 0.1/0.2 and native-mode capabilities remain unchanged. Read `get_chart_schema({schemaVersion:"0.3",chartType:"radar"})` for an exact branch and `list_capabilities` for limits. Full native ECharts configuration, treemaps, automatic data collection and online maps are outside this profile.

| Type | Source and rules | Identity and presentation |
| --- | --- | --- |
| radar | One ordinary-table row per item; 1–6 unique nonempty item names, 3–8 distinct numeric indicators, explicit finite min < max and optional units. Null, missing, duplicate items and out-of-range values fail. | Source rows or optional row keys; independent indicator ranges are stated in the summary. No normalization or inferred ranges. Multiple items require a legend. |
| tree | Ordinary table with id/parentId/label field references. One root with null parent; 1–1000 unique IDs, existing parents, acyclic/reachable, root depth 0 and maximum depth 16. Labels may repeat. | Stable node IDs. Optional initialDepth 0–2 (default 2). Compatible topology/encoding preserves collapsed state across reorder/update/resize; topology changes reset it. No value is inferred from child count. |
| sankey | Graph data has independent inline/reference nodes and links tables, resolved atomically within a combined 1 MiB budget. ≤200 nodes/1000 edges, unique node IDs, valid endpoints, no directed cycles/self-links/duplicate directed pairs, finite nonnegative weights. | Node ID and ordered-endpoint edge ID; duplicate display labels remain distinct. Zero edges and nodes without positive flow are not drawn but stay in full tables. Incoming/outgoing/difference are reported; no conservation or percentage assumption. |
| map | Ordinary table, exact region/value fields, mapRef id/revision and explicit finite colorDomain min < max. Duplicate/unknown regions and non-null out-of-range values fail. ≤1000 rows. | Stable region IDs; absent source row has rowIndex null. Zero is a measured value, null and absent use a missing-data color. Raw and rendered tables distinguish provided/absent. |

New branches reject legend overrides: radar requires its item legend, while tree/Sankey/map use labels or a continuous scale. Tree/Sankey also reject dataLabels overrides because node labels are required; radar/map permit dataLabels.show.

All inputs are JSON. Fields/values are not silently renamed, normalized, sorted or summed. Scalar source tables and all original graph links remain accessible and appear in SVG metadata. Radar indicator units are descriptive and never convert source values.

## Rendering, state and exports

Two host themes, transparent background and five detail levels use the shared chat presentation planner. Required radar legends, tree/Sankey labels and map scales remain available; dense layouts may use explicit browser table fallback or return SVG EXPORT_LIMIT. Diagrams below 320px use fallback rather than squeeze labels. Full raw text remains in tables if visual labels are truncated. Map labels use the declared theme surface behind text when enabled, rather than assuming all region fills provide text contrast.

The shared ECharts bridge installs fixed Sankey label/tooltip callbacks that return source text literally, including ECharts template markers. RenderPlan remains JSON; no model callbacks or code are accepted or executed. Stable internal IDs are separate from display labels.

Tree SVG is an explicitly labelled **initial collapsed overview**, with full source hierarchy in title/metadata. It does not export the browser's current expansion state or claim that every descendant is visible. Browser expansion changes neither data nor revision; changed topology resets expansion. Chart selection events use eventVersion 0.3 with identity node/edge/region and source row mapping; radar retains row/key selection. Empty or zero-flow Sankey inputs draw no invented flow. Zoom retention is unsupported.

## Trusted map assets

`@chartnexus/echarts` is a shared local workspace package with the existing ECharts 6.1.0 peer. `createMapAsset(input)` clones and validates a host asset, normalizes FeatureCollection geometry, and computes a synchronous SHA-256 shared by Node and browsers. Required host fields: id, revision, coordinateSystem:"WGS84", license, provenance, geoJSON. Each feature has a unique properties.name matching the document's region key. Only Polygon/MultiPolygon with finite 2D coordinates, longitude ±180/latitude ±90, closed nondegenerate rings are accepted. No CRS conversion, SVG maps, geometry collections or antimeridian-crossing segments. This is bounded shape validation, not comprehensive GIS topology certification (for example, it does not prove rings never self-intersect). Hosts remain responsible for geometry correctness and redistribution rights.

Limits are ≤5 MiB host asset JSON, 20000 total coordinate points and 1000 features per asset. Shared ECharts registrations are capped at eight revisions and 20 MiB normalized geometry per module instance. Names include id/revision/hash. Reusing identical assets does not consume capacity; changing geometry under an existing id/revision is rejected. Since ECharts cannot unregister maps, disposal does not free this capacity; use a fresh rendering process/worker when exhausted. The registration checks detect external overwrites within the reserved namespace. Do not directly register maps under `chartnexus:` names.

```ts
import { createMapAsset, mapCatalog } from '@chartnexus/echarts';
import { mountChart } from '@chartnexus/runtime';
import { compileChart } from '@chartnexus/core';
// assetInput is trusted host-owned JSON, never a model tool argument.
const prepared = createMapAsset(assetInput);
if (!prepared.ok) throw new Error('Invalid host map');
const maps = { [prepared.value.id]: prepared.value };
const plan = compileChart(chartDocument, dataRegistry, mapCatalog(maps));
const mounted = mountChart(container, onSelect, { maps, chatPresentation: {} });
if (mounted.ok) mounted.value.update(chartDocument, dataRegistry);
```

Pass the same `maps` host option to renderSvg, createAgentService, or an OpenUI/A2UI/COSUI/Marklang adapter. Core receives only metadata/region keys through MapCatalog. The renderer revalidates geometry/hash; the Node worker receives the host snapshot and performs the same checks under its existing deadline/memory/output budgets. Agent list_capabilities exposes registered map metadata/keys, never coordinates. Default CLI/MCP processes have no maps; a map recipe requires a configured host. No model argument can register a map, select a file/URL or bypass the host registry.

The [authored rectangles](../../examples/maps/two-regions.json) are Apache-2.0 synthetic test data, not administrative boundaries. The public [map recipe](../../resources/recipes/map-03.json) refers to two-regions@1, and its manifest declares the host requirement. No real boundary assets are bundled or downloaded.

## Preview, resources and evidence

Run `pnpm dev` and open `/expansion.html` to switch chart/theme/detail/width, edit complete JSON, inspect full data and click marks. Existing upstream demos accept `?m3=radar|tree|sankey|map` for the same authored fixtures. [Radar](../../resources/recipes/radar-03.json), [tree](../../resources/recipes/tree-03.json), [Sankey](../../resources/recipes/sankey-03.json) and map recipes, negative mutations, capability limits, diagnostics and MCP/RAG copies are generated from canonical resources.

See [SPEC-0035](../../specs/0035-chart-expansion/spec.md) and [acceptance evidence](../../specs/0035-chart-expansion/tasks.md). Local compiler/browser/SVG/worker and pinned upstream SDK checks are distinct from real-model success. M4 scoped evaluation, all-package clean installs, performance baselines and remote CI are recorded in [M4 evidence](trial-distribution.md); npm publication has not occurred. No universal protocol/model or broad accessibility certification is claimed.
