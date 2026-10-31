---
doc_id: spec-0023-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# 按版本发现 Schema
[English](spec.md)
## 目标
通过现有 Agent/MCP 工具和 CLI 发现已实现的 ChartDocument 版本，同时不改变默认 0.1 行为。
## 契约
`get_chart_schema` 接受可选 `schemaVersion: "0.1" | "0.2"`；省略时返回原有 0.1 Schema。0.1 的 `mode` 行为不变。0.2 无论省略 mode 或指定 `intent` 都返回独立生成的实验性 intent Schema；指定 `mode: echarts` 返回 `UNSUPPORTED_CAPABILITY`，不返回空或误导性 Schema。不支持的版本返回参数错误。CLI `schema --schema-version 0.2` 转发相同契约，并可选传入 `--mode`。返回 Schema 为克隆，不修改规范源。现有资源和 API 保持兼容。
## 验收
测试默认值、两个版本、两种模式、无效版本、CLI 用法和错误、真实 MCP stdio 调用、Schema 校验及资源不变；同步双语文档与模型检索资源。不声称 0.2 原生模式已经存在。

证据：Agent、CLI 子进程和官方 MCP stdio 测试覆盖版本选择与错误；`pnpm check` 验证生成资源和回归。
