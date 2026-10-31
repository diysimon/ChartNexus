---
doc_id: spec-0020-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# 原生 option 严格校验
[English](spec.md)
## 目标与范围
在保持默认 guarded-native-partial 行为不变的前提下，增加可选实验性 0.1 原生 option 严格子集。递归拒绝未知字段并验证少量受支持结构和跨字段约束；成功前须通过 Schema 和现有编译安全检查。严格结果不保证视觉质量、完整 ECharts 语义，也不校验子集外选项；不改变运行时编译与渲染行为。
## 契约
`validateNativeStrict(document)` 检查现有 0.1 原生文档和安全 profile，再验证可发现的 `native-strict-basic-0.1` option Schema 和语义规则。接受使用显式数据的有限柱状/折线分类图、数值散点图和单饼图，支持有限 title/legend/坐标轴/颜色。拒绝不支持组件、未知嵌套字段、混合坐标系、系列长度不匹配、重复分类名和重复饼图名称。不支持 dataset、transform、formatter、外部资源和任意样式。严格校验须显式选择；默认 API 和模型工具调用保持不变。`validate_chart` 只允许原生文档传入可选 `nativeValidation: strict-basic-0.1`，成功标记 `native-strict-basic-0.1`；严格失败不可静默回退。通过 MCP 资源和能力清单暴露版本化 option Schema 及 profile。
## 验收
覆盖受支持类型和选项、未知嵌套和非法字段诊断、图表语义约束、安全 guard、非法输入、默认兼容、发现和 MCP 选择，以及适用的 SVG/浏览器行为。同步双语文档、生成资源和工程门禁。不声称完整 ECharts 支持或子集外语义。

证据：单元、SVG、stdio MCP 及本机 Chrome 测试通过。不声称真实模型或完整 ECharts 原生校验。
