---
doc_id: chat-presentation
version: "0.1"
status: experimental
updated: 2026-10-31
language: en
---
# Chat presentation profile
[简体中文](../zh-CN/chat-presentation.md)

This experimental profile is **explicitly enabled by the host** for 0.2 intent charts; without it 0.1/0.2 compilation and rendering keep their prior behavior. It affects presentation only, not values, aggregation, data order or row identity. See the [chat preview](../../examples/playground/chat.html).

## Usage and precedence

Hosts call `compileChatChart(document, settings, registry?)` for `{plan, adjustments}`; browsers use `mountChart(container, onSelect, {chatPresentation: settings})` and static export uses `renderSvg(document, {chatPresentation: settings})`. The A2UI, OpenUI and COSUI JSON creation options also accept `chatPresentation`. MCP `validate_chart`, `compile_chart` and `render_chart` accept an optional `chatPresentation`; omission retains prior behavior. COSUI Marklang does not use it; other hosts and real streaming transport have not been verified.

Settings accept `theme: "light" | "dark"`, `background: "transparent" | "theme"` and `detailLevel`. Default background is transparent; absent host and document themes use light, absent host and document levels use standard. Explicit host theme and level override document suggestions; background is host-controlled only. A document can declare `presentation.detailLevel`, which has an effect only when the host enables this profile. Existing explicit `presentation.legend.show` and `presentation.dataLabels.show` override level defaults; multi-series and pie/funnel charts retain their required legend even if it is explicitly hidden. Invalid settings produce diagnostics; the system never guesses the system theme.

| Level | Title | Grid | Default labels | Other |
| --- | --- | --- | --- | --- |
| minimal | Hidden | Hidden | Hidden | Required legend retained |
| simple | Show supplied title | Hidden | Hidden | Axes and units remain visible |
| standard | Show supplied title | Shown | Hidden | Default level |
| detailed | Show supplied title | Shown | Visible up to 8 points per series | Denser defaults suppressed |
| comprehensive | Show supplied title | Shown | Visible up to 8 points per series | Cartesian end ticks and axis-trigger tooltip |

Label content follows the ECharts default for each type; no percentages are computed. Heatmaps retain their color scale and do not display data labels in this profile. Explicitly requested labels are not density-suppressed and can overlap. `REQUIRED_LEGEND` reports a restored series/category legend; `LABEL_DENSITY_LIMIT` reports default density suppression. Static SVG returns only SVG; to inspect adjustments first call `compileChatChart` or MCP `compile_chart`. Runtime keeps its existing result shape and callers can inspect adjustments separately.

## Boundaries and verification

Themes set text, axes, legend, tooltip and series colors; transparent or theme background never guesses the host surface. Tooltip uses an opaque theme color. Dual axes/units and heatmap color scale remain present. Category axis labels are limited to 80 pixels and overlapping labels are hidden; hovering a label shows its full text and source data remains unchanged. This fixed rule is not container-aware. Other labels may overlap depending on size, fonts and data; hosts should provide a table or text for touch and keyboard access to full labels. There is currently no container-aware smart hiding, per-point color override, automatic background detection or general text-summary generator; the sample summaries are hand-written for synthetic data. Transparent SVG needs a background matching the selected theme; choose theme background for unknown destinations. Hosts may supply tables, text or adapter-specific fallbacks; core does not generate them automatically.

Tests cover all seven existing chart types across five levels and two themes for data/row-index preservation, text contrast against fixed white/dark surfaces and explicit heatmap scale endpoints, and local Chrome chat UI, SVG download, narrow containers and A2UI/OpenUI/COSUI JSON hosts. These tests do not constitute comprehensive cross-device visual or accessibility certification. A small real local-model synthetic pilot is documented in [local model pilot](local-model-pilot.md); it is not a model ranking or a complete independent held-out benchmark.
