---
doc_id: spec-0001-tasks
version: "0.1"
status: done
updated: 2026-10-30
language: zh-CN
---

# 执行证据

状态：Done。2026-10-30 本地验证。完成的是 SPEC-0001，不代表全部 alpha/beta 路线完成。

- [x] T01：workspace 与 Schema（AC-01、AC-05）
- [x] T02：编译与数据校验（AC-02）
- [x] T03：DOM、SVG 与演示（AC-03、AC-04）
- [x] T04：测试、文档与本地 CI 配置（AC-05）

## 结果
| AC | 结果 | 证据 |
| --- | --- | --- |
| AC-01 | pass | [边界测试](../../tests/core.test.ts)：模式/Schema 拒绝、非法 JSON、危险键、深度与大小限制 |
| AC-02 | pass | [编译测试](../../tests/core.test.ts)：四类图、分组/缺失、重复分类、引用版本、确定性与输入不变性 |
| AC-03 | pass | [浏览器测试](../../tests/browser/playground.spec.ts)：模式、系列替换、无效更新保留、零尺寸、销毁重挂载、resize、真实点击事件 |
| AC-04 | pass | 三类图 SSR 测试、pnpm demo:svg、Node 22 调用；浏览器测试另覆盖 scatter |
| AC-05 | pass | pnpm check、生成类型、双语/链接检查、精确锁文件、离线冻结安装 |

## 命令与环境
- `pnpm check`：通过；格式、ESLint、包与工具 TypeScript、29 项测试、演示生产构建。
- `node node_modules/vitest/vitest.mjs run`：Node 22.22.3 下 29 项通过（在最终仅轴布局调整前运行；最终全量检查通过 pnpm 的 Node 24.19.0 执行）。
- `pnpm test:browser`：Playwright 1.64.1 配合显式指定的本地 Chromium 149.0.7827.55，3 项通过。CI 会安装配套 Chromium，远端运行尚未验证。
- `pnpm demo:svg`：通过，生成 `outputs/sales.svg`。
- `pnpm install --offline --frozen-lockfile --ignore-scripts --store-dir .local/pnpm-store`：使用已填充缓存通过，不等于全新联网安装验证。
- 双语检查：本次证据更新前 28 组、136 处链接通过，更新后再次执行。
- 视觉检查：修复 x 轴名裁切后图表显示正确。截图仅本地保存在 `test-results/playground-captures-the-verified-development-preview/playground.png`。
- Git origin/HEAD 已同步远端 `4cf28d1bf8d7d9a1156cabb3af5c43b2c1395990`，保留用户已有文件，未提交、未推送。

## 剩余限制
未声明完成 MCP、协议集成、真实模型评测、持久 operation 控制、交互状态保留、包发布、干净 tarball 安装、GitHub Actions 运行或分支保护。完整 ECharts 导致 JS chunk 约 1.26 MB（gzip 约 415 KB），模块化后续处理。同步渲染无硬超时/进程隔离；预算是初始约束，不是实测性能 SLA。
