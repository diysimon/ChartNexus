---
doc_id: genui-integrations
version: "0.2"
status: experimental
updated: 2026-11-01
language: zh-CN
---

# GenUI 图表集成指南

[English](../en/genui-integrations.md)

## 已测试的 profile

| Profile | 测试依赖 | 宿主 | 入口 |
| --- | --- | --- | --- |
| OpenUI Lang | `@openuidev/react-lang` 1.0.2、React 19.2.4、Zod 4.3.6 | React Renderer | `@chartnexus/adapter-openui` |
| COSUI JSON | `@cosui/cosmic-dynamic-ui` 1.0.0、`san` 3.15.5 | `UIJSON.compile` | `@chartnexus/adapter-cosui` |
| COSUI Markdown | `marklang` 1.0.1 | Marklang `renderToElement` | `@chartnexus/adapter-cosui/marklang` |
| A2UI v0.9 | `@a2ui/react` 0.9.1、`@a2ui/web_core` 0.9.2、React 19.2.4、Zod 3.25.76 | 官方 MessageProcessor 和 React Surface | `@chartnexus/adapter-a2ui` |

A2UI 包版本是 SDK 版本，消息协议为 v0.9。OpenUI 继续使用 Zod 4.3.6，并单独回归测试。这些是本地实验性工作区包，不代表 npm 发布。所有图表输入均由现有 core 校验，受其能力 profile 和资源上限约束。

## OpenUI Lang

在 `createLibrary({ components: [chart], root: 'ChartNexusChart' })` 中注册 `createOpenUIChart(options)`，再把 library 传给上游 React `Renderer`。组件接收 JSON 编码的 ChartDocument 字符串。[完整可运行宿主](../../examples/playground/openui.ts)展示 OpenUI 程序、转义、诊断、选择、流式和生命周期。运行 `pnpm dev` 后打开 `/openui.html`，使用页面按钮切换示例或触发错误。OpenUI 负责解析程序；流式期间宿主应保留上次提交的响应，图表 ID 改变时重新挂载。这是已测试的 OpenUI Lang profile，不等于标准 A2UI。

## COSUI JSON

在宿主 `components` 映射中将 `createCosuiChart(options)` 注册为 `chartnexus-chart`；通过 Dynamic UI 数据模型将完整 ChartDocument 绑定到 `document` 属性。参见[可运行宿主](../../examples/playground/cosui.ts)。`onSelect`、`onDiagnostics` 是宿主回调；San 组件也会发出 `chart-select` 和 `chart-diagnostics`。`appendData` 设置顶层字段，并非图表文档 patch。宿主必须缓冲不完整协议消息并提交完整文档替换。引用数据由宿主提供可信 registry；更换图表 ID 时重新挂载。

## COSUI Marklang

使用 `createMarklangCharts(container, options)`，调用 `update(source, complete)`，销毁时调用 `dispose()`。使用 `marklangDataSource(name, document)` 创建数据块。面向模型的输入形态例如：

````markdown
::ml-chartnexus{data="sales"}

:::ml-data{name="sales"}
```json
{"schemaVersion":"0.1","id":"sales","mode":"echarts","option":{"series":[]}}
```
:::
````

示例 JSON 仅展示结构；完整有效文档请参照权威 schema 和 [柱状图 recipe](../../resources/recipes/bar.json)。数据名必须唯一，最多 64 个 ASCII 字符，以字母开头，其后仅允许字母、数字、下划线、连字符。缺失、重复或无效的图表数据产生诊断。最多 16 张图、1 MiB Markdown。传入 `complete: false` 时不改动现有图表；片段组装和完整性判定由宿主负责。完整输入先校验，并在可测量暂存区挂载全部图表后原子替换；任何暂存失败均保留旧图。

**信任边界：**上游 Marklang 可能渲染 Markdown 中的 HTML。本适配器不净化通用 Markdown 或 HTML；宿主应仅传入可信内容或另行净化，并配置适当的安全策略。SSR、水合、真实流式传输以及其他 Markdown 功能尚未验证。

## A2UI v0.9

`createA2uiChart(options)` 返回自定义组件实现，注册到 A2UI v0.9 `Catalog` 后处理标准 `createSurface`、`updateComponents`、`updateDataModel`、`deleteSurface` 消息。参见[可运行宿主](../../examples/playground/a2ui.ts)。模型可生成如下组件，并将序列化 ChartDocument 绑定到 `/document`：

```json
{"id":"root","component":"ChartNexusChart","document":{"path":"/document"}}
```

数据模型中的值是 **JSON 字符串**，不是 JavaScript。例如将[柱状图 recipe](../../resources/recipes/bar.json) 序列化后用 `updateDataModel` 设置。只要组件保持挂载，不完整或无效 JSON 会返回诊断并保留上一张图。选择事件通过配置的宿主回调提供；这不是 A2UI 标准 action 事件，也不自动传输给 Agent。宿主负责缓冲和校验协议帧及处理 surface 删除。默认文档模式不提供版本排序或去重；可选择下述顺序更新模式。

## 证据与限制

本地 `pnpm check`、`pnpm test:browser` 覆盖真实 Dynamic UI、Marklang、A2UI React 宿主和 OpenUI 回归。示例验证 intent/原生模式、替换、无效输入、恢复、选择和释放；Marklang 另测不完整输入及重复/缺失引用，A2UI 另测不完整 JSON。固定宿主测试及干净外部安装的证据见[支持矩阵](support-matrix.md)，不能证明真实模型生成的协议程序、远端流式传输、SSR/水合、发布、移动设备或其他 SDK 版本。体积实测见[M4证据](trial-distribution.md)。Dynamic UI 源码仓库标记 Apache-2.0，但安装包元数据标记 ISC，发布前需厘清分发声明。

### 可选的 A2UI 顺序更新 profile

在 `createA2uiChart` 中设置 `orderedUpdates: true`，将 `document` 绑定到 JSON 编码的 ChartNexus operation，而非 ChartDocument。异步工作开始前捕获图表版本；完整更新使用 `{ "operationId": "unique-id", "baseRevision": 0, "complete": true, "document": ... }`，未完成时使用 `complete: false` 且不带 `document`。`onUpdateReceipt` 返回 `applied`、`duplicate` 或 `pending`，`onDiagnostics` 报告冲突和错误。宿主从成功回执维护版本，重新挂载后重置，并为不同任务使用新 ID。参见 [A2UI 顺序更新示例](../../examples/playground/a2ui-ordered.ts)。这是 ChartNexus 宿主 profile，并非 A2UI 协议特性。传输、消息缓冲及发布操作前的取消由宿主负责；组件不提供传输级取消。控制器仅作用于当前会话，去重受资源上限约束，详见[开发指南](development.md)。

### 缓冲已解码的图表流

`createChartStreamBuffer(operationId, baseRevision)` 帮助宿主拼接一个已解码的 JSON ChartDocument。工作开始前捕获版本，追加文本片段，并仅在流成功结束后调用 `finish()`；将其返回的 operation 交给 A2UI 顺序更新 profile。取消或传输错误时调用 `cancel()`，并由宿主另行中止或关闭传输。失败后的缓冲器不可复用，重试需要新建。缓冲器限制文档为 1 MiB UTF-8、最多 16384 个片段；operation 和 registry 还须共同满足控制器的 1 MiB 检查上限。完成时只解析 JSON，运行时会在渲染前校验 ChartDocument。[示例](../../examples/playground/a2ui-ordered.ts)使用本地生成的 ReadableStream，并非模型或 A2UI 流式传输。对于字节流，宿主须增量解码并在结束时刷新解码器。

### OpenUI 和 COSUI JSON 顺序更新 profile

创建 `createOpenUIChart` 或 `createCosuiChart` 时设置 `orderedUpdates: true`。OpenUI 的 `document` 参数是 JSON 编码的 operation 字符串；COSUI JSON 的 `document` 属性直接传入 operation 对象。宿主必须在异步工作开始前捕获当前图表版本、提供唯一操作 ID，并通过 `onUpdateReceipt` 跟踪版本；COSUI 同时触发 `chart-receipt`。这是 ChartNexus 宿主扩展，并非协议定义的版本或事件。OpenUI 的 renderer 报告流式状态期间仍会推迟提交。未完成、过期及失败操作不会更新图表；已成功操作的重复投递返回已有回执。缓冲、取消和发布时机由宿主负责。参见[组合示例](../../examples/playground/ordered-protocols.ts)。COSUI Marklang 不使用此 profile。

### GenUI 宿主中的聊天展示

`createA2uiChart`、`createOpenUIChart` 和 `createCosuiChart` 接受可选、由宿主持有的 `chatPresentation` 设置，并使用 runtime 相同的 0.2/0.3 intent 聊天 profile；不传时保持原行为。A2UI、OpenUI 和 COSUI JSON 已在本机验证深色透明设置与顺序更新。Marklang 已接受此设置，采用整个文档的事务更新。主题不会自动追踪宿主；宿主需要管理设置并触发更新或重新挂载。详见[聊天展示指南](chat-presentation.md)。

## M1/M2 实施

当前版本发现、迁移、尺寸、数据表、生命周期、图例保留及真实本地 Ollama 流式证据见 [0.3 契约](contracts-03.md) 与 [聊天宿主质量/支持矩阵](chat-host-quality.md)。旧 spec 的验证记录保留为历史证据。

## M3 图表扩充

0.3 在原有七类基础上新增雷达、树、桑基和可信区域地图。见[契约、宿主 MapRegistry、模型资源和预览](chart-expansion-03.md)。浏览器/SVG/worker 与四种固定上游 SDK 路径已有本地证据；M4 模型评测和分发仍是独立工作。固定渲染器标签回调保留原文，仍禁止模型回调。
