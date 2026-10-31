---
doc_id: evaluation-baseline
version: "0.1"
status: experimental
updated: 2026-10-31
language: zh-CN
---

# 离线评测基线

[English](../en/evaluation-baseline.md)

[20 个任务](../../resources/evaluation/tasks.json)为项目自行编写的合成开发样例，许可证 Apache-2.0。每项包含双语提示词、稳定任务与家族 ID、数据划分、来源、参考文档和可执行断言；编辑与修复任务附带上一轮文档。诊断类任务通过 `inputDocument` 提供待诊断输入；候选结果必须是包含 `diagnosticCode` 和 `diagnosticPath` 的对象，评分器会将该声明与编译器和相关输入条件对照。这是公开开发集，不能作为隐藏测试集，也不能宣称测得真实模型表现。所有任务目前均属于 development；尚未建立训练集或独立测试集。

运行 `pnpm eval:self` 检查参考样例。评测外部候选时，创建以任务 ID 为键、对应 ChartDocument 或诊断对象为值的 JSON 对象，运行 `pnpm eval:candidates /path/to/candidates.json`。例如诊断答案可写为 `{"diagnosticCode":"UNKNOWN_FIELD","diagnosticPath":"/chart/encoding"}`。报告逐项给出编译、诊断和断言结果；缺失候选失败，未知 ID 被拒绝，全部通过时退出码才为 0。输入仅在本地处理，总大小不超过 25 MiB；每个文档另受编译器限制。

断言检查编译结果的图表类型、数值、顺序等任务性质，不要求 option 文本逐字一致；但目前规则较窄，一些等价表示仍可能被拒绝。通过不代表视觉质量、宿主整体安全、协议兼容、模型准确率或已完成多轮交互：此基线把上一轮文档作为任务上下文，仅评估最终候选，不重放对话。人工评审和真实模型运行需要单独进行。

检索用途的[生成式 JSONL 资源](../../resources/model-retrieval.jsonl)包含源正文、稳定 ID、语言、许可证和 SHA-256；MCP 通过 `chartnexus://resources/retrieval/0.1` 提供相同数据。该资源包含公开参考答案；测量独立任务成功率时应将其排除在模型上下文之外。
