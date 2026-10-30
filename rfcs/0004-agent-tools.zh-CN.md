---
doc_id: rfc-0004-agent-tools
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: zh-CN
---

# Agent 工具边界

[Other language](0004-agent-tools.md)

状态：SPEC-0002 范围内实验实现，不是稳定发布 API。

## 决定
Node 专用 agent 包拥有工具定义、语义校验、受控 worker 渲染和打包资源；CLI/MCP 适配此服务。core 不引入 Node/模型/协议依赖。让 CLI 复用 MCP 会耦合无关传输，重复校验又会漂移。

## 工具与资源
五个工具以 agent/src/tools.json 为共同定义。图表 Schema/能力仍由原包拥有；示例/诊断副本由生成并检查，Schema 子集使用独立 ID。MCP 渲染输出为受限临时资源；CLI 写文件需宿主显式参数及独占创建。

## 风险与验证
worker 截止/并发限制避免工具无限运行，但不是安全沙箱。资源含图表数据且会过期，宿主需处理资源不存在。静态 SVG 不是交互 MCP App。用官方 SDK stdio 进程测试、CLI 子进程、取消/预算/缓存测试和双语文档验收此子集。

## 暂缓
远程传输、认证、持久产物、UI 协议适配、厂商 Schema、prompts 和发布需独立 Spec。
