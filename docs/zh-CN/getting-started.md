---
doc_id: getting-started
version: "0.1"
status: experimental
updated: 2026-11-01
language: zh-CN
---

# Quick start: embed a chart in a chatbot

[English](../en/getting-started.md)

这份教程从本仓库运行一个真实浏览器组件，不需要模型密钥、Ollama 或 MCP。0.3 仍是实验版本，包目前是私有 workspace 包，不能假设可从 npm 公网安装。

## 1. 准备并运行

安装 Node 22.22.3（或已验证的 24.22.1）、pnpm 11.25.0 和 Git；在终端执行：

```sh
git clone https://github.com/diysimon/ChartNexus.git
cd ChartNexus
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

在浏览器打开 `http://127.0.0.1:5173/quickstart.html`。应看到带 Jan、Feb、Mar 的柱状图、完整 JSON 和 `VALID · revision 1`。若 5173 被占用，请使用 Vite 实际打印的地址。按 `Ctrl+C` 停止服务。

## 2. 修改数据并体验失败恢复

在页面 JSON 的 `data.rows` 中把 `Jan` 的 `revenue` 改为 `200`，点击“更新图表”；状态 revision 增加。把 JSON 暂时改成 `{` 再点击，状态显示 `INVALID_JSON`，上一张图保留。也可以在完整文档中把 `chart.encoding.y.field` 改为 `missing`：这次会得到 `UNKNOWN_FIELD`，旧图仍保留。恢复完整文档后可以继续更新。JSON 中的 `id` 在同一图表更新期间保持稳定。

## 3. 复制到自己的宿主

查看并复制[页面](../../examples/playground/quickstart.html)、[组件代码](../../examples/playground/quickstart.ts)和[示例 ChartDocument](../../resources/recipes/chat-bar-03.json)。在浏览器构建工具中，宿主需要可解析 `@chartnexus/runtime` 和匹配的 `echarts@6.1.0` peer。仓库内宿主可使用 workspace 依赖；外部项目需要先由维护者提供可信的私有包/内部制品仓库。不要把尚不存在的公网 npm 安装命令当成可用方式。在这台机器上体验实际安装包：从仓库根目录执行 `pnpm test:packages`。脚本打包全部 11 个包，在隔离临时消费者中安装，并打印 `Retained isolated consumer: <path>`；它不是发布命令。消费者引用本机绝对 tarball 路径，不是可移植的发布包。把下方路径替换为打印出来的位置，启动其复制的示例：

```sh
cd /path/printed/for/chartnexus-consumer
pnpm exec vite examples/playground --host 127.0.0.1 --port 5174 --strictPort
```

打开 `http://127.0.0.1:5174/quickstart.html`，完成后按 `Ctrl+C`。如需自动运行安装后浏览器套件，先在仓库中执行 `pnpm exec playwright install chromium`，再执行 `pnpm test:packages --browser`。

例如，在已能解析这些依赖的 Vite 项目中，将配方保存为 `chart-document.json`，在页面添加容器，并从入口模块执行以下代码：

```html
<div id="chart" style="width: 100%; height: 320px"></div>
```

```js
import { mountChart } from '@chartnexus/runtime';
import chartDocument from './chart-document.json';

const container = document.querySelector('#chart');
if (!container) throw new Error('Chart container is missing');
const mounted = mountChart(container, undefined, {
  chatPresentation: { theme: 'light', background: 'transparent', detailLevel: 'standard' },
});
if (!mounted.ok) throw new Error(JSON.stringify(mounted.diagnostics));
const chart = mounted.value;
const result = chart.update(chartDocument);
if (!result.ok) console.error(result.diagnostics);
// In your host's component-unmount cleanup: chart.dispose();
```

代码的关键步骤：为容器设置非零宽高；调用 `mountChart(container, onSelect, { chatPresentation: settings })`；检查 `mounted.ok`；只对完整 ChartDocument 调用 `chart.update(document)` 并检查结果；组件卸载时调用 `chart.dispose()`。样例使用 `pagehide` 演示清理，真实框架应在组件卸载时清理。隐藏容器先等待可测量尺寸，或使用[等待挂载协调器](chat-host-quality.md)。

## 4. 接入模型或 GenUI 宿主

业务后端决定何时请求图表，提供经过授权的数据，模型负责输出完整 JSON；宿主缓冲流式片段，验证完成后再更新。无效输出显示诊断或文字/表格回退；不要补造事实。并发更新需要宿主使用有序更新控制器及真实 revision，不能直接依靠示例的简单 `update` 防止旧响应覆盖新响应。地图与数据引用还需宿主注册可信资产及精确版本。

选择 [OpenUI、A2UI 或 COSUI 接入指南](genui-integrations.md)，并查看[模型与 Agent 指南](agent-guide.md)、[能力目录](chart-catalog.md)及[责任边界](product-boundary.md)。这些适配 profile 有固定版本验证，不代表所有宿主、浏览器或模型已验证。上线前在真实应用检查容器、主题、网络/CSP、错误恢复、目标设备、数据权限与运行监控。
