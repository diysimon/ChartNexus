---
doc_id: spec-0002-tasks
version: "0.1"
status: done
updated: 2026-10-30
language: zh-CN
---

# 执行证据

状态：Done。SPEC-0002 于 2026-10-30 在本地完成，不代表协议适配器或整个 beta 路线完成。

- [x] 共享 Agent 工具与受限渲染（AC-03、AC-04）
- [x] CLI 与 stdio MCP 资源（AC-01、AC-02）
- [x] 进程集成及失败测试（AC-01、AC-02、AC-03）
- [x] 双语文档与证据（AC-04）

## 验收结果
| AC | 结果 | 证据 |
| --- | --- | --- |
| AC-01 | pass | [CLI 子进程测试](../../tests/cli.test.ts)：JSON/stdin/文件命令、语义错误、用法/IO 退出码、大小限制、真实 SVG、拒绝覆盖 |
| AC-02 | pass | [MCP 进程测试](../../tests/mcp.test.ts)：官方 SDK 协商、五工具、资源、错误字段→正确图表→编译→渲染→读取及 SHA-256 |
| AC-03 | pass | [Agent/缓存测试](../../tests/agent.test.ts)：截止、取消、忙碌/容量回收、非法参数、宿主 registry、字节限制、过期/淘汰/会话隔离；MCP 超大帧测试 |
| AC-04 | pass | 资源生成一致性、严格类型/Lint、双语检查及[接入指南](../../docs/zh-CN/agent-integration.md) |

## 已执行检查
- `pnpm check`：通过，4 个文件43项测试，其中新增14项 Agent/CLI/MCP；生产演示构建通过，仍有完整 ECharts 包的体积提示。
- 补齐源码 bin 启动器后，格式、ESLint、TypeScript 和43项测试再次通过，集成测试通过源码包装器进入编译入口。
- `node node_modules/vitest/vitest.mjs run tests/agent.test.ts tests/cli.test.ts tests/mcp.test.ts`：Node 22.22.3 下14项通过，发生在仅启动器调整前；pnpm 检查使用内置 Node 24.19.0。
- `pnpm test:browser`：Chromium 149.0.7827.55 / Playwright 1.64.1，3项通过，浏览器功能未变。
- 已填充本地缓存的离线冻结锁文件安装通过。CLI 实际生成 `outputs/agent-chart.svg`（5015字节），输出/缓存/dist 仍被 Git 忽略。
- `node packages/cli/bin/chartnexus.mjs --help`：输出纯 JSON。本地尚未建立包管理器 `.bin` shim，文档统一直接使用 Node。
- 本次证据更新前双语检查32组/156处链接，交付前再次检查最终证据。

## 验证边界
测试使用官方 SDK Client 与真实本地 stdio 子进程，不是原生桌面客户端或真实模型。本次未修改用户客户端配置。未声明完成远程服务、A2UI/OpenUI、模型基准、包发布、提交/推送或远端 GitHub CI。源码启动器已测，干净的已发布 tarball 安装未测。
