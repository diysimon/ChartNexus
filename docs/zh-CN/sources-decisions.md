---
doc_id: sources-decisions
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: zh-CN
---

# 来源、决策与待决事项

[English](../en/sources-decisions.md)

## 已核实来源（2026-10-29）
- [ChartNexus main](https://github.com/diysimon/ChartNexus/tree/main)：本次读取只有 LICENSE，仓库描述与已选定位一致，许可证 Apache-2.0。
- [OpenUI React README](https://github.com/thesysdev/openui/blob/main/packages/react-lang/README.md)：描述 defineComponent/createLibrary、Zod props、提示词生成、Renderer、流式解析与 action 接口。
- [OpenUI A2UI README](https://github.com/thesysdev/openui/blob/main/packages/a2ui/README.md)：自称 experimental A2UI v1.0 profile，用 OpenUI Lang statements 表达组件。不是标准 A2UI 兼容证据。
- [AG-UI README](https://github.com/ag-ui-protocol/ag-ui)：定位为 Agent 与 UI 之间的事件协议。
上次研究使用 main 文档而非固定 SHA，以上是当时证据摘要；实施必须重新定位 release/tag/commit。没有将上游性能宣传当成本项目基准。

## 未完成核实
标准 A2UI 上游访问遇到重定向，未获得可靠的 canonical 仓库/规范版本。本项目尚无可运行代码、包发布、兼容测试或模型评测结果。不得根据这些文档宣称已完成。

## 用户已确定
ChartNexus 名称；面向多模型、多 UI 协议、Agent、MCP、RAG 和训练资源；Apache-2.0；中英文项目文档落到本地目录。

## 实施建议基线
双模式输入、框架无关核心、上游解析器复用、TypeScript/pnpm、JSON Schema、分层测试、6–8 周 beta 估计。采用这些建议开始设计，不等于字段级 API 已冻结。

## P0 决策表
| 事项 | 负责人角色 | 证据/退出条件 |
| --- | --- | --- |
| 标准 A2UI 版本与宿主 | 协议实现者 + 维护者 | canonical source、精确版本、自定义组件 smoke |
| OpenUI 包版本 | 协议实现者 | pin + 注册/流式/事件样例 |
| Node/ECharts 等基线 | 核心实现者 | 支持状态、peer 范围、导入/渲染测试 |
| npm scope 与发布凭证 | 仓库维护者 | 所有权与最小权限配置 |
| 资源预算 | 核心/运行时实现者 | 基准数据、上限、超限错误 |
| 私密安全报告渠道 | 仓库维护者 | 实际启用且可访问的渠道 |
| Schema 模型子集 | 模型接入实现者 | 各入口转换和失败例 |

角色不是新增雇员或已分配 GitHub 用户。每个决定在正式 RFC/Spec 中记录日期、理由、证据和状态。
