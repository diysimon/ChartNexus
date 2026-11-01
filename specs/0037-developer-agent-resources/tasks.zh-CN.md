---
doc_id: spec-0037-tasks
version: "0.2"
status: done
updated: 2026-11-01
language: zh-CN
---

# 执行与证据

[English](tasks.md)

- AC-01：编写[边界](../../docs/zh-CN/product-boundary.md)、[图表目录](../../docs/zh-CN/chart-catalog.md)和[Agent 指南](../../docs/zh-CN/agent-guide.md)，同步中英文。
- AC-02：[快速接入](../../docs/zh-CN/getting-started.md)及[浏览器示例](../../examples/playground/quickstart.ts)，覆盖有效、无效与恢复。
- AC-03：将双语资源加入生成索引、检索 JSONL 和现有 MCP 资源，核对发现、内容与哈希。
- AC-04：更新 README 和模型入口；完成本地检查，记录未运行项。

## 验证结果

- AC-01：通过。双语边界、图表目录、开发者接入与 Agent 指南已收录在文档清单；11 类均有 0.3 配方，正反例与 SVG 渲染由 `tests/resource-inventory.test.ts` 检查。
- AC-02：通过。`tests/browser/quickstart.spec.ts` 在本机 Chromium 验证初始渲染、损坏 JSON、未知字段、保留旧图及恢复更新。新增 Agent 资源前，隔离消费者浏览器套件 47/47 通过；后续仅增加 Node/MCP 资源，示例代码未改。
- AC-03：通过。真实 MCP stdio 客户端读到双语指南、根目录 AI 索引、六个新增 0.3 配方及 22 条样例对；资源测试核对来源、许可证、哈希、输入保真、各图类型与可信地图前置条件。最终资源重新打包，Node 22 和 Node 24 隔离消费者的 11 包及 MCP 验证通过。文档中安装后消费者的 Vite 启动命令及浏览器出图也已手动验证。
- AC-04：通过。`pnpm check` 完成生成、双语文档、格式、lint、类型、259 项测试及演示构建；README 提供中英文入口。RAG 指南中的 Node 示例已实际运行。

本轮未执行：真实生产宿主/移动设备、远端 CI、模型训练、npm 发布。模型是否选图与事实正确性由宿主负责，不作为 SDK 门槛。原始私有数据和旧评测输出未进入新增公开资源。
