---
doc_id: chat-presentation
version: "0.1"
status: experimental
updated: 2026-10-31
language: zh-CN
---
# 聊天展示 profile
[English](../en/chat-presentation.md)

此宿主显式启用的 profile 支持 0.2/0.3 intent。`compileChatChart(document,settings,registry?)` 返回 `{plan,adjustments}`；runtime 使用 `mountChart(container,onSelect,{chatPresentation:settings})`，SVG 使用 `renderSvg(document,{chatPresentation:settings})`。四种本地 GenUI profile 均支持聊天设置。MCP validate/compile/render 接受 chatPresentation，导出尺寸使用工具的 width/height 参数。

宿主 theme/background/detail 优先于文档偏好，默认 light、transparent、standard。五档为 minimal/simple/standard/detailed/comprehensive：最简隐藏可选标题/网格/标签，simple 显示给定标题，standard 增加网格，后两档请求更多标签，comprehensive 增加端点刻度与轴提示。身份、必要图例、单位、色阶仍保留。传入尺寸时，即使显式标签也可能因密度约束隐藏，并提供提示及完整数据替代。不会为美观改变数值、null、排序或单位。

核心调用者可在 settings 中传 width/height/target，runtime 与 SVG 使用实际或请求尺寸。布局回退、主题对比度条件、键盘源数据/渲染值访问、SVG metadata、生命周期和固定宿主矩阵见 [聊天宿主质量](chat-host-quality.md)。`adjustments` 保留旧 REQUIRED_LEGEND/LABEL_DENSITY_LIMIT 映射，结构化 `plan.notices` 另外说明布局回退与密度约束。runtime 回调报告诊断，调用者也可单独检查编译计划。

不声称自动识别宿主背景、任意主题、缩放能力、移动端认证或全面无障碍认证。真实本地 Ollama 结果仅为合成冒烟检查，不是模型排名，更广泛的独立评测仍待完成。
