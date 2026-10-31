---
doc_id: spec-0016-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# 显式分类排序
[English](spec.md)
## 目标与契约
为实验性 0.2 intent 的柱状、折线和饼图增加可选 `chart.sort`：`{ by: "category" | "value", order: "ascending" | "descending", nulls: "first" | "last" }`。分类按确定性的 JavaScript UTF-16 代码单元顺序比较，不使用 locale；数值排序按数值比较。null 位置不受方向影响；相等值保留首次出现顺序。0.1 和未声明排序的 0.2 保持原行为。散点排序和任何带分组字段的数值排序明确拒绝，不编造聚合。分组分类排序对所有系列使用相同排列，保留空位及原始行索引。宿主引用数据使用相同编译计划和数据版本，不修改输入或 registry。
## 验收
测试升降序、相等值及 null、分组空位和原行身份、内联与引用数据、饼图与横向图、无效组合、确定性、Schema/Agent 发现以及实际 SVG/浏览器行为。同步双语文档和 manifest。排序不代表聚合、时间解释、语言环境排序或稳定行 ID；不改变 0.1 语义。

证据：单元测试覆盖排序及原始索引，并验证 SVG 渲染和本机 Chrome 点击映射。未测试或声称真实模型及语言环境排序。
