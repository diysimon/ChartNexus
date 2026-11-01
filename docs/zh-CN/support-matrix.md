---
doc_id: support-matrix
version: "0.4"
status: experimental
updated: 2026-11-01
language: zh-CN
---
# 已验证支持矩阵

[English](../en/support-matrix.md)

状态按验证维度分别列出。所有 profile 为实验状态，11 个包均 private/未发布，不表示上游认可。[M4 证据](../../specs/0036-trial-distribution/verification.json)区分安装产物、工作区检查和各版本的远端/模型结果。

| 维度 | 实际测试版本 | 证据与限制 |
| --- | --- | --- |
| Native JSON | Schema 0.1，bar/line/pie/scatter | 核心/浏览器回归；受限 option profile，不是任意 ECharts |
| Intent | 0.1 四类、0.2 七类、0.3 十一类 | [契约/迁移](contracts-03.md)、[图表测试](../../tests/chart-expansion.test.ts)、[语义测试](../../tests/intent-semantics.test.ts) |
| 主题/复杂度 | 白/深色、对话默认透明、五档 | [对话宿主质量](chat-host-quality.md)，只开放有界覆盖项 |
| 地图 | 宿主 Polygon/MultiPolygon WGS84 资源 | [地图契约](chart-expansion-03.md)，合成测试数据，不是在线地图/GIS 认证 |
| Node 安装产物 | Node 22.22.3 / 24.22.1，ESM，pnpm 11.25.0，macOS arm64 / Linux x64 | 11 包独立安装；CLI/MCP/worker/资源/类型入口解析通过 |
| 浏览器安装产物 | Chrome156.0.8078.74 / Chromium156.0.8078.4，ECharts 6.1.0 SVG | 两个隔离 Node 消费者各 46 项测试；其他浏览器/设备 not-run |
| OpenUI | react-lang 1.0.2 / React 19.2.4 / zod 4.3.6 | 真实 Renderer 图表组件；[测试](../../tests/browser/openui.spec.ts)、[四类新图](../../tests/browser/chart-expansion.spec.ts)，不代表所有 OpenUI 功能 |
| A2UI | react 0.9.1 / web_core 0.9.2 / React 19.2.4 | 真实 v0.9 catalog/surface；[测试](../../tests/browser/a2ui.spec.ts)及扩充宿主测试，不覆盖所有 catalog/版本 |
| COSUI JSON | cosmic-dynamic-ui 1.0.0 / San 3.15.5 | [真实宿主测试](../../tests/browser/cosui.spec.ts)及扩充宿主测试 |
| COSUI Marklang | Marklang 1.0.1 | [真实宿主测试](../../tests/browser/marklang.spec.ts)，整文档重置语义 |
| Agent / MCP | SDK 1.32.2，stdio | 安装后的官方客户端协商/工具/资源/SVG 往返通过；远端/桌面 MCP not-run |
| 本地模型 | Ollama 0.40.6，四个冻结摘要 | 已完成720/720轮；本次设置的修复后正确率均低于建议95%目标，不作为SDK发布门槛；[结果](../../specs/0036-trial-distribution/evaluation-summary-v2.json) |
| CI / 发布 | 拆分的必需任务 | [CI](https://github.com/diysimon/ChartNexus/actions/runs/41230226310)在`2261351`通过；最终文档提交交付时核验，未发布npm |

安装后的宿主测试覆盖代表性既有图表，以及四种真实宿主中的雷达/树/桑基/地图；不是所有选项×宿主×图表的完整笛卡尔积。源数据/编译数值和 SVG 分别验证确定性语义。内存/延迟是本机观察，不是跨设备保证。复现命令和证据边界见[试用/分发指南](trial-distribution.md)。
