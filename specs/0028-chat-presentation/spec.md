---
doc_id: spec-0028-spec
version: "0.1"
status: implementing
updated: 2026-10-31
language: en
---
# Chat presentation profile
[简体中文](spec.zh-CN.md)
## Goal and scope
Introduce an explicit host-owned experimental profile for existing 0.2 intent charts. Preserve old compile/mount/export behavior without opt-in. Provide five display levels, light/dark text palettes and transparent/theme backgrounds with minimum chart information and bounded labels. No sampling, conversion, executable formatting, model-supplied host policy or automatic color-mode guessing.
## Contract
Host settings `{ theme: light|dark, detailLevel: minimal|simple|standard|detailed|comprehensive, background: transparent|theme }` default light, standard, transparent. `compileChatChart` validates and compiles a 0.2 intent document through existing rules and returns `{plan, adjustments}`. Optional runtime and SVG settings enable the exact same compiler path. Explicit 0.2 legend/label settings override level defaults except required multi-series or pie/funnel legend; required legend restoration and density-based suppression report adjustments. Axis category/ticks and supplied units remain visible; heatmap color scale remains visible, dual axes are not removed. Default data labels only for detailed/comprehensive with at most 8 data points per series; explicit user label choice is respected. Theme adapts axis/text/legend/tooltip and series colors without altering values; visualMap is preserved. Theme background is white/dark; transparent is truly transparent. Malformed settings and unsupported doc versions return diagnostics; empty settings use defaults.
## Phases and acceptance
1. Contract, compatibility and evidence. 2. Five levels and two themes on all existing types. 3. Fixed-data chatbot sample with light/dark, width, five levels, background, interactive and export views. 4. Automated tests for numeric/identity fidelity, render preservation, minimum info, overflow, contrast and browser/SVG; visual examples are not universal accessibility proof. 5. Local real-model development pilot using public synthetic tasks and recorded source/model/settings; independent held-out evaluation remains not-run until built and must not expose held-out answers to models. All five phases record actual evidence and missing checks, with paired documentation and generated resources.

## Evidence and remaining work
Local tests cover the implemented profile, 7 chart types, A2UI/OpenUI/COSUI JSON hosts, browser/SVG and fixed-background contrast. Small local model pilots are recorded in the bilingual pilot guide. A statistically meaningful independent held-out corpus, broad visual/accessibility review, container-aware label layout and real streamed model transport are not complete.
