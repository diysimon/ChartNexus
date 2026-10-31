---
doc_id: model-entry
version: "0.1"
status: experimental
updated: 2026-10-31
language: zh-CN
---

# ChartNexus：模型与 Agent 入口

[English](../en/model-entry.md)

ChartNexus 将受限的 JSON 图表文档编译为 Apache ECharts。先读取 `chartnexus://capabilities/basic-0.1`，再按需读取 `chartnexus://schema/chart-document/0.1` 和相关示例。机器可读目录位于 `chartnexus://resources/index/0.1`；完整 JSONL 检索资源位于 `chartnexus://resources/retrieval/0.1`。来源与内容哈希也保存在[检索索引](../../resources/model-index.json)；哈希对应权威源文件字节，不一定等于序列化后的 MCP 响应。

简洁的柱状、折线、饼图或散点图使用 `mode: intent`；受限的原生 JSON option 使用 `mode: echarts`。不要编造字段或能力、执行代码、包含可执行回调、获取 URL、隐式聚合或将 null 当零；使用真实字段和值。原生校验为部分校验，并非完整 ECharts API。

使用 `validate_chart` 做结构和语义校验；失败后查看诊断码及路径、读取修复示例、修改文档并重新校验。`compile_chart` 返回 ECharts 计划；`render_chart` 返回会话内静态 SVG 资源。交互由浏览器宿主提供。数据引用依赖宿主提供的可信 registry 和 revision，不要编造可访问的数据集。

从[柱状图示例](../../resources/recipes/bar.json)、[字段错误示例](../../resources/recipes/unknown-field.json)、[诊断说明](../../resources/diagnostics.json)和 [GenUI 宿主指南](genui-integrations.md)开始。[20 任务开发集](../../resources/evaluation/tasks.json)为公开合成样例，不是隐藏基准，也不代表真实模型成绩；评分与限制见[评测指南](evaluation-baseline.md)。

对于浏览器宿主的顺序更新，宿主须在异步生成前捕获 `baseRevision` 并提供唯一 `operationId`；不要编造版本。遇到 `REVISION_CONFLICT` 时须获取当前版本并处理过期任务后再重试。内容改变时需要新的操作 ID。可选的 A2UI、OpenUI 和 COSUI JSON 宿主 profile 使用相同的 ChartNexus 操作契约；这不是协议原生保证。详见 [GenUI 宿主指南](genui-integrations.md)。

实验性、仅 intent 的 0.2 profile 可通过 `chartnexus://capabilities/basic-0.2` 和 `chartnexus://schema/chart-document/0.2` 发现。`get_chart_schema` 工具默认返回 0.1；传入 `schemaVersion: "0.2"` 可获取 0.2 intent Schema。原生 0.1 仅进行受控的部分校验，校验结果标记为 `guarded-native-partial`。

实验性 0.2 柱状、折线或饼图排序须显式设置 `chart.sort`，包含 `by`（`category` 或 `value`）、`order`（`ascending` 或 `descending`）和 `nulls`（`first` 或 `last`）。不要对分组图按数值排序：当前 profile 会拒绝此歧义请求，需在上游明确处理聚合。分类使用 UTF-16 代码单元顺序，而非语言环境排序。

0.2 日期使用折线图 x 的 `type: temporal`、`temporalKind: date` 和有效 `YYYY-MM-DD` 字符串；带偏移时间点单独支持，不推断时区。y 单位须显式声明；百分比 `percent` 与 `ratio` 描述原值，不触发换算。生成前读取 0.2 Schema 和能力清单。

0.2 柱状、折线或饼图只有在用户明确要求时才可通过 `chart.aggregate.op` 设置 `sum`、`mean` 或 `count` 聚合重复分类。count 是非 null 数值 y 的数量，不是总行数；sum/mean 忽略 null。不要编造分组、单位，也不要把聚合结果当作单个原始行。

原生 ECharts 输入默认只做部分校验。当宿主要求有限的严格子集时，先读取 `chartnexus://schema/native-strict-basic/0.1`，再调用 `validate_chart` 并传入 `nativeValidation: "strict-basic-0.1"`。不要声称任意 ECharts option 均通过严格校验，也不要在失败后静默改用部分校验。

实验性 0.2 intent 可通过 `presentation.dataLabels.show` 和 `presentation.legend.show` 控制标签及图例，图例可选 `position`（`top` 或 `bottom`）。标签内容采用该图表类型的 ECharts 默认值，不要编造 formatter 或暗示百分比自动换算。

0.2 折线图时间点使用 `temporalKind: "instant"`，输入完整的带 `Z` 或数字偏移的 ISO 字符串。不要省略或编造偏移。分类排序按实际时间比较，同一时间点的不同字符串会被拒绝；显示为 UTC。

0.2 intent 可读取 `chartnexus://recipes/combo/0.2` 与 `chartnexus://recipes/funnel/0.2` 了解受支持的组合图和漏斗图。组合图使用两个不同字段，默认共享轴要求单位相同或均不声明；显式右轴要求双方均声明单位。不要为漏斗图推断转化率，也不要静默换算数值。

生成 0.2 分类热力图前读取 `chartnexus://recipes/heatmap/0.2`。提供不同的 x、y 和数值颜色字段，以及数据或用户明确给出的 min/max；不要编造范围、把缺失格填成零或隐式聚合重复值。

宿主可通过 `chatPresentation` 启用 0.2 聊天展示 profile；用户要求的详略可写入 `presentation.detailLevel`（`minimal`、`simple`、`standard`、`detailed`、`comprehensive`）。宿主的主题、背景和档位设置优先；未启用 profile 时文档档位不改变渲染。不要为了简洁删减必要图例或数据。详见[聊天展示](chat-presentation.md)。

0.2 聊天图表可先读取 `chartnexus://recipes/chat-bar/0.2` 了解正确的逐行数据结构，再读取 `chartnexus://recipes/funnel/0.2` 了解另一种图表。使用用户实际数据和数值，示例不是任务答案。主题版本是字符串 `"1"`；用户未要求时不要添加可选变换。
