---
doc_id: contracts-03
version: "0.2"
status: experimental
updated: 2026-11-01
language: zh-CN
---
[Other language](../en/contracts-03.md)

# ChartDocument 0.3 与核心模块边界

0.3 为实验性、仅 intent 的版本，规范 Schema 包含十一种类型专属分支。十一种类型现均可编译：柱状、折线、饼图、散点、组合、漏斗、热力、雷达、树、桑基和地图；地图渲染需要可信宿主资产。见[四类新图契约](chart-expansion-03.md)。结构合法不代表渲染器已经支持。

## 契约与发现

`@chartnexus/schema` 导出 `chartDocument03Schema` 与 `projectChartSchema03(type)`，投影直接来自同一联合的精确分支。普通图表、雷达、树使用 inline/reference 表；桑基使用 `{kind:"graph",nodes:<table>,links:<table>}`；地图使用普通表与可信 `chart.mapRef:{id,revision}` 及显式色域。热力配置缺失会在结构层拒绝；未知字段不被删除，诊断带字段路径。数值范围、引用、键及受支持组合仍由编译验证。

MCP：`get_chart_schema({schemaVersion:"0.3",chartType:"bar"})`；CLI：`pnpm cli schema --schema-version 0.3 --chart-type bar`。Schema 工具默认仍为 0.1。完整 Schema 和已实现能力提供 `/0.3` 资源，十一种类型均进入 `charts`，同时声明各类限制和宿主资产要求。`getChartInputContract({schemaVersion:"0.3",chatPresentation:true})` 返回匹配的完整示例；为兼容已有宿主，默认推荐版本仍是 0.2。

## 显式迁移与身份

`migrateIntentTo03(document, registry?)` 先校验并编译旧 intent，再检查转换后的 0.3 结构。只修改版本，并将 `{theme:{id,version:"1"}}` 转为 `{theme:"light"|"dark"}`。不支持或与图表类型无关的旧字段会被拒绝，不静默丢弃。原生文档保留 0.1，迁移不会自动发生。

可选 `data.keyField` 指向已声明字段，值必须是最长 256 字符的唯一非空字符串。原始顺序和数值不变；`RenderPlan.rowKeys` 随 rowIndices 使用同一排序和选择映射。0.3 事件声明 `eventVersion:"0.3"`，键身份选择包含 `identity:"key"`、rowKey 和当前 rowIndex。未声明键时仍为位置身份；聚合点保留聚合元数据，不伪造行键。非致命提示包含 code/severity/path/message，可选 params。M3 为树、桑基和地图新增 node/edge/region 身份，详见扩充指南。

## 核心职责与评测基础

core 已拆分版本校验、数据表解析、旧版编译、显式变换、时间解析、组合/漏斗/热力处理及展示。分发入口不依赖 DOM、网络或模型 SDK。为确保数值等价，保留旧 0.2 内部已有的图表复用；四种 M3 类型使用独立编译器。

M0 源数据/option/行索引 golden 夹具及已有聚合、时间、单位、失败测试保护拆分。`scripts/evaluation-harness.mjs` 将模型可见提示词与预期数据哈希/渲染值分离，记录首次及最多两次修复结果，并要求模型、设置和编译器来源。合成测试仅验证框架，不是独立模型成绩。实际私有评测集不得进入 resources/retrieval；后续已完成的有范围评测见[M4证据](trial-distribution.md)。

见 [M1 spec](../../specs/0033-contracts-core/spec.zh-CN.md) 与 [任务](../../specs/0033-contracts-core/tasks.zh-CN.md)。
