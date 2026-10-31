---
doc_id: spec-0007-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: zh-CN
---

# 模型资源与离线评测

[Other language](tasks.md)

- [x] 编写 20 个任务及参考样例，覆盖诊断和语义断言。
- [x] 实现离线候选评分与负面控制。
- [x] 增加双语模型入口、生成式检索索引和 MCP 发现。
- [x] 验证测试、生成漂移、双语文档和 MCP stdio，记录结果。

## 证据（2026-10-31）
- AC-01/02：`pnpm check`、`pnpm eval:candidates /tmp/chartnexus-candidates.json` 的 20/20 为参考样例；`tests/evaluation.test.ts` 验证等价输入、错误数值、缺失任务、未知 ID 和错误诊断输入。这不是模型准确率。
- AC-03：生成漂移检查及 `tests/mcp.test.ts` 使用官方 SDK 通过 stdio 发现和读取索引、双语入口、JSONL 与任务集。
- AC-04：`pnpm check` 通过：45 项测试、生成资源、双语链接、lint/类型和演示构建。真实模型、隐藏数据、视觉评分、训练和外部发布均未运行。本次为 Node/资源变更，未重跑浏览器测试。
