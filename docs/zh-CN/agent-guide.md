---
doc_id: agent-guide
version: "0.1"
status: experimental
updated: 2026-11-01
language: zh-CN
---

# Agent 接入与检索指南

[English](../en/agent-guide.md)

应用决定是否请求图表并提供已授权数据；ChartNexus 不查询事实，也不强制模型调用工具。向 Agent 提供宿主实际启用的 profile、可信数据/字段名与匹配 Schema，要求生成一个完整 JSON 文档。下面的合成配方不是用户业务问题的答案。

读取仓库的工具可从纯文本 [llms.txt](../../llms.txt) 或[中文索引](../../llms.zh-CN.txt)开始；这不代表文件已经部署到网站或一定被自动发现。两个索引均包含在检索语料中。

## 发现顺序

1. 读取宿主策略：允许的版本/图表类型、是否启用聊天展示或有序操作、已授权表/地图引用及大小限制。
2. 读取 `chartnexus://capabilities/basic-0.3`，再用 `{ "schemaVersion": "0.3", "chartType": "bar" }` 调用 `get_chart_schema`（按请求替换为受支持类型）。工具默认返回 0.1；单分支 Schema 不代表宿主一定允许该能力。
3. 读取 `chartnexus://recipes/manifest/0.1` 和匹配的配方 URI。11 类图表均有 0.3 配方；旧 0.2 配方应保持原版本，除非显式迁移。地图需要宿主注册资产；引用数据需要授权的宿主 registry 与精确 revision。
4. 把完整文档交给 `validate_chart`。失败时查看实际 `code` 和 JSON Pointer `path`，仅按宿主策略有限重试，不虚构业务数据。`compile_chart` 返回渲染计划；`render_chart` 返回会话内静态 SVG 资源，不是交互式浏览器组件。

## 0.3 配方查找

以下后缀接在 `chartnexus://recipes/` 后：bar → `chat-bar/0.3`；line → `line/0.3`；pie → `pie/0.3`；scatter → `scatter/0.3`；combo → `combo/0.3`；funnel → `funnel/0.3`；heatmap → `heatmap/0.3`；radar → `radar/0.3`；tree → `tree/0.3`；sankey → `sankey/0.3`；map → `map/0.3`。地图配方需要宿主注册 `two-regions@1` 合成资产，配方本身不能注册资产。复用前检查清单和能力限制。

## 可复制的提示词模板

```text
宿主已请求生成图表。输出一个完整的 ChartDocument JSON 对象。
只使用给定的允许版本、Schema、字段、数值和已授权引用。
不要虚构数据，也不要在图表文档中包含可执行函数、回调或 URL；只在明确要求时聚合或排序。
保留 null、单位和数据身份；无法完成时通过宿主自己的响应格式说明。
宿主 profile：<宿主提供的配置>；Schema：<Schema 或引用>；
允许的数据：<宿主提供的字段和数据行，或可信引用>；用户请求：<请求>。
```

宿主决定自己的响应外壳并处理拒绝/不画图状态；这些不是 ChartDocument 字段。OpenUI/A2UI/COSUI 接入需遵循对应[集成指南](genui-integrations.md)要求的 JSON 字符串或操作信封。流式内容由宿主拼接，只传入完整文档。有序 profile 的 operation ID 和当前 base revision 由宿主提供，不可虚构。

## RAG 与训练使用

`chartnexus://resources/index/0.1` 列出来源、版本、语言、许可证及源文件字节哈希。`chartnexus://resources/retrieval/0.1` 提供包含 `body` 的逐行 JSON 记录；按 `language` 和 `capabilityIds` 筛选，再按宿主 profile 约束读取相关 Schema、目录和示例。`schemaVersion` 表示资源主要版本上下文，条目也可能列出其他兼容能力 ID。`uri: null` 的条目可从检索语料读取，不是独立 MCP 资源。仓库内可直接读取 [JSONL](../../resources/model-retrieval.jsonl)。源示例为 Apache-2.0 合成数据；保留来源与许可证，不要训练或索引私人数据及留出评测输出。可复用资源不代表模型已经训练，也不代表 MCP 客户端已经选择该资源。

独立的[合成输入／输出样例对](../../resources/model-examples.jsonl)也可从 `chartnexus://resources/examples/0.1` 读取：11 类图表 × 中英文。每条记录包含明确的输入数据／图表配置、完整输出文档、源配方哈希、许可证及宿主前置条件。这些样例展示文档序列化和对输入的忠实处理，不训练或评估独立选图和事实查询。语料整体在索引中标记 `mul`，按语言筛选时应包含它，再选择单条的 `en` 或 `zh-CN` 记录。这 22 对只是入门样例，不代表训练有效或覆盖全面。用于训练或 few-shot 提示前，应自行审核来源与适用性。

在仓库根目录可不依赖 MCP 客户端检查中文 0.3 指南记录：

```js
import { readFileSync } from 'node:fs';
const records = readFileSync('resources/model-retrieval.jsonl', 'utf8')
  .trim().split('\n').map((line) => JSON.parse(line));
const guides = records.filter((item) => item.language === 'zh-CN'
  && item.capabilityIds.includes('basic-0.3')
  && ['agent-guide', 'chart-catalog'].includes(item.id));
console.log(guides.map(({ id, source, contentHash }) => ({ id, source, contentHash })));
```

将代码保存为 `.mjs` 文件，在仓库根目录用 Node 运行。检索系统应索引 `body`、保留关联元数据，并只选择宿主 profile 允许的资源。

见[模型入口](model-entry.md)、[图表目录](chart-catalog.md)、[责任边界](product-boundary.md)和 [CLI/MCP 指南](agent-integration.md)。
