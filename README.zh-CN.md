---
doc_id: readme
version: "0.3"
status: experimental
updated: 2026-11-02
language: zh-CN
---

# GenUI for Apache ECharts

[English](README.md)

GenUI for Apache ECharts（原名 ChartNexus）是面向大模型与 Agent 的实验性图表基础设施，提供版本化 JSON 图表契约、校验、浏览器/SVG 渲染、GenUI 适配器、CLI/MCP 工具及适用于 RAG 或训练工作流的资源。这是独立项目，兼容性不代表上游官方背书。

为保持兼容，现有 `@chartnexus/*` 工作区包名、CLI 命令和 `chartnexus://` MCP 资源标识暂时不变；这不代表包已发布或拥有相应 npm scope。

0.3 intent包含柱状、折线、饼图、散点、组合、漏斗、热力、雷达、树、桑基及宿主注册地图。支持明暗主题、聊天透明背景和五档信息密度。保留的guarded native0.1支持受限制的ECharts option子集。OpenUI Lang、A2UI v0.9、COSUI JSON和COSUI Marklang均有固定版本真实宿主测试，支持范围按profile/版本区分。

全部11个包保持私有、未发布。模型质量、安装包和UI宿主分别记录证据，见[支持矩阵](docs/zh-CN/support-matrix.md)、[契约与迁移](docs/zh-CN/contracts-03.md)及[评测与分发指南](docs/zh-CN/trial-distribution.md)。模型无关架构不代表所有模型都能成功生成。

## 从这里开始

- [快速接入：从零运行并嵌入](docs/zh-CN/getting-started.md)
- [图表、主题和可运行示例](docs/zh-CN/chart-catalog.md)
- [模型、Agent、MCP 和检索资料](docs/zh-CN/agent-guide.md)
- [产品责任边界](docs/zh-CN/product-boundary.md)
- [AI 文本索引](llms.zh-CN.txt)

## 本地预览

使用Node22.22.3或已测试的Node24运行时，以及pnpm11.25.0：

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm dev
# 本地Ollama演示：
pnpm dev:ollama
```

默认预览地址为`http://127.0.0.1:5173/`；宿主演示包括`/openui.html`、`/a2ui.html`、`/cosui.html`和`/marklang.html`。Ollama页面为`http://127.0.0.1:5180/ollama.html`，需要本机Ollama服务和已安装模型。浏览器/安装包检查及限制见[开发指南](docs/zh-CN/development.md)。

仓库：[diysimon/genui-for-echarts](https://github.com/diysimon/genui-for-echarts)。许可证：[Apache-2.0](LICENSE)。

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

[模型与 Agent 入口](docs/zh-CN/model-entry.md) · [离线评测基线](docs/zh-CN/evaluation-baseline.md)

[体验本地 Ollama 图表页面](docs/zh-CN/ollama-playground.md)
