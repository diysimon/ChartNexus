---
doc_id: spec-0024-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# 单轴柱线组合图
[English](spec.md)
## 契约
实验性 0.2 intent `chart.type: "combo"` 以已有 ordinal x 与 quantitative y 作为柱状系列，`chart.secondary: {field, unit?}` 为同一表和分类轴上的折线系列。两个字段须不同，值为数值或 null；若声明单位，两项都须声明且完全相同。均未声明单位时，宿主负责确保量纲一致；不进行隐式换算。支持主题、标签、图例及显式分类排序。拒绝系列分组、聚合、堆叠、按值排序、时间 x、横向和其他变体，不猜测语义。保留源行位置和输入/引用不变性，使用现有资源限制。
## 验收
测试 Schema、数据与行索引、null、分类顺序、相同/不同单位、无效选项、引用版本、SVG/浏览器、MCP 能力发现、双语文档与既有回归。此项只有单轴；双轴及其他组合仍为后续工作。

证据：本地单元、SVG 和 Chrome 测试通过。真实模型和全面视觉质量验证未执行。

后续[双轴扩展](../0026-dual-axis/spec.zh-CN.md)增加显式右轴；原有单轴契约保持可用。
