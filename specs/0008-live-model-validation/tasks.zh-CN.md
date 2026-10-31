---
doc_id: spec-0008-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: zh-CN
---

# 本地模型与 MCP 验证

[Other language](tasks.md)

- [x] 实现有限资源的本地 Ollama + 真实 MCP 运行器及元数据。
- [x] 验证负面路径并运行真实合成数据试验。
- [x] 记录双语使用说明和真实证据，不冒充基准。
- [x] 执行相关工程检查。

## 证据（2026-10-31）
- AC-01/02：真实本地 Qwen 3.5 9B，4 个公开任务经一次 JSON 围栏规范化后 4/4；其中两项由模型发起 validate_chart，宿主对三个有效图表验证 SVG 哈希。两项 Mistral 试验的候选格式无效，0/2。详见[试验记录](../../docs/zh-CN/local-model-pilot.md)。
- AC-03/04：`pnpm check`：52 项测试、生成资源、双语链接、类型/lint 和演示构建。模拟测试覆盖无效 JSON、本地模型不可用、输出冲突、未知任务、工具上限/白名单及资源哈希。本次 Node 变更未重跑浏览器测试；远程模型、桌面 MCP、独立隐藏任务及重复试验未运行。
