---
doc_id: agent-integration
version: "0.1"
status: experimental
updated: 2026-10-30
language: zh-CN
---

# CLI 与 MCP 接入

[Other language](../en/agent-integration.md)

## 当前状态
本地 CLI 与 MCP stdio 已实现，使用 SDK 1.32.2。官方 SDK 客户端集成测试与桌面应用/真实模型验证分开。包仍私有，不要把包名当作已发布安装命令。本次不会自动修改用户客户端配置。

## 构建与 CLI
先执行 `pnpm install --frozen-lockfile --ignore-scripts` 和 `pnpm build`。自动化推荐直接调用 Node，保持 stdout 为纯 JSON：

```sh
node packages/cli/dist/main.js capabilities
node packages/cli/dist/main.js schema --mode intent
node packages/cli/dist/main.js validate resources/recipes/bar.json
node packages/cli/dist/main.js compile resources/recipes/bar.json
cat resources/recipes/bar.json | node packages/cli/dist/main.js validate -
mkdir -p outputs
node packages/cli/dist/main.js render resources/recipes/bar.json --width 800 --height 480 --output outputs/agent-chart.svg
```

没有 `--output` 时 SVG 放在 JSON 结果中；有此参数时独占创建新文件，不覆盖现有文件或符号链接，父目录需已存在。CLI 文件路径来自用户/宿主显式选择，MCP 工具不接受路径。也提供 `pnpm cli` 便捷入口，但包装器可能输出运行日志，自动化宜直接用 Node。源码 bin 启动器在构建前已存在；缺少编译产物时提示 BUILD_REQUIRED。

退出码：0 成功；1 JSON、Schema/语义/能力/渲染失败；2 用法或 IO 失败。stdout 为 JSON 结果，stderr 为脱敏运行诊断。未知/重复参数报错，不静默忽略。输入上限1 MiB。

## 配置本地 MCP 客户端
构建后，按宿主支持的格式调整以下配置并替换绝对路径。这里只是配置示例，不代表所有客户端都采用此格式：

```json
{
  "mcpServers": {
    "chartnexus": {
      "command": "node",
      "args": ["/absolute/path/ChartNexus/packages/mcp/dist/main.js"]
    }
  }
}
```

宿主需要找到正确 Node 运行时。入口不依赖 cwd。不要把 `pnpm build && ...` 作为传输命令，构建输出会污染 MCP stdout。没有 HTTP 端点，不需要模型密钥。

## 工具
| 工具 | 参数 | 成功结果 |
| --- | --- | --- |
| list_capabilities | 无 | 图表/profile 与 Agent 运行限制 |
| get_chart_schema | 可选 mode: intent/echarts | 完整 Schema 或有独立 ID 的模式子集 |
| validate_chart | document | 精简的结构与语义校验结果 |
| compile_chart | document | ECharts RenderPlan |
| render_chart | document，可选 width/height | 临时 SVG 元数据与 resource_link |

所有工具拒绝额外参数。`validate_chart` 包含语义编译；已有 core `validateChart` 仅检查 JSON/结构。校验不保证所有原生配置都可渲染，因为原生检查范围有限。工具失败返回 `isError: true`、structuredContent 和 JSON 文本兜底，不擅自修复数据。

## 资源与生命周期
resources/list 提供能力、ChartDocument Schema、正确柱状图、字段错误修复示例和双语诊断。示例和诊断通过 `pnpm generate` 从源复制进 agent 包，`generate:check` 检查漂移。资源不依赖仓库 cwd。
`render_chart` 返回会话内 `chartnexus://artifacts/...svg` URI，通过 resources/read 读取，不是 HTTP 地址或磁盘路径。SVG 是静态图，显示支持取决于客户端。缓存10分钟、最多8项、合计16 MiB；淘汰/过期/跨会话读取明确报错，需要时重新渲染。元数据含字节数、SHA-256、过期时间，读取不会续期。

## 限制与信任
工具参数1 MiB、stdio 缓冲2 MiB、编译输出4 MiB；SVG 原始大小与 JSON 转义资源载荷均限制8 MiB。worker 渲染有5秒截止、可取消，每服务最多2并发。BUSY 立即失败，不无限排队。worker 不是 OS 沙箱、远程多租户隔离或实时 SLA。直接 renderSvg 仍同步、没有截止机制。
CLI/stdio 入口没有预载数据 registry，请使用内联数据；引用返回 DATA_NOT_FOUND。工厂接口可接收可信内存 registry。工具不能注册数据、读文件、请求 URL 或指定输出路径。资源缓存包含图表中的标签/数据，只连接获得授权的本地客户端。

## 验证流程与剩余工作
SDK 客户端测试启动真实进程，完成协商、工具/资源发现、错误字段诊断、修复、编译/渲染及 SVG 校验和读取。另测截止/取消、限制、缓存淘汰/过期、CLI 拒绝覆盖、传输错误。这不等于真实模型评测或桌面客户端显示验证。A2UI/OpenUI、远程 MCP、prompts 和客户端安装仍未实现。
