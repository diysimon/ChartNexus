---
doc_id: chart-expansion-03
version: "0.1"
status: experimental
updated: 2026-10-31
language: zh-CN
---
# 0.3 的四类有界图表

[English](../en/chart-expansion-03.md)

## 契约与支持范围

雷达、节点连线树、桑基和区域地图扩展实验性 **0.3 intent**。十一种分支现均可编译，0.1/0.2 和原生模式的能力范围不变。通过 `get_chart_schema({schemaVersion:"0.3",chartType:"radar"})` 获取精确分支，`list_capabilities` 获取限制。完整 ECharts 配置、矩形树图、自动采集数据和在线地图不在本 profile 内。

| 类型 | 数据及规则 | 身份与展示 |
| --- | --- | --- |
| radar | 普通表每行一个对象；1–6 个唯一非空名称、3–8 个不同数值指标、显式有限 min < max 和可选单位。拒绝 null、缺失、重名和越界。 | 原始行或可选行键；摘要说明各指标独立范围，不归一化、不猜范围。多对象需要图例。 |
| tree | 普通表 id/parentId/label 字段引用；唯一根的 parent 为 null，1–1000 个唯一 ID、合法父节点、无环且可达，根深度0、最大16。label 可重复。 | 稳定节点 ID。initialDepth 可选0–2，默认2；拓扑/编码相同时重排、更新、resize 保留折叠状态，拓扑变化重置。不把子节点数当数值。 |
| sankey | graph 含独立 inline/reference 的 nodes/links 表，原子解析且合计≤1MiB。≤200 节点/1000 边，唯一节点 ID、合法端点、无有向环/自环/重复有向边、有限非负权。 | 节点 ID 和有序端点对边 ID；重复显示标签保持独立。零边及无正流量节点不绘制，但完整表保留。报告流入/流出/差额，不推断守恒或百分比。 |
| map | 普通表、明确 region/value 字段、mapRef id/revision、显式有限 colorDomain min < max。拒绝重复/未知区域及非 null 越界值，≤1000 行。 | 稳定区域 ID；没有来源行时 rowIndex 为 null。0 是实测值，null 和缺失用缺失色，原始/渲染表区分 provided/absent。 |

所有输入为 JSON，不静默重命名、归一化、排序或求和。完整源表和原始图边可访问，并写入 SVG 元信息。雷达指标单位仅描述数据，不转换原始值。

## 渲染、状态与导出

两主题、透明背景和五档展示复用聊天展示规划器。必要雷达图例、树/桑基标签和地图色阶保留；密集布局可显式回退为浏览器数据表，或返回 SVG EXPORT_LIMIT。图形宽度小于320px时回退，不强行挤压标签。视觉截断时表格仍保留完整原文。地图标签启用时使用声明主题的背景色衬底，不假设所有区域填色都能提供文字对比度。

共享 ECharts 桥安装固定的桑基标签/提示回调，按原文返回源标签，包含 ECharts 模板符号。RenderPlan 仍是 JSON，不接受或执行模型提供的回调/代码。稳定内部 ID 与显示标签分离。

树图 SVG 明确标为**初始折叠概览**，标题/元信息包含完整源层级。它不导出浏览器当前展开状态，也不声称每个后代都可见。浏览器展开不改变数据或 revision，拓扑变化重置展开。选择事件带 eventVersion 0.3，identity 为 node/edge/region 并关联原始行；雷达保持行/行键选择。空桑基或全零流量不会绘制虚构流。不支持缩放状态保留。

## 可信地图资产

`@chartnexus/echarts` 是共享本地 workspace 包，复用既有 ECharts 6.1.0 peer。`createMapAsset(input)` 克隆校验宿主资产、规范化 FeatureCollection，并在 Node/浏览器同步计算相同 SHA-256。宿主字段为 id、revision、coordinateSystem:"WGS84"、license、provenance、geoJSON。每个 feature 的唯一 properties.name 对应文档区域键。仅接受 Polygon/MultiPolygon、有限二维坐标、经度±180/纬度±90、闭合且非退化的环。不做 CRS 转换，不支持 SVG 地图、GeometryCollection 或跨反经线线段。这是有界结构验证，不是完整 GIS 拓扑认证，例如不证明环绝无自交；宿主负责几何正确性及分发权利。

每个宿主资产 JSON ≤5MiB、合计20000坐标点、1000个 feature。共享 ECharts 注册上限为每模块实例8个版本、20MiB规范化几何。注册名包含 id/revision/hash；重复使用相同资产不增容量，同 id/revision 改几何会拒绝。ECharts 没有注销接口，dispose 不释放此容量；耗尽后需新的渲染进程/worker。保留命名空间内的外部覆盖可被检测，不要直接用 `chartnexus:` 名称注册地图。

```ts
import { createMapAsset, mapCatalog } from '@chartnexus/echarts';
import { mountChart } from '@chartnexus/runtime';
import { compileChart } from '@chartnexus/core';
// assetInput 是可信宿主 JSON，不是模型工具参数。
const prepared = createMapAsset(assetInput);
if (!prepared.ok) throw new Error('Invalid host map');
const maps = { [prepared.value.id]: prepared.value };
const plan = compileChart(chartDocument, dataRegistry, mapCatalog(maps));
const mounted = mountChart(container, onSelect, { maps, chatPresentation: {} });
if (mounted.ok) mounted.value.update(chartDocument, dataRegistry);
```

renderSvg、createAgentService、OpenUI/A2UI/COSUI/Marklang 适配器也接收同一 `maps` 宿主选项。core 通过 MapCatalog 只接收元信息/区域键；渲染器重新校验几何/hash，Node worker 接收宿主快照并在已有时限/内存/输出预算下执行相同检查。Agent 的 list_capabilities 只暴露注册元信息/键，不包含坐标。默认 CLI/MCP 进程没有地图；地图 recipe 需要配置宿主。模型参数不能注册资产、选择文件/URL 或绕过 registry。

[项目自制矩形](../../examples/maps/two-regions.json)是 Apache-2.0 合成测试数据，不代表行政边界。[地图 recipe](../../resources/recipes/map-03.json)引用 two-regions@1，manifest 明示宿主要求。本项目未打包或下载真实行政边界。

## 预览、模型资源与证据

运行 `pnpm dev` 后打开 `/expansion.html`，可切换图表/主题/档位/宽度、编辑完整 JSON、查看完整数据和点击图元。已有上游宿主演示也接受 `?m3=radar|tree|sankey|map` 加载同一组自制样例。[雷达](../../resources/recipes/radar-03.json)、[树](../../resources/recipes/tree-03.json)、[桑基](../../resources/recipes/sankey-03.json)和地图 recipe、负例变更、能力限制、诊断和 MCP/RAG 副本由规范资源生成。

见 [SPEC-0035](../../specs/0035-chart-expansion/spec.zh-CN.md)及[验收证据](../../specs/0035-chart-expansion/tasks.zh-CN.md)。本地编译/浏览器/SVG/worker/固定上游 SDK 验证不等于真实模型成功率。M4 隐藏集评测、全包干净安装、性能基线、远端 CI 和发布仍待完成，不声称所有协议/模型兼容或全面无障碍认证。
