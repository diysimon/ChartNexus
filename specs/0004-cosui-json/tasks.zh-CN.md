---
doc_id: spec-0004-tasks
version: "0.1"
status: done
updated: 2026-10-30
language: zh-CN
---

# COSUI JSON / San 任务

[Other language](tasks.md)

- [x] 锁定上游版本和宿主接入机制。
- [x] 实现适配器与真实宿主演示。
- [x] 验证 AC-01–04，记录浏览器、测试和包体积证据。
- [x] 同步双语文档与模型示例。



## 证据（2026-10-30）
- AC-01–03：实验图表 profile 通过，Chromium 149.0.7827.55、Playwright 1.64.1，使用真实上游宿主，见 `tests/browser` 对应测试。覆盖双输入、替换、无效/不完整图表输入、回调与移除；Marklang 另测不完整源、缺失和重复数据。
- AC-04：通过：`pnpm check`（43 项单元测试、生产构建、类型/lint/文档）及 `pnpm test:browser`（7 项）。版本、模型示例和限制见[集成指南](../../docs/zh-CN/genui-integrations.md)。
- 未运行：真实模型、真实流式传输、其他宿主/SDK 版本、SSR/水合、干净外部安装、发布与远端 CI。宿主负责流式完整性和信任控制；Marklang 不净化 HTML。
