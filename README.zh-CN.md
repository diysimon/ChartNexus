---
doc_id: readme
version: "0.1"
status: implementation-baseline
updated: 2026-10-30
language: zh-CN
---

# ChartNexus 项目文档

> 2026-10-30：已开始实验核心代码开发；当前运行方式与限制见[开发指南](docs/zh-CN/development.md)。本地 CLI/MCP stdio 已实现，尚未发布或接入 UI 协议。

[English](README.md)

ChartNexus 是面向大模型与 Agent 的 Apache ECharts 图表基础设施，计划提供多 UI 协议适配、MCP 工具和适用于 RAG/训练的资源。

**当前已有实验性本地核心包；CLI/MCP stdio 已可本地使用，协议适配器和已发布包尚不存在。** 本地文档未自动提交或推送到 GitHub。计划命令不代表已实现脚本。

仓库：[diysimon/ChartNexus](https://github.com/diysimon/ChartNexus)。远端已选择 Apache-2.0；本地文档同步回仓库时保留远端 LICENSE。

## 推荐阅读顺序
先读项目章程、技术架构，再读初始化、Spec 执行、编码规范和流水线。开始实现前读 [Agent 指南](AGENTS.zh-CN.md)。

## 规范索引
- [项目章程与范围](docs/zh-CN/project-charter.md)
- [技术架构与设计方案](docs/zh-CN/architecture.md)
- [编码规范与工程要求](docs/zh-CN/coding-standards.md)
- [契约、数据与兼容性规范](docs/zh-CN/contracts.md)
- [Spec 驱动执行规范](docs/zh-CN/spec-workflow.md)
- [项目初始化方案](docs/zh-CN/initialization.md)
- [CI/CD 流水线与门禁](docs/zh-CN/pipelines.md)
- [测试、评测与验收要求](docs/zh-CN/testing-evaluation.md)
- [模型、Agent、RAG 与训练资源规范](docs/zh-CN/model-resources.md)
- [双语文档与项目治理](docs/zh-CN/documentation-governance.md)
- [安全与可靠性要求](docs/zh-CN/security-reliability.md)
- [实施路线与任务依赖](docs/zh-CN/roadmap.md)
- [来源、决策与待决事项](docs/zh-CN/sources-decisions.md)

## 可复制模板
- [功能 Spec 模板](templates/zh-CN/feature-spec.md)
- [任务与执行证据模板](templates/zh-CN/tasks.md)
- [RFC 模板](templates/zh-CN/rfc.md)
- [PR 描述模板](templates/zh-CN/pull-request.md)
- [发布检查模板](templates/zh-CN/release-checklist.md)

## 参与与安全

[贡献指南](CONTRIBUTING.zh-CN.md) · [安全报告状态](SECURITY.zh-CN.md) · [文档清单](docs/manifest.json)

[CLI 与 MCP 接入指南](docs/zh-CN/agent-integration.md)
