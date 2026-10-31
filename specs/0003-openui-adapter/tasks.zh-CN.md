---
doc_id: spec-0003-tasks
version: "0.1"
status: done
updated: 2026-10-30
language: zh-CN
---

# OpenUI 接入任务

[English](tasks.md)

- [x] 调研上游 API 并选定 SDK 基线。
- [x] 实现 adapter 和可运行的真实 Renderer 宿主。
- [x] 用浏览器及工程检查验证 AC-01–04。
- [x] 记录证据、限制与双语使用说明。

## 验证证据（2026-10-30）
- AC-01–03：通过，`pnpm test:browser`；Chromium 149.0.7827.55、Playwright 1.64.1，4 项浏览器测试包含真实 OpenUI Renderer、双输入、无效 JSON/字段恢复、流式保留、选择和卸载。演示宿主在流式期间保留已提交响应。
- AC-04：通过，`pnpm check`：43 项单元测试、lint、严格类型、生成校验、双语文档与生产构建。OpenUI 演示 chunk 358.11 kB / gzip 110.87 kB；共享 ECharts chunk 1260.80 kB / gzip 413.71 kB。浏览器测试单独执行。
- 未运行：真实模型、标准 A2UI、COSUI、SSR/水合、干净外部安装、npm 发布及远端 CI。只声明已测试的 OpenUI Lang React profile。
