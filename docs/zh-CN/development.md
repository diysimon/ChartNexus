---
doc_id: development
version: "0.2"
status: experimental
updated: 2026-10-31
language: zh-CN
---

# 开发基线

[Other language](../en/development.md)

这是本地、未发布的实验实现。OpenUI Lang React、COSUI JSON/San、COSUI Marklang 和 A2UI v0.9 React 图表 profile 均为实验功能；已有少量本地模型试验和有界的会话内 operation 去重；已实现 0.3 稳定行键与兼容图例状态保留。独立评测和更广泛的宿主验证仍待完成。

## 运行
使用 Node 22.22.3（基线）或受支持的 Node 24 运行时，pnpm 11.25.0。在项目根目录执行：

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm dev
pnpm demo:svg
pnpm exec playwright install chromium
pnpm test:browser
```

`pnpm dev` 构建包并启动本地 Vite，默认端口 5173。修改库代码后需重新构建。JSON 编辑器提供六种示例、诊断、编译配置和点击事件。SVG 保存到已忽略的 `outputs/`。无需模型密钥，不发起模型请求。

## 包与 API
- `@chartnexus/schema`：JSON Schema 源、生成的 ChartDocument、诊断/结果/数据类型。
- `@chartnexus/core`：`validateChart`（JSON 与结构校验）、`compileChart`（语义/能力校验与编译）、`capabilities`、`limits`。
- `@chartnexus/runtime`：`mountChart(container, onSelect?)` 返回包含 update/resize/dispose/getRevision 的 Result。一个运行时拥有一个容器和图表 ID。
- `@chartnexus/render`：`renderSvg(document, { width?, height?, registry? })` 返回静态 SVG 或诊断。

所有包均为私有 workspace；名字不代表 npm 已发布或 scope 已取得。当前使用完整 ECharts 包，模块化体积优化后续处理。

## 当前契约
Schema 版本 0.1，原生 echarts 或语义 intent 模式。intent 使用字段列表/对象行内联数据，或要求精确 revision 的宿主数据引用。x/y/series 显式映射。柱状/折线/饼图使用字符串分类，散点使用数值坐标。y 为数值或 null，饼图要求非负数。支持分组柱状/折线/散点，不支持分组饼图。同系列重复分类报错，空数据生成空 series。

缺失字段必须显式表示为 null。不做隐式转换、聚合、时间解析、联网解析或任意变换。引用来自可信的同步宿主 registry；原生模式目前仅使用 option 内联 dataset/data。原生 option 校验为有限检查，不是完整 ECharts Schema。

## 原生能力与限制
原生顶层组件：title、legend、grid、xAxis、yAxis、series、dataset、tooltip、color、backgroundColor、animation。series 支持 bar/line/pie/scatter。拒绝回调、transform、graphic、toolbox、rich、外部资源和链接钩子。tooltip 强制使用 ECharts richText，动画关闭。类似资源地址的字符串即使出现在标签中也会保守拒绝。
输入 1 MiB、深度 32、最多检查 100000 节点；100 字段、10000 行、50 系列、50000 个展开后的分类/系列点；尺寸不超过 4096；SVG 不超过 8 MiB。同步编译/渲染尚无硬超时和进程隔离。这些是保守起点，不是性能承诺；不用于公开托管不可信渲染服务。

## 运行时行为
完整更新使用 notMerge，删除系列不会留下旧数据。校验失败保留上一图表和 revision。渲染失败尝试恢复；恢复失败提示重新挂载。选择事件包含位置或聚合身份、图表 revision、数据 revision；0.3 可提供稳定行键，原生模式没有行映射。ResizeObserver 处理尺寸变化，dispose 清理监听和实例。兼容 chat/0.3 图例状态会保留，缩放状态保留不支持。

## 工程状态
`pnpm generate` 从 Schema 生成类型，`generate:check` 检查漂移；`docs:check` 检查双语清单和本地链接；`check` 汇总已实现本地门禁，浏览器测试单独运行。CI YAML 只是本地配置，不代表 GitHub 已运行或分支保护已启用。未配置发布任务。

参见 [SPEC-0001](../../specs/0001-core-foundation/spec.zh-CN.md) 与[执行证据](../../specs/0001-core-foundation/tasks.zh-CN.md)。历史计划保持为规划基线，当前实现范围以本页为准。

## Agent 入口
CLI 与本地 MCP stdio 已通过共同 Node agent 服务接入。参见[接入指南](agent-integration.md)了解命令、客户端配置、资源与限制。工具 worker 渲染有截止时间，直接 renderSvg 仍同步。

## OpenUI Lang 集成

运行 `pnpm dev` 后打开 `http://127.0.0.1:5173/openui.html`。演示使用真实 OpenUI React Renderer 与本地响应，不调用模型。`@chartnexus/adapter-openui` 导出 `createOpenUIChart({ registry?, onSelect?, onDiagnostics? })`，供 OpenUI library 注册。`ChartNexusChart(document)` 属性为完整 ChartDocument 的 JSON 字符串。生成提示词时应提供 `packages/schema/src/chart-document.schema.json` 和 `resources/recipes/`；`library.prompt()` 描述组件外壳，但不包含完整图表 schema。

OpenUI 流式期间适配器推迟更新，文档无效时保留上一张有效图。宿主拼接流式片段时必须保留上次提交的 response：错误的 OpenUI 程序可能在适配器处理前移除组件。原生和 intent 模式遵守现有核心限制，包括 1 MiB。更新使用稳定图表 ID，换 ID 时重新挂载；数据引用由宿主提供可信 registry。旧版选择事件使用位置或聚合身份，0.3 可提供稳定行键；`onDiagnostics` 返回错误，恢复时返回空数组。不接受模型提供的可执行回调。

验证基线为 OpenUI React Lang 1.0.2、React 19.2.4、Zod 4.3.6。这是实验性的 OpenUI Lang 组件 profile，不代表标准 A2UI、COSUI 或其他 OpenUI 宿主兼容。真实模型输出、SSR/水合、干净包安装、其他 SDK 版本和 npm 发布尚未验证。参见 [SPEC-0003](../../specs/0003-openui-adapter/spec.zh-CN.md)。

## 其他 GenUI 宿主

运行 `pnpm dev`，打开 `/cosui.html`、`/marklang.html` 或 `/a2ui.html`。每个演示均使用实际上游 SDK 和本地示例数据，不调用模型。版本、模型示例、生命周期及限制见 [GenUI 集成指南](genui-integrations.md)。

## 模型离线评测
运行 `pnpm eval:self` 验证参考样例，或运行 `pnpm eval:candidates /path/to/candidates.json` 评分本地候选文档。参见[评测基线](evaluation-baseline.md)和[模型入口](model-entry.md)。此过程不调用模型。

## 本地模型与 MCP 试运行
本机 Ollama 运行器、观察结果与限制见[本地模型试运行](local-model-pilot.md)，与离线样例自检分开记录。

## 本地 Ollama 图表体验页
运行 `pnpm dev:ollama`，访问 `http://127.0.0.1:5180/ollama.html`；见[使用说明与限制](ollama-playground.md)。

### 图表更新顺序控制

`createUpdateController(runtime)` 是可选的会话内包装器。异步工作开始前读取 `runtime.getRevision()`，然后调用 `commit({ operationId, baseRevision, complete: true, document }, registry?, signal?)`。未完成操作使用 `complete: false` 且不带 `document`，返回 `pending`。相同 ID 和规范化内容（包含 registry）的成功重试返回 `duplicate`；内容改变则冲突。基础版本过期或提交前信号已取消时不会调用运行时；失败更新可以重试。去重缓存最多保留 128 条签名、4 MiB 和 10 分钟；淘汰后仍检查版本。控制器和运行时由宿主分别销毁。控制器不能中断同步渲染，不负责保持缩放或图例状态、流式传输，也不会自动保护协议适配器；宿主须主动接入并提供版本。

### 实验性 0.2 intent 子集

独立的 0.2 Schema 在 0.1 intent 数据语义之上支持：柱状图 `chart.orientation: "horizontal"`、折线图 `chart.area: true`、饼图 `chart.donut: true`，以及 `presentation.theme` 的 `{ "id": "light" | "dark", "version": "1" }`。主题编译为 JSON option，不加载外部资源；不声称无障碍合规。`migrateIntent01To02` 显式转换 Schema 合法的 0.1 intent 文档且不修改输入，原生模式迁移会被拒绝。`validateChart` 检查结构，`compileChart` 进一步检查支持的组合和数据语义。原有 0.1 行为保持不变。0.2 原生模式和任意主题覆盖尚未实现。`get_chart_schema` 工具默认返回 0.1；0.2 可传入 `schemaVersion: "0.2"` 或读取 `chartnexus://schema/chart-document/0.2`。参见[预览](../../examples/playground/core-02.html)。

### 0.2 显式排序

柱状、折线或饼图可设置 `chart.sort`，格式为 `{ "by": "category" | "value", "order": "ascending" | "descending", "nulls": "first" | "last" }`。排序须显式启用，相等项保留原有顺序；分类按 UTF-16 代码单元顺序比较，不受语言环境影响。null 位置不受升降序影响。分类排序会同步对齐各分组系列；带分组字段的数值排序以及散点排序会拒绝，不进行隐式聚合。点击事件的 `rowIndex` 仍指向对应数据 revision 中的原始行，而非排序后的位置；它不是跨版本稳定行 ID。本功能不提供语言环境排序。

### 0.2 单位与日历日期

柱状、折线和散点图可设置 `chart.encoding.y.unit`，例如 `{ "kind": "currency", "code": "USD" }`、`{ "kind": "unit", "label": "kg" }` 或 `{ "kind": "percent", "scale": "percent" | "ratio" }`。货币代码只检查三个大写 ASCII 字母，不核验货币注册表。`percent` 的 25 表示 25%；`ratio` 的 0.25 表示 25%。编译器只标注数值轴，不换算数值，也不将 ratio 格式化成百分数。饼图单位当前拒绝。

仅折线图可将 x 设置为 `{ "field": "day", "type": "temporal", "temporalKind": "date" }`，数据必须为 1000–9999 年有效公历 `YYYY-MM-DD`。渲染坐标使用 UTC 零点和 ECharts `useUTC`，保留日历日期，不猜测本地时区。系列默认不自动排序，可显式指定排序。下文说明带偏移时间点的支持范围；不支持本地时间、其他历法或命名时区。参见[日期 Spec](../../specs/0018-temporal-date/spec.zh-CN.md)和[单位 Spec](../../specs/0017-quantity-units/spec.zh-CN.md)。

### 0.2 显式聚合

柱状、折线和饼图可以声明 `chart.aggregate: { "op": "sum" | "mean" | "count" }`；编译器按编码 x 分类及可选系列字段分组。`count` 统计非 null 数值 y；sum/mean 忽略 null，全 null 组返回 null；不存在的分类/系列组合仍为空位。除非显式使用受支持的排序，顺序按首次出现确定。有限 IEEE-754 运算不保证十进制精确算术；溢出时报错。带 y 单位的 count、散点聚合、分组按数值排序均被拒绝；聚合后的饼图仍需非负且非 null。

渲染计划的 `aggregatePoints` 与系列数据对齐，包含操作、分类、系列、来源行数及非 null 行数。选择事件返回 `identity: "aggregate"`、`rowIndex: null` 及这些元数据，不暴露原始行或来源行索引；空位没有聚合身份。非聚合事件仍使用位置身份。聚合元数据受数据 revision 约束，不是稳定行 ID。详见 [Spec](../../specs/0019-explicit-aggregation/spec.zh-CN.md)。

### 可选的原生严格校验

`validateNativeStrict(document)` 检查实验性的 0.1 `mode: echarts` 有限子集：使用显式数据的柱状/折线分类图、数值散点或单饼图。未知嵌套字段、重复分类/饼图名称、数据长度不匹配及不兼容坐标轴会被拒绝。它先应用现有原生安全 guard，再检查 [option Schema](../../packages/schema/src/native-strict-basic-0.1.schema.json) 和跨字段规则。允许的组件和选项范围很小；dataset、任意样式等可能是合法 ECharts，但不在此子集。通过并不证明完整 ECharts 语义、数据真实性或视觉质量。

MCP 调用 `validate_chart` 时传入 `nativeValidation: "strict-basic-0.1"`；成功返回 `native-strict-basic-0.1`，失败不会静默降级。默认仍为 `guarded-native-partial`。可读取 `chartnexus://schema/native-strict-basic/0.1` 和 `chartnexus://capabilities/native-strict-basic-0.1` 发现能力。编译和渲染仍使用默认 guard；需要严格模式的宿主必须在提交前显式验证同一文档。本检查不改变 0.1 原生渲染行为。

### 0.2 数据标签与图例

可设置 `presentation.dataLabels: { "show": true | false }`，以及 `presentation.legend: { "show": true | false, "position": "top" | "bottom" }`；两个对象都要求 `show`，省略则保持现有默认值。标签使用对应图表类型的 ECharts 默认内容，不执行 formatter 或百分比换算。顶部图例为直角坐标图留出空间；实际布局仍取决于数据、图表尺寸与字体。选择明暗主题时，显式开启的标签使用主题前景色。这不代表所有场景都可读或符合无障碍要求，也不支持自定义格式或图例状态保持。

### 0.2 显式时间点

折线图 x 可使用 `type: "temporal", temporalKind: "instant"`，例如 `2024-03-01T08:00:00+08:00` 或 `2024-03-01T00:00:00Z`。必须给出完整时间和明确偏移；偏移不超过 ±14:00，小数秒为 1–3 位。未知偏移 `-00:00`、闰秒、无效日期、本地日期时间及数值时间戳会被拒绝。图表以 UTC 坐标和 UTC 显示，不猜测本机时区。显式按分类排序时比较实际时间，而非字符串；未排序时保留输入顺序。同图内不同字符串指向相同时间点时（包括跨分组）会被拒绝，以避免静默合并。保留原始输入和来源行映射；不支持指定命名展示时区。见 [Spec](../../specs/0022-explicit-instants/spec.zh-CN.md)。

### 按版本发现 Schema

MCP `get_chart_schema` 支持可选 `schemaVersion: "0.1" | "0.2" | "0.3"` 和 `mode`；0.3 还可用 `chartType` 获取分支投影。默认仍为 0.1；0.2/0.3 仅支持 intent，若同时请求 `mode: "echarts"` 会返回 `UNSUPPORTED_CAPABILITY`。CLI 可使用 `pnpm cli schema --schema-version 0.3 --chart-type bar`。可用分支与渲染限制见支持矩阵。

### 0.2 柱线组合与漏斗图

`chart.type: "combo"` 用同一分类 x 和数据行创建 `encoding.y` 的柱状系列及 `chart.secondary.field` 的折线系列。共享轴（默认或 `secondary.axis: "shared"`）要求两个指标声明相同单位或都不声明；不声明时由宿主确认量纲相容。显式指定 `secondary.axis: "right"` 时，两个指标均须声明单位，允许不同单位但不换算数值。双轴可能因刻度不同夸大关系，需要谨慎解读。当前不支持系列分组、聚合、按值排序、时间 x、横向或面积变体。参见[组合图示例](../../resources/recipes/combo.json)。

`chart.type: "funnel"` 使用分类 x 和非负数值 y；除非显式使用受支持的排序，否则保留输入顺序。不推断转化率或隐式排序。不支持分组、单位、环形/面积/横向变体。参见[漏斗图示例](../../resources/recipes/funnel.json)。两种 profile 均为实验性，渲染成功不代表选图或视觉质量已验证。

### 0.2 分类热力图

使用 `chart.type: "heatmap"`，为 x/y 指定 ordinal 字符串字段，并用 `chart.heatmap: { "field": "orders", "min": 0, "max": 10 }` 指定不同的数值字段。范围须显式且上下限不同；非 null 值超出范围会被拒绝。null 不生成可绘制格，零仍是零；即使其中一行是 null，重复 x/y 组合仍会拒绝，稀疏格不会被填造。分类按首次出现顺序排列；点击可见格返回原始行索引。首个 profile 不支持排序、分组、聚合、单位或标签/图例覆盖，使用固定颜色范围。参见[示例](../../resources/recipes/heatmap.json)与 [Spec](../../specs/0027-heatmap/spec.zh-CN.md)。

## M0 语义修正

意图饼图/环图区分正数、空数据和全零。零总量不绘制扇区，即使在最简档也显示 “No shares: all values are zero.” 并返回信息提示。空数据不绘制占位圆。浏览器离开 no-share 或销毁时恢复宿主 ARIA 属性。原生图表保留原行为，漏斗不继承占比语义。

分组序列 ID 现在编码分组字段、原始分组值和度量字段。空名称使用首个未占用的 `(empty)` / `(empty) [n]`，非空值保持不变。`seriesMetadata` 保留原始值；原有分组 ID 会改变，不应跨此编译器变更持久化。事件行身份仍为位置或聚合。

Recipe 副本、发现和检索从 [manifest](../../resources/recipes/manifest.json) 生成。`docs:check` 检查 frontmatter 状态与清单一致、双语更新日期一致。见 [语义 spec](../../specs/0031-intent-semantics/spec.zh-CN.md) 与 [入口 spec](../../specs/0032-model-entry-consistency/spec.zh-CN.md)。

## M1/M2 实施

当前版本发现、迁移、尺寸、数据表、生命周期、图例保留及真实本地 Ollama 流式证据见 [0.3 契约](contracts-03.md) 与 [聊天宿主质量/支持矩阵](chat-host-quality.md)。旧 spec 的验证记录保留为历史证据。

## M3 图表扩充

0.3 在原有七类基础上新增雷达、树、桑基和可信区域地图。见[契约、宿主 MapRegistry、模型资源和预览](chart-expansion-03.md)。浏览器/SVG/worker 与四种固定上游 SDK 路径已有本地证据；M4 模型评测和分发仍是独立工作。固定渲染器标签回调保留原文，仍禁止模型回调。

## M4 验证命令

`pnpm test:packages --browser` 在隔离消费者验证 11 个 tarball；`pnpm benchmark` 执行体积预算并记录性能；`pnpm eval:independent:check` 检查独立评分器。完整真实评测仅手动、本机运行，可能耗时数小时，见[试用/分发](trial-distribution.md)和[支持矩阵](support-matrix.md)。Node 22.22.3 与 24.22.1 安装已在本地和 Linux CI 通过。仅在具备完整元数据/内容缓存时追加 `--offline`；最终评测及精确版本 CI 状态见 M4 证据。
