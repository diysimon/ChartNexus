---
doc_id: spec-0031-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: zh-CN
---
[Other language](tasks.md)

# 语义修复证据

- AC01–AC04 pass：[core/SVG/Agent 测试](../../tests/intent-semantics.test.ts) 10 项及 [浏览器测试](../../tests/browser/intent-semantics.spec.ts) 3 项。覆盖 0.1/0.2、全零/正值/空数据、环图、聚合与 registry 映射、重排、名称碰撞、原生/漏斗隔离、真实 SVG 弧线与独立图例切换。
- AC05 pass：能力声明、信息提示、全零与空分组规范示例、模型入口和开发文档已同步。Agent validate/compile 与真实 MCP stdio 回归通过。
- 浏览器离开 no-share 或销毁时恢复宿主 ARIA 属性；非法更新保留当前有效图表。

## 门禁与边界

`pnpm check`：pass，176 测试 / 24 文件、20 项公开参考自检、demo 构建通过。已安装 Chrome 浏览器测试 21/21 pass。Node 22.22.3、pnpm 11.25.0、Chrome 156.0.8078.74。见 [机器可读证据](verification.json)。现有大 bundle 构建警告仍由 A17 跟进。

以上是确定性本地检查及真实本地 SDK/stdio 检查。浏览器 Ollama 响应是 mock。本轮未执行新的真实模型评测、远端 CI、全包安装或发布。M1–M4 仍未完成，未进行 Git 提交/推送。
