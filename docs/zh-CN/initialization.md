---
doc_id: initialization
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: zh-CN
---

# 项目初始化方案

[English](../en/initialization.md)

## 当前状态与执行边界
2026-10-29 已核实远端 main 只有 LICENSE；本地 `/Users/zuming/code/echartsAI` 本轮开始时为空、非 Git checkout。本轮交付文档，不执行 clone/init、安装、生成业务代码或发布。以下命令是后续需要实现的接口约定，目前不能宣称可运行。

## I0：同步仓库
检查当前目录、Git 状态和远端；使用独立临时 checkout 获取远端 main，再把本地文档安全合并到 checkout，或经过核查后在本目录初始化并合并远端历史。不得直接 clone 到已有文档目录、覆盖 LICENSE 或重写历史。完成后核对 origin 为 diysimon/ChartNexus，保留 Apache-2.0 原文，提交前检查 diff。

## I1：工具链锁定
核实当时受支持 Node LTS、pnpm、TypeScript、ECharts、Ajv、Vitest、Playwright、MCP SDK 和适配器 SDK 版本。把选定版本与原因写入初始化 Spec 和兼容矩阵。提交 .node-version（或等效文件）、packageManager、engines 与 pnpm-lock.yaml；CI 和本地一致。

## I2：最小 workspace
创建 schema/core/runtime 包，private 根 workspace、统一 tsconfig、ESLint 和 Prettier 配置。独立 Node/DOM 编译目标；通过 package exports 暴露 API。空包不得占位发布。先实现 bar 图表从输入到 DOM 的纵向路径，再扩展包。

## I3：契约与测试
确定 ChartDocument、diagnostics、data resolver 和 capability profile；为原生与 intent 模式各准备一个成功、失败和空数据 fixture。加入编译确定性、输入不变性和 unsupported capability 测试。Node import smoke 验证核心不会引用 window/document。

## I4：运行时和工具
实现挂载、更新、尺寸变化、销毁；验证 series 删除和错误恢复。增加 render SVG、CLI 和 MCP 后分别引入 Node 依赖。MCP stdout 仅协议数据，日志写 stderr。演示默认使用固定数据，真实模型调用为显式可选路径。

## I5：文档与流水线
实现文档链接、双语配对、Schema/fixture、生成物差异检查。建立不含发布凭证的 PR CI；合入后再单独建立受保护发布流程。保护 main 的实际设置需仓库管理员实施，并记录已开启的 required checks。

## 计划命令接口
| 命令 | 预期结果 |
| --- | --- |
| pnpm install --frozen-lockfile | 可复现依赖安装；只能在已有锁文件后使用 |
| pnpm lint | 代码静态规范 |
| pnpm format:check | 格式检查 |
| pnpm typecheck | 所有目标包类型检查 |
| pnpm test | 离线单元与契约测试 |
| pnpm test:browser | 浏览器生命周期和交互测试 |
| pnpm docs:check | 链接、双语与文档结构检查 |
| pnpm generate:check | Schema 派生物无未提交差异 |
| pnpm build | 库和演示构建 |
| pnpm pack:check | tarball 安装和公共导出 smoke |
| pnpm check | 汇总本地必需检查 |
| pnpm eval:offline | 固定任务与轨迹回放 |
| pnpm eval:live | 显式配置、凭证和预算下的真实模型评测 |

## 初始化完成标准
全新 checkout 使用文档步骤可安装并通过本地基础检查；无需模型密钥能运行一个浏览器示例与 SVG 示例；离线测试不发网络请求；无未发布包被错误标成 available；维护者确认包 scope 与首次发布策略。
