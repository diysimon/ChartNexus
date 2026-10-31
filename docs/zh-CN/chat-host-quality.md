---
doc_id: chat-host-quality
version: "0.1"
status: experimental
updated: 2026-10-31
language: zh-CN
---
[Other language](../en/chat-host-quality.md)

# 聊天宿主质量与支持矩阵

## 展示与访问

聊天展示由宿主显式启用，接受 0.2/0.3 intent。`resolvePresentation(plan,{width,height,target,theme})` 为纯函数；浏览器传当前内容尺寸，SVG 传请求尺寸。不传尺寸时 compileChatChart 保留默认样式，不声称响应式布局。布局为标题、图例、坐标轴和热力色阶预留空间；即使显式请求标签，过密时也可能带提示隐藏，但完整原始值仍可访问。宽度小于 240px、过窄的双轴或绘图区不足时，浏览器明确回退到数据表入口。SVG 装不下必要内容时返回 `EXPORT_LIMIT`，需增大尺寸，不静默删除内容。

共享明暗主题在声明的白色/#111827 背景上检查对比度。透明背景需要宿主背景匹配，不声称适配任意背景。正文目标 4.5:1，必要色板和轴线 3:1。仍禁用动画。原生 HTML button/details 提供键盘访问；源数据表每页 50 行，可翻页访问全部数据，保留 null、单位；渲染值也包含聚合和来源映射。SVG 内含 title 及转义后的完整源数据/渲染表 JSON metadata，宿主可读取；SVG 本身是静态内容。

浏览器控件作为图表容器的同级节点由 runtime 管理，销毁时移除；宿主 CSS 应保证可见、可访问。图表类型/编码/单位兼容时按语义键保留图例选择；删除键清理、新键默认显示，不兼容变化产生 `STATE_RESET`。JavaScript 保留名称使用不可见的渲染别名，访问标签和原始值不变。本阶段不支持缩放状态保留。

## 生命周期与事务

`mountChart` 保留零尺寸立即失败契约。`observeChartMount` 供适配器等待可测量尺寸，只初始化一个 runtime，销毁时取消观察。等待期间保留最后完整合法输入，不将部分或非法输入提交为修订。Marklang 同样等待可测量容器，以内容区宽度在屏幕外暂存全部图表，全部成功后才替换旧节点；失败仅释放暂存。限制为 16 图、1 MiB Markdown、解析输入与 registry 合计 1 MiB；旧新暂时共存限两个已接受文档。

resize 使用上次编译成功的快照，不推进数据或图表修订。回调异常独立报告；渲染失败尝试恢复，`RENDER_RECOVERY_FAILED` 要求重新挂载。Marklang 整体替换文档，因此图例保留和单图修订不跨整体替换保留。

## 流式链路

`createChartStreamBuffer` 已迁到 runtime，保留 A2UI 兼容导出。它缓冲解码后的 JSON，不证明传输完成。`readOllamaStream` 严格增量解码 UTF-8 NDJSON，传输限 4 MiB、文档限 1 MiB，要求 `done:true` 且 `done_reason:"stop"`。截断、缺失终止帧、格式错误、取消或终止后仍有数据均不返回完成操作。

本地 Ollama 页面使用同源代理与 `stream:true`、120 秒期限、取消、生成 epoch 和起始图表修订；手动编辑使旧生成失效。最多两次有界修复，分别记录尝试。一次真实合成 qwen3.5:9b 首次通过，数值 [3,5] 保真，取消验证通过；见 [证据](../../specs/0034-chat-host-quality/ollama-verification.json)。这是冒烟测试，不是模型排名或事实检索服务。此解码器不支持 SSE；其他传输应自行解析帧后使用中立缓冲。

## 固定版本的本地宿主矩阵

| 宿主 | 输入与完成信号 | 聊天/主题/数据表 | 零尺寸 | 有序操作 | 图例保留 |
| --- | --- | --- | --- | --- | --- |
| OpenUI react-lang 1.0.2 / React 19.2.4 | JSON 字符串；上游 streaming=false | 支持 | 等待 | 宿主显式启用 | 兼容更新保留 |
| A2UI React 0.9.1 / web_core 0.9.2 | 解析后的 DynamicString；宿主完成操作 | 支持 | 等待 | 宿主显式启用 | 兼容更新保留 |
| COSUI Dynamic UI 1.0.0 / San 3.15.5 | document 对象；宿主完整输入 | 支持 | 等待 | 宿主显式启用 | 兼容更新保留 |
| Marklang 1.0.1 | 命名数据/指令；显式 complete=true | 支持 | 等待事务 | 显式拒绝 | 整体换文档时重置 |

选择、校验错误、有效恢复和销毁由共享 runtime 及固定真实 SDK 夹具验证。Marklang 仍要求可信或已净化 Markdown，本任务不净化任意 HTML。ChartNexus 操作信封不等于上游标准保证。远端宿主、水合、其他 SDK 版本、移动设备认证和全面无障碍认证仍未验证。见 [M2 spec](../../specs/0034-chat-host-quality/spec.zh-CN.md)。

## M3 图表扩充

0.3 在原有七类基础上新增雷达、树、桑基和可信区域地图。见[契约、宿主 MapRegistry、模型资源和预览](chart-expansion-03.md)。浏览器/SVG/worker 与四种固定上游 SDK 路径已有本地证据；M4 模型评测和分发仍是独立工作。固定渲染器标签回调保留原文，仍禁止模型回调。
