---
doc_id: spec-0030-spec
version: "0.1"
status: reviewed
updated: 2026-10-31
language: zh-CN
---
# 基于证据的审视与实施设计
[English](spec.md)

## 范围
审视基线 54fbf2a，为九项质量工作及雷达/树图/桑基/地图形成严格评估、技术 RFC 和可执行计划。本轮为文档与诊断复现任务，不是这些功能的实现。不修改生产行为，不发布、提交或发送外部消息。

## 目标与方法
检查真实契约、源码、生成器、宿主生命周期、测试与分发。复现关键问题，区分源码推断与实测失败，重新执行现有门禁并记录限制。保留模型无关架构、受控原生/intent 输入和双语资源。证据见[任务记录](tasks.zh-CN.md)；SPEC-0029 保持未完成。

## 验收
| ID | 条件 | 证据 | 结果 |
| --- | --- | --- | --- |
| REVIEW-01 | 核对当前实现和测试基线 | verification.json；审视报告 | pass |
| REVIEW-02 | 重要问题有源码或可复现证据并分级 | probes.mjs；baseline-observations.json；F01–F12 | pass |
| REVIEW-03 | 设计覆盖契约、展示、状态、传输、图表、地图信任、Agent 和打包 | 技术 RFC D01–D10 | pass |
| REVIEW-04 | 九项/四图映射到依赖与可观察 AC | 行动计划 A01–A18 | pass |
| REVIEW-05 | 双语文档、manifest 与本地链接一致 | pnpm docs:check；pnpm generate:check；git diff --check | pass |

## 交付与兼容
[审视](../../docs/zh-CN/project-review-2026-10-31.md)、[设计提案](../../docs/zh-CN/technical-design-2026-10-31.md)、[行动计划](../../docs/zh-CN/action-plan-2026-10-31.md)、英文对应文件及证据。新 0.3 API 名称与阈值为提案，不是支持契约。现有代码不变；回退审视文件不影响图表。

## 完成边界
审视资料完成，实施工作未完成。未进行新的真实模型调用、远端 CI 检查、全面安全/无障碍认证或全包安装；本次仅 schema 包完成干净安装。不能据此关闭 SPEC-0029。
