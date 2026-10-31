---
doc_id: spec-0028-spec
version: "0.1"
status: implementing
updated: 2026-10-31
language: zh-CN
---
# 聊天展示 profile
[English](spec.md)
## 目标与范围
为现有 0.2 intent 图表增加宿主显式启用的实验性 profile；未启用时保留原编译、挂载和导出行为。提供五档、明暗文字配色、透明/主题背景、最低信息保障及有限标签。不得采样、换算、执行 formatter、让模型决定宿主规则或自动猜测颜色模式。
## 契约
宿主设置 `{ theme: light|dark, detailLevel: minimal|simple|standard|detailed|comprehensive, background: transparent|theme }`，默认 light、standard、transparent。`compileChatChart` 用现有规则验证和编译 0.2 intent，返回 `{plan, adjustments}`。runtime 和 SVG 可选设置使用同一编译路径。0.2 显式图例/标签优先于档位默认，但多系列或饼/漏斗必须有图例；恢复必要图例和密集数据抑制标签通过 adjustments 说明。分类、刻度及已提供单位保持可见；热力图色阶和双轴保留。detailed/comprehensive 默认仅在每个系列最多 8 个数据点时显示标签；用户显式选择标签时尊重选择。主题适配轴、文字、图例、tooltip 和系列色，不改变数值；保留 visualMap。theme 背景为白色/深色，transparent 真透明。非法设置和不支持的文档版本返回诊断。
## 阶段与验收
1. 契约、兼容和证据。2. 所有现有类型支持五档两种主题。3. 固定数据聊天样例，可切明暗、宽度、五档、背景、交互和导出。4. 自动验证数值/身份保真、渲染保留、最低信息、溢出、对比度和浏览器/SVG；视觉样例不等于全面无障碍。5. 使用公开合成任务执行本地真实模型开发试验并记录来源/模型/设置；独立隐藏评测集未构建之前标未执行，不把答案暴露给模型。五阶段记录真实证据及未完成检查，双语文档和生成资源同步。

## 证据与剩余工作
本地测试覆盖已实现 profile、7 类图、A2UI/OpenUI/COSUI JSON 宿主、浏览器/SVG 和固定背景文字对比。少量本地模型试验记录在双语试运行文档。具有统计意义的独立隐藏任务集、全面视觉/无障碍检查、容器感知标签布局和真实模型流式传输尚未完成。
