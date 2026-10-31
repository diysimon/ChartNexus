---
doc_id: spec-0021-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# Intent 数据标签与图例
[English](spec.md)
## 目标与边界
为实验性 0.2 intent 增加可选声明式显示控制，不开放可执行 formatter，不改变数据、图表身份、聚合或 0.1 行为。
## 契约
`presentation.dataLabels: {show:boolean}` 控制 ECharts 系列标签显隐；`presentation.legend: {show:boolean, position?:"top"|"bottom"}` 控制图例显隐与位置。两个对象都要求 `show`，并拒绝未知字段。未提供时完全保留现有默认行为。显示内容使用 ECharts 对各图表类型的默认标签，不做百分比换算、模板或隐式数据变换。顶部图例为标题及直角坐标 grid 留空间；不承诺所有数据和尺寸下均无重叠。主题前景色用于显式开启的标签。不提供自定义颜色、标签格式模板、无障碍保证或图例交互状态保持。
## 验收
验证四类图表、true/false 和省略、横向/面积/环形、聚合/排序/日期/单位的数据保真及选择元数据、主题组合、非法输入与版本隔离、SVG 与浏览器、能力/MCP 发现和双语文档。固定尺寸示例不能证明所有视觉效果。

证据：单元、SVG、MCP 能力发现及本机 Chrome 测试覆盖此子集。未证明所有数据集的视觉质量或真实模型表现。
