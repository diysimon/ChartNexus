---
doc_id: rfc-0003-adapter-boundaries
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: zh-CN
---

# 适配器与能力边界

[Other language](0003-adapter-boundaries.md)

决定状态：实验性适配器边界，已实现的图表 profile 见下方更新。

## 方案
外围适配器将完整上游图表组件转换成 ChartDocument，并将事件映射回宿主。复用上游解析器，尊重部分流状态边界。能力 profile 带版本，列出输入、图表、输出及限制。核心不依赖传输、框架、模型或凭证。

## 替代与依赖
不重写每个 UI 语言解析器，不把 MCP 当浏览器渲染器。标准 A2UI 与 OpenUI 实验 A2UI profile 分开。实现前核实规范源、SDK 精确版本、绑定、生命周期、事件及 Schema 子集转换。

## 采用验收
在两个真实宿主执行同一任务，验证更新、错误与事件，记录版本/profile 证据。兼容声明仅适用于已测试的 profile。本 RFC 不阻塞独立核心开发子集。

## 实施更新（2026-10-30）
现有实验性 OpenUI、COSUI JSON/San 与 Marklang、标准 A2UI v0.9 React 图表 profile。各上游解析器和宿主生命周期保持在 core 外；不能据此宣称其他宿主、版本或真实模型兼容。见[集成指南](../docs/zh-CN/genui-integrations.md)。
