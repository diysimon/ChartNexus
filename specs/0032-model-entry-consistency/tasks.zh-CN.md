---
doc_id: spec-0032-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: zh-CN
---
[Other language](tasks.md)

# 资源与入口一致性证据

- AC01–AC02 pass：[清单测试](../../tests/resource-inventory.test.ts) 13 项。11 个规范 recipe 条目覆盖七种已支持意图图表、负例补丁和修复示例；包内/MCP 值与规范资源一致。隔离夹具验证日期、状态、仅正文元数据错误会失败。
- AC03–AC04 pass：[输入契约测试](../../tests/input-contract.test.ts) 6 项。聊天/非聊天、有序/普通组合可编译，保留旧版兼容、拒绝聊天旧版、返回值隔离；检查真实上游 OpenUI 生成提示词与 A2UI 属性 schema。COSUI 导出相同 helper 供宿主组装提示词。
- [MCP 测试](../../tests/mcp.test.ts) 按生成清单比较资源 URI 集合与检索条目（含新生成产物），替代固定条目数断言。

## 门禁与边界

`pnpm check`：pass，176 测试 / 24 文件、20 项公开参考自检、demo 构建通过。已安装 Chrome 浏览器测试 21/21 pass。Node 22.22.3、pnpm 11.25.0、Chrome 156.0.8078.74。见 [机器可读证据](verification.json)。现有大 bundle 构建警告仍由 A17 跟进。

以上是确定性本地检查及真实本地 SDK/stdio 检查。浏览器 Ollama 响应是 mock。本轮未执行新的真实模型评测、远端 CI、全包安装或发布。M1–M4 仍未完成，未进行 Git 提交/推送。
