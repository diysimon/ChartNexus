---
doc_id: agents
version: "0.1"
status: implementation-baseline
updated: 2026-10-30
language: zh-CN
---

# Agent 执行指南

> 2026-10-30：已开始实验核心代码开发；当前运行方式与限制见[开发指南](docs/zh-CN/development.md)。本地 CLI/MCP stdio 已实现，尚未发布或接入 UI 协议。

[English](AGENTS.md)

## 适用范围
覆盖整个仓库。所有 Agent 先读本文件和当前任务相关规范。检查实际 package 脚本和开发指南，不得将计划功能或发布当作已完成。

## 开始任务
1. 检查 cwd、Git 状态和用户未提交工作；不得覆盖现有修改。
2. 阅读 [Spec 流程](docs/zh-CN/spec-workflow.md)、[架构](docs/zh-CN/architecture.md)、[编码规范](docs/zh-CN/coding-standards.md)。初始化任务另读 [初始化方案](docs/zh-CN/initialization.md)。
3. 明确目标、非目标、AC、依赖和证据；使用 [Spec 模板](templates/zh-CN/feature-spec.md)。
4. 不自行创建额外 chat 或派生 Agent，除非用户或适用模块规范明确要求。

## 实现规则
遵守包依赖方向；核心无 DOM、网络、模型 SDK。原生 option 与 intent 并行；模型输入不执行代码。Schema、能力、示例、工具定义和双语文档同步。
保持范围聚焦；常规可逆实现继续推进，不重复寻求已有授权。外部发布、发消息和数据上传不能仅凭路线图执行。

## 命令和验证
已实现命令见[开发指南](docs/zh-CN/development.md)，先检查脚本实际存在再运行。按变更选择测试；未执行项标 not-run。检查生成物和 diff，不把离线模拟写成真实宿主或模型验证。
文档修改需更新语言配对与 docs/manifest.json；不需要为纯文字修订写业务测试。

## 交付
报告改变了什么、为什么、如何验证、未验证什么。使用实际文件路径和证据；不宣称未发生的提交、推送、发布、上游认可或协议支持。

[CLI 与 MCP 接入指南](docs/zh-CN/agent-integration.md)
