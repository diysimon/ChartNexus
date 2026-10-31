---
doc_id: model-resources
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: zh-CN
---

# 模型、Agent、RAG 与训练资源规范

[English](../en/model-resources.md)

## 共同来源
能力定义、规范化 JSON Schema 和带版本的示例是共同来源。工具参数、模型 Schema 子集、API 文档、检索索引从这些来源生成；不要分别手工维护多份含义不同的规范。OpenUI 所需 Zod 等桥接通过已声明子集转换并用 fixtures 验证，不能假设任意 Schema 可无损转换。

## 能力发现
能力清单包含 id、version、description、inputSchemaRef、outputFormats、constraints、requires、examples、status。模型先获取摘要，再按任务取 Schema 与 recipes。模型上下文不默认注入完整 ECharts 文档和全部错误说明。
支持工具调用、结构化 JSON、约定文本块三种入口；共享语义验证。各提供方 Schema 子集的转换必须检测信息丢失并拒绝不支持的约束，不得静默放宽要求。

## MCP 与 CLI
首版工具：list_capabilities、get_chart_schema、validate_chart、compile_chart、render_chart。工具名称与入参在 RFC 定稿。提供 Schema、recipe、诊断说明 resources；客户端支持时可提供 prompts。
本地 stdio 起步，无状态校验/编译优先。render 返回结构化元数据和受控产物引用，不假设客户端支持 HTML 或交互式图表。工具限制输入、产物大小和运行时间；真实数据只在明确授权范围内处理。
CLI 与 MCP 必须调用同一核心；CLI 支持机器可读 JSON、稳定退出码和 stderr 日志；不从提示词执行 shell。CLI 成功不等于真实 MCP 客户端通过，二者分别验证。

## RAG 资源
每条资源包含 id、language、title、summary、capabilityIds、schemaVersion、source、license、updatedAt、contentHash 和正文。正文独立解释目的、输入、输出、限制、正确示例和常见失败。语言版本共享语义 ID。
导出 Markdown 和 JSONL 索引；按能力/错误/任务检索，不绑定向量库。llms.txt 只是入口导航，不是客户端必然会读取的协议。历史版本有明确 version/status，默认检索当前支持版本。

## 训练样例
样例记录 taskId、familyId、split、language、input、expectedProperties、targetDocument/operations、diagnostics、provenance、license、schemaVersion、validation。工具轨迹记录工具入参、返回和最终可观察结果，不要求收集隐藏思维链。
合成数据标注 synthetic 和生成配置，人工修改保留来源链。第三方数据逐项核实许可；不把网上可访问视为可训练。许可不明的样例不能发布。生产对话和业务数据不默认收集。
训练、验证和隐藏评测分开，生成更多样例不使用隐藏测试答案。发布前执行去重、敏感内容检查、契约验证、数值语义检查及抽样视觉审阅。

## Agent Skill 与仓库指南
消费方 Skill 解释如何发现能力、取最小 Schema、验证/修复和交付。贡献方 AGENTS 解释代码边界、命令、Spec 与证据。不要把这两个用途混为一份巨大提示词。
技能资源引用版本化文档；无模型密钥能执行最小示例。新能力必须至少带一个正例、一个失败例和一个可诊断修复路径。

## 已实现的本地基线（2026-10-31）
[模型入口](model-entry.md)、生成的[资源清单](../../resources/model-index.json)及 [JSONL 检索资源](../../resources/model-retrieval.jsonl)可在本地和 MCP 中读取。JSONL 包含源正文、哈希及公开任务参考答案；不是独立隐藏评测集。上方其他训练及发布控制仍为计划。
