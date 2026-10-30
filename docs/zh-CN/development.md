---
doc_id: development
version: "0.1"
status: experimental
updated: 2026-10-30
language: zh-CN
---

# 开发基线

[Other language](../en/development.md)

这是本地、未发布的实验实现。协议适配器、模型评测、operation 去重、稳定行 ID 和交互状态保留尚未实现。

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
完整更新使用 notMerge，删除系列不会留下旧数据。校验失败保留上一图表和 revision。渲染失败尝试恢复；恢复失败提示重新挂载。选择事件包含位置行身份、图表 revision、数据 revision，原生模式没有行映射。ResizeObserver 处理尺寸变化，dispose 清理监听和实例。暂不保留缩放和图例状态。

## 工程状态
`pnpm generate` 从 Schema 生成类型，`generate:check` 检查漂移；`docs:check` 检查双语清单和本地链接；`check` 汇总已实现本地门禁，浏览器测试单独运行。CI YAML 只是本地配置，不代表 GitHub 已运行或分支保护已启用。未配置发布任务。

参见 [SPEC-0001](../../specs/0001-core-foundation/spec.zh-CN.md) 与[执行证据](../../specs/0001-core-foundation/tasks.zh-CN.md)。历史计划保持为规划基线，当前实现范围以本页为准。

## Agent 入口
CLI 与本地 MCP stdio 已通过共同 Node agent 服务接入。参见[接入指南](agent-integration.md)了解命令、客户端配置、资源与限制。工具 worker 渲染有截止时间，直接 renderSvg 仍同步。
