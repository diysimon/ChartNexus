---
doc_id: spec-0002-spec
version: "0.1"
status: done
updated: 2026-10-30
language: zh-CN
---

[Other language](spec.md)

# SPEC-0002：CLI 与本地 MCP

状态：Done。用户于 2026-10-30 要求继续开发，授权本阶段实现。

## 范围与设计
新增 Node 专用 agent 服务供 CLI/MCP 共用。五个工具：list_capabilities、get_chart_schema、validate_chart、compile_chart、render_chart。图表 JSON Schema 保持 schema 包为源，工具参数统一 JSON 定义，不在适配器重复维护。validate_chart 执行语义编译及结构检查，返回精简结果，不回显数据。
CLI 从显式文件或 stdin 读取 JSON 文档并返回 JSON。render 仅在显式 --output 路径下写 SVG，使用独占创建、不覆盖。MCP 不提供路径/文件操作。未知参数报错。退出码：0 成功，1 输入/校验/工具失败，2 用法/IO 失败。
MCP 使用官方 SDK stdio，提供能力、Schema、示例、诊断资源；工具失败映射 isError 与结构化诊断。SVG 存入单服务内存缓存（8 项、合计16 MiB、10分钟 TTL），返回资源链接，经 resources/read 读取。失效/淘汰明确报错，启动日志不污染 stdout。
render 工具使用 worker，5秒截止时间、可取消，每服务最多2个并发；这是 worker 隔离，不是 OS 安全沙箱。已有同步 renderSvg 不变。CLI/MCP 不接受 registry 路径；工厂接口可注入可信内存 registry，stdio 默认无 registry，引用数据返回 DATA_NOT_FOUND。
工具参数上限1 MiB，stdio JSONL 帧2 MiB，CLI 输入1 MiB；SVG 上限8 MiB，结构化输出4 MiB。不包括远程服务、模型厂商、交互 MCP App、UI 协议适配、遥测、发布或客户端安装。

## 验收
- AC-01：CLI 能力/Schema/校验/编译/渲染可用；测试 stdin/文件/非法参数/超限/退出码；显式输出不覆盖。
- AC-02：官方 SDK 客户端启动真实 stdio 进程，完成协商、五工具发现/调用、资源读取，以及错误→修复→渲染→读取 SVG。
- AC-03：测试输入限制、未知参数/工具、取消/截止、并发、缓存淘汰/过期和资源不存在；stdout 仅有协议消息。
- AC-04：工具 Schema 和发现资源复用共同来源；双语指南/Spec/证据同步，全量本地门禁通过。

## 依赖与替代
官方 @modelcontextprotocol/sdk 1.32.2（MIT）负责协商与传输，不手写 MCP。独立 Node agent 包避免 CLI 依赖 MCP 或 core 依赖 Node。worker 用于约束工具执行时间，同步渲染无法强制截止。完整远程服务后续设计。

## 兼容与回滚
全部包仍私有、实验性。ChartDocument 0.1 不变；core validateChart 仍为结构校验，工具 validate_chart 为语义校验，文档区分。回滚入口不改变已有文档。真实 SDK stdio 验证不证明桌面客户端渲染能力或真实模型效果。
