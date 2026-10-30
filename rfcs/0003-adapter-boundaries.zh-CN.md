---
doc_id: rfc-0003-adapter-boundaries
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: zh-CN
---

# 适配器与能力边界

[Other language](0003-adapter-boundaries.md)

决定状态：未来适配器契约提案，尚未实现协议支持。

## 方案
外围适配器将完整上游图表组件转换成 ChartDocument，并将事件映射回宿主。复用上游解析器，尊重部分流状态边界。能力 profile 带版本，列出输入、图表、输出及限制。核心不依赖传输、框架、模型或凭证。

## 替代与依赖
不重写每个 UI 语言解析器，不把 MCP 当浏览器渲染器。标准 A2UI 与 OpenUI 实验 A2UI profile 分开。实现前核实规范源、SDK 精确版本、绑定、生命周期、事件及 Schema 子集转换。

## 采用验收
在两个真实宿主执行同一任务，验证更新、错误与事件，记录版本/profile 证据。此前所有协议兼容为 unverified。本 RFC 不阻塞独立核心开发子集。
