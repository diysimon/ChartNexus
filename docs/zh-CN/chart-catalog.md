---
doc_id: chart-catalog
version: "0.1"
status: experimental
updated: 2026-11-01
language: zh-CN
---

# 图表与能力目录

[English](../en/chart-catalog.md)

实验性的 0.3 intent 支持以下 11 类有边界的图表。示例是合成数据，只展示契约，不是事实答案。以下链接均为完整的 0.3 配方；更早的 0.1/0.2 配方仍保留在清单中。生成时请使用对应类型的 0.3 分支 Schema。

| 图表 | 输入结构与主要限制 | 可运行配方 |
| --- | --- | --- |
| 柱状 bar | 分类 x、数值 y；支持横向 | [0.3 柱状](../../resources/recipes/chat-bar-03.json) |
| 折线 line | 分类或明确的时间 x、数值 y；支持面积 | [0.3 折线](../../resources/recipes/line-03.json) |
| 饼图 pie | 分类和非负数值；不会虚构零总量占比 | [0.3 饼图](../../resources/recipes/pie-03.json) |
| 散点 scatter | 数值 x 和 y | [0.3 散点](../../resources/recipes/scatter-03.json) |
| 组合 combo | 一组柱和一条线，需满足坐标轴和单位规则 | [0.3 组合](../../resources/recipes/combo-03.json) |
| 漏斗 funnel | 分类及非负数值，不推断转化率 | [0.3 漏斗](../../resources/recipes/funnel-03.json) |
| 热力 heatmap | 分类 x/y、数值色阶；必须指定 min/max，不允许重复单元 | [0.3 热力](../../resources/recipes/heatmap-03.json) |
| 雷达 radar | 必须明确指标和范围 | [0.3 雷达](../../resources/recipes/radar-03.json) |
| 树 tree | 唯一节点 ID、父节点引用及单一无环根节点 | [0.3 树](../../resources/recipes/tree-03.json) |
| 桑基 sankey | 节点与非负、无环的连接 | [0.3 桑基](../../resources/recipes/sankey-03.json) |
| 地图 map | 区域数据、明确色阶范围及可信宿主地图资产与版本 | [0.3 地图](../../resources/recipes/map-03.json) |

启用聊天 profile 后，宿主可控制明/暗主题、透明或宿主指定背景及 minimal/simple/standard/detailed/comprehensive 五档密度，宿主设置优先。原生 ECharts 0.1 输入是独立模式，使用受限的部分校验。具体规则及验证版本见[契约](contracts-03.md)、[展示](chat-presentation.md)和[支持矩阵](support-matrix.md)。

执行 `pnpm dev`，打开 `/chat.html` 查看展示效果、`/expansion.html` 查看雷达/树/桑基/地图，打开 `/openui.html`、`/a2ui.html`、`/cosui.html`、`/marklang.html` 查看宿主集成。[配方清单](../../resources/recipes/manifest.json)列出资源 URI、反例和地图前置条件。
