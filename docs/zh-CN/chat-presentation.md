---
doc_id: chat-presentation
version: "0.1"
status: experimental
updated: 2026-10-31
language: zh-CN
---
# 聊天界面展示 profile
[English](../en/chat-presentation.md)

这是为 0.2 intent 图表提供的**宿主显式启用**的实验性展示配置；不改变未启用时的 0.1/0.2 编译与渲染。它只决定可视展示，不改变数值、聚合、数据顺序或行身份。静态示例见[聊天预览](../../examples/playground/chat.html)。

## 调用和优先级

宿主通过 `compileChatChart(document, settings, registry?)` 获取 `{plan, adjustments}`；浏览器使用 `mountChart(container, onSelect, {chatPresentation: settings})`，静态导出使用 `renderSvg(document, {chatPresentation: settings})`。A2UI、OpenUI 和 COSUI JSON 的创建选项也支持 `chatPresentation`。MCP `validate_chart`、`compile_chart` 和 `render_chart` 可选传入 `chatPresentation`；不传时保留原行为。COSUI Marklang 未接入，其他宿主和真实流式传输未验证。

settings 支持 `theme: "light" | "dark"`、`background: "transparent" | "theme"` 和 `detailLevel`。默认背景透明，缺少宿主及文档主题时 light，缺少宿主及文档档位时 standard。宿主明确提供的主题、档位优先于文档建议；背景仅由宿主选择。`presentation.detailLevel` 可由文档声明，但只有宿主启用此 profile 时才影响展示。现有显式 `presentation.legend.show` 和 `presentation.dataLabels.show` 优先于档位默认；为保障系列身份，多个系列及饼/漏斗图即使请求隐藏图例也会保留图例。无效设置报诊断，不猜测系统主题。

| 档位 | 标题 | 网格线 | 默认标签 | 其他 |
| --- | --- | --- | --- | --- |
| minimal | 隐藏 | 隐藏 | 隐藏 | 必需图例仍保留 |
| simple | 显示已给标题 | 隐藏 | 隐藏 | 坐标与单位保持可见 |
| standard | 显示已给标题 | 显示 | 隐藏 | 默认档 |
| detailed | 显示已给标题 | 显示 | 每系列至多 8 点时显示 | 更密集时抑制默认标签 |
| comprehensive | 显示已给标题 | 显示 | 每系列至多 8 点时显示 | 直角坐标显示端点刻度并启用轴触发 tooltip |

不同图表的标签内容沿用 ECharts 默认，不计算百分比；热力图仍显示色阶且该 profile 不显示数据标签。显式请求标签时不强制密度抑制，可能遮挡。`adjustments` 的 `REQUIRED_LEGEND` 表示为区分系列/分类恢复图例；`LABEL_DENSITY_LIMIT` 表示按默认密度策略隐藏标签。静态 SVG 仅返回 SVG，宿主如需读取调整信息可先调用 `compileChatChart` 或 MCP `compile_chart`。runtime 保持原结果形状；调用方可单独检查调整。

## 边界和验证

两种主题设置文字、轴、图例、tooltip 和系列色；透明或主题底色不推断宿主背景。tooltip 使用不透明主题色。双轴与单位、热力图色阶保留；标签可能因大小、字体和数据量重叠。当前不存在按容器尺寸智能隐藏、逐点自定义配色、自动背景检测或通用文本摘要生成；样例中的摘要是固定合成数据的手工文字。透明 SVG 应置于匹配主题的背景，背景未知时选择 theme。宿主可用数据表、文本或适配器自身的无图回退，核心不自动生成它们。

已测试七类现有图表的五档、两种主题的数据/行索引不变，固定浅白/深色背景的文字对比、热力图色阶端点，以及本机 Chrome 中聊天页面、SVG 下载、窄容器和 A2UI/OpenUI/COSUI JSON 宿主。测试不构成跨设备全面视觉或无障碍认证。基于真实本地模型的少量合成任务结果见[模型试运行](local-model-pilot.md)；现有样本不能作为模型排名或完整独立隐藏评测。
