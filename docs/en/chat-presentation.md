---
doc_id: chat-presentation
version: "0.2"
status: experimental
updated: 2026-11-01
language: en
---
# Chat presentation profile
[简体中文](../zh-CN/chat-presentation.md)

This host opt-in profile supports 0.2/0.3 intent charts. `compileChatChart(document,settings,registry?)` returns `{plan,adjustments}`; runtime uses `mountChart(container,onSelect,{chatPresentation:settings})`; SVG uses `renderSvg(document,{chatPresentation:settings})`. All four local GenUI profiles support chat settings. MCP validate/compile/render accept chatPresentation; render dimensions use the tool's width/height parameters.

Host theme/background/detail settings take precedence over document preferences. Defaults are light, transparent and standard. Five levels are minimal/simple/standard/detailed/comprehensive. Minimal hides optional titles/grid/labels; simple shows supplied titles; standard adds grid; detailed and comprehensive request more labels, with comprehensive endpoint ticks and axis tooltips. Necessary identity, legend, units and scales remain mandatory. Explicit labels may be suppressed for density when dimensions are provided, with notices and full-data alternatives. No values, nulls, ordering or units are changed for aesthetics.

Core callers may supply width/height/target in settings; runtime and SVG use actual/requested dimensions. Layout fallback, token contrast conditions, keyboard source/rendered tables, SVG metadata, lifecycle and the pinned host matrix are detailed in [chat host quality](chat-host-quality.md). `adjustments` retains the old REQUIRED_LEGEND/LABEL_DENSITY_LIMIT mapping; structured `plan.notices` additionally describes layout fallback and density constraints. Runtime callbacks expose diagnostics, while callers can inspect plans separately.

No automatic host-background detection, arbitrary themes, zoom capability, mobile certification or general accessibility certification is claimed. The local model smoke case and later scoped [evaluation](trial-distribution.md) are separate evidence; model invocation and factual accuracy are host responsibilities, not SDK release gates.
