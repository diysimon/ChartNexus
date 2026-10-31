---
doc_id: cosui-integration
version: "0.1"
status: research
updated: 2026-10-30
language: zh-CN
---

# COSUI 协议调研与接入计划

[English](../en/cosui-integration.md)

## 范围与证据
2026-10-30 初始调研。现已实现实验性 JSON/San 与 Marklang 图表 profile，具体证据参见[集成指南](genui-integrations.md)和相应 Spec。下文设计和验收内容保留为原始计划。核实上游提交 `06baf4c493cd72f804b5ede4216cd7eab002d81c`；已安装的 npm 包版本为 Dynamic UI 1.0.0、marklang 1.0.1；包版本不等于协议版本。

## 两个独立 profile
- JSON：UI 节点使用 type、props、children、if、for、events，通过双大括号表达式绑定数据。参考 SDK 基于 San，UIJSON.compile 接收注册的 components、events、actions。appendData 设置传入的顶层字段，并非 ChartDocument patch，也不会自动拼接数组。
- Markdown：Marklang 在 GFM 上扩展 ml 前缀指令；指令的 data 引用通过名称对应 ml-data 数据块。处理器注册、renderToElement、dataToSource 提供接入入口。浏览器渲染、字符串渲染、水合需要分别验证。
- COSUI 已有 ECharts 图表组件，包含 bar/line/pie/map/radar；API 文档限制混合系列与追加式 option 更新。图表 API 写 render-finished，但 chart/index.ts 发出 chart-rendered，必须通过宿主测试核实真实事件行为。

## ChartNexus 拟议边界
新增可选 adapter-cosui 包，JSON/San 与 Marklang 分入口导入；包名与 exports 尚未冻结。保留原生 echarts 和 intent 双输入。复用上游 UI 解析器，San、表达式、Markdown、actions 都留在 core 外部。

JSON 入口注册 ChartNexus 自有组件类型（拟名 chartnexus-chart），将 document 属性绑定到完整 ChartDocument，San 挂载、更新、销毁对接现有 runtime。校验后的图表选择和诊断通过事件传给宿主。不能假设任意 action 名都可用：实际 SDK 有固定 action 白名单，比协议文档的扩展描述更窄；首版以宿主回调为接入边界。

Markdown 入口注册拟名 ml-chartnexus 指令，通过 ml-data 引用 ChartDocument。这些是项目扩展，不是上游内置指令。使用 dataToSource 序列化，校验解析后的数据，通过 DOM 创建容器，避免将模型文本拼入 HTML；节点移除时明确释放图表实例。不完整指令/JSON 先缓冲，只允许完整且有效的状态更新图表。实施前确定重复数据名、缺失引用、过期 revision 的处理规则。

新组件优先使用 ChartNexus runtime，统一校验、诊断和生命周期。后续可将 COSUI 现有 chart 组件桥接作为单独 profile 评估；不能因此向 ChartNexus 宣称地图/雷达支持，也不能继承其 formatter 例外。

## 实施顺序与验收
1. 锁定可安装 SDK/San 版本，核实包内容、浏览器导出、体积与许可证。仓库根许可证/源码头为 Apache-2.0，Dynamic UI 包元数据却写 ISC；发布前厘清分发声明要求。
2. 建立双语功能 Spec，更新适配器 RFC，明确输入、宿主回调、生命周期、预算与失败行为。
3. 先交付 JSON/San：在真实 Dynamic UI 宿主中验证双输入渲染、数据替换删除旧系列、无效更新保留上一有效图表、选择事件回传，以及销毁后释放观察器和实例。
4. 再交付 Marklang：指令与 ml-data 渲染；分片输入不渲染半成品；缺失/重复引用可诊断；替换/删除节点释放实例；类似脚本的标签保持文本。
5. 同步双语模型 recipes、修复示例、检索元数据与评测用例。MCP 与适配器共用 ChartDocument、Schema、能力来源，只声明已验证的 profile。

依赖：core/runtime → JSON/San 验证 → Marklang 验证。默认在首个 OpenUI 纵向闭环后实施 COSUI；标准 A2UI 调研可独立继续。原先仅覆盖两个协议的 P3 工期必须重新估算，包含新增 SDK、San 宿主和 Markdown 生命周期工作。

## 初始调研记录与待决事项
初始调研时完成了源码阅读；后续宿主与安装证据见集成指南。流式传输、SSR/水合、真实模型、性能仍为 not-run。后续必须锁定发布包，检查解析器信任边界，核实 action/事件文档差异，并测试增量渲染时的节点身份和清理。本次为纯文档变更，验证双语清单、链接和 diff，不要求业务逻辑测试。

## 固定提交的上游来源
- [JSON protocol](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/json/content/index.md)
- [Dynamic UI integration](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/json/quick-start.md)
- [Dynamic UI implementation](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-dynamic-ui/src/index.ts)
- [Marklang directives](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/markdown/marklang/add-directive.md)
- [Marklang data](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/markdown/marklang/data.md)
- [Marklang API](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-web/src/docs/protocol/markdown/marklang/api.md)
- [Existing chart API](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-dqa/src/chart/doc/api.md)
- [Existing chart implementation](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-dqa/src/chart/index.ts)
- [Dynamic UI package](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/cosmic-dynamic-ui/package.json)
- [Marklang package](https://github.com/baidu/cosui/blob/06baf4c493cd72f804b5ede4216cd7eab002d81c/packages/marklang/package.json)
