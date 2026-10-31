---
doc_id: local-model-pilot
version: "0.1"
status: experimental
updated: 2026-10-31
language: zh-CN
---

# 本地模型与 MCP 试运行

[English](../en/local-model-pilot.md)

## 本地运行

本机已经安装模型且 Ollama 服务已启动时，在仓库根目录执行：

```sh
pnpm eval:ollama --model qwen3.5:9b --tasks create-bar,repair-field,reject-unknown-field,data-null-zero --output my-pilot.json
```

运行器只连接固定的 `http://127.0.0.1:11434`，通过官方 SDK 客户端启动真正的 ChartNexus MCP stdio 服务，发现 `list_capabilities` 和 `validate_chart`，并只向模型提供这两个工具。发送给模型的内容是选定的公开任务、相关源数据或上一轮/输入文档、权威 Schema 和能力清单，不包含预期断言或参考图表答案；不会根据模型输出自主执行 shell 命令或连接远程模型。

可选 1–20 个不同任务 ID；输出必须是新的 `.json` 文件名，结果仅写到已忽略的 `outputs/` 下，不覆盖已有文件。记录包括选定任务、可获取时的模型摘要、Ollama/Node 版本、seed、温度、生成与工具上限、任务集/Schema/工具哈希、耗时、服务返回的 token 数、工具调用名称与诊断码、最终原始输出、格式修复标记及任务得分。本地记录可能包含全部输入与生成数据，应按其内容管理。退出码 0 表示所选任务均通过自动检查，1 表示至少一项未通过，2 表示设置或用法错误；任务出错会作为缺失候选记录，不会被忽略。

对于模型生成的有效图表，宿主还会调用 MCP `render_chart`、读取返回的 SVG 资源并校验 SHA-256。这一步由宿主发起，不属于模型发起的工具调用。解析器优先接受完整 JSON 对象，也允许移除**单个完整的 Markdown JSON 代码围栏**，并单独记录为格式修复；不会从夹杂说明的文本中提取 JSON。这不是模型重试或语义修复。每个任务执行一次模型尝试，最多三轮工具调用、每轮四次调用、每次响应最多生成 2048 token、单次请求超时 120 秒。本试验之外的任务组装与渲染仍由宿主负责。

## 本地证据：2026-10-31

全部使用公开合成开发任务，每项运行一次，温度 0、seed 42。记录保存在本机忽略目录，不作为模型数据集提交。样本很小，仅用于工程冒烟测试，不能用于模型排名或作为独立隐藏基准。

| 模型与运行时 | 任务结果 | MCP 证据 |
| --- | --- | --- |
| Ollama `qwen3.5:9b`，摘要 `6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7` | create-bar、repair-field、reject-unknown-field、data-null-zero 共 4/4 项在格式处理后通过断言。3 个响应为严格 JSON，1 个移除了完整 Markdown 围栏。 | 4 项中 2 项由模型调用 `validate_chart`：一次成功，一次返回预期的未知字段错误；另 2 项未调用工具。宿主对 3 个有效图表候选均完成 SVG 渲染和哈希校验。 |
| Ollama `mistral:latest`，摘要 `6577803aa9a036369e481d648a2baebb381ebc6e897f2bb9a766a2aa7bfbc1cf` | create-bar 和 reject-unknown-field 共 0/2 项通过，最终输出不是有效候选 JSON 对象。 | 一项调用了 `list_capabilities`；这两项样本没有模型发起的 `validate_chart` 调用。该次运行早于宿主 SVG 校验步骤，且没有可渲染的有效候选。 |

环境：Ollama 0.40.6、Node v22.22.3、MCP 服务 `chartnexus` 0.0.1-alpha.0。任务集 SHA-256：`955f0e7ce9e4765a567bab75607ae51ea2d8cffef8e94a04504467d3bcfc78bb`；Schema SHA-256：`5f96b812df6f4a350f6267f2fb7680e480a123de95bbe40830345e439637b832`。Qwen 记录为 `outputs/ollama-pilot-render-20261031.json`，Mistral 记录为 `outputs/ollama-mistral-pilot-20261031.json`；均仅在本机且被 Git 忽略。

Qwen 初次试运行暴露了开发任务的歧义：空值/零值任务要求画图但未指定类型，评分器却要求折线图。已在上述四项记录运行前修正任务描述。完整 20 任务运行、重复试验、独立隐藏数据、视觉判断、远程模型、桌面 MCP 客户端、多轮对话重放和模型比较均未进行。真实模型调用与运行器模拟测试是两种不同证据。

历史试验文件记录了 MCP 调用成功或错误，但不包含后来新增的逐调用诊断码字段；当前运行器会在 MCP 提供时记录该字段。

## 聊天展示 profile 试运行（2026-10-31）

通过本机 Ollama `/api/chat` 测试本地 `qwen3.5:9b`（摘要 `6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7`），temperature 0、`think: false`、JSON 输出、每次最多生成 1800 token。宿主另行编译结果、应用深色透明聊天 profile 并渲染 SVG；此试验不验证模型发起工具调用。完整提示、输出和本地任务脚本位于被忽略的 `.local/` 和 `outputs/`，预期断言未放入模型消息。

- 首批三个任务：1/3 通过结构、渲染及所检查的图表类型、展示档位、数值和顺序。另两项 Schema 或能力校验失败；每项一次通用诊断修复的结果为 0/2。
- 六个未放入项目检索资源的额外合成提示：2/6 通过上述检查，包括一次散点图创建和一次柱转折线修改。四项将主题版本输出为数字而非要求的字符串；每项一次诊断修复为 0/4。
- 对相同四项失败任务，更明确的通用提示、无示例时，1/4 结构有效但 0/4 通过语义检查；加入其他公开柱状/漏斗示例后，4/4 通过所检查的不变量。后续调整了 Schema 类型说明和提示，并重复使用已知失败任务；这只是探索性复测，不是干净对照或新测试集。四项仅覆盖柱、折线、饼和漏斗，检查的不变量也不能证明整体视觉或分析正确。

初次 Schema 哈希为 `1286ad36a507c0b0dade0bb9846b1e59ff1dd5daa0c84a67e41937e3089ae671`；后续明确提示和示例辅助运行使用 `cb76472f33cffaa02327b644ffbf7d5bbff76f6c30fa3f228abf526a0d1be903`。任务与公开样例存在相似模板，模型预训练和任务族隔离情况未知。少量单次结果不能用于模型排名、总体成功率或宣称完整独立隐藏基准；本试验也未覆盖模型主动工具调用、真实流式输出或其他模型。
