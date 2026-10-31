---
doc_id: spec-0017-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# 显式数量单位
[English](spec.md)
## 契约
实验性 0.2 intent 可声明 `chart.encoding.y.unit`：`{kind:"currency",code:"USD"}`、`{kind:"percent",scale:"percent"|"ratio"}` 或 `{kind:"unit",label:"kg"}`。货币代码为三个大写 ASCII 字母（只校验格式，不验证货币注册表）；单位标签为 1–32 字符。单位在柱状、折线和散点图的数值轴名称中展示。饼图单位在可访问展示方案确定前拒绝。百分数 `percent` 表示 25 即 25%；`ratio` 表示 0.25 即 25%，但输出明确标注 ratio，不将值转换或格式化为百分数。不执行数值换算、四舍五入、推断或聚合。横向柱状图单位跟随数值轴。未知字段和无效单位由 Schema 拒绝；0.1 行为不变。
## 验收
检查两种百分比比例、货币和自定义单位、所有允许的图表类型、横向轴、主题和排序组合、源/registry 不变与数值不变、SVG/浏览器、错误输入、MCP 发现、文档和工程门禁。不声称真实模型和无障碍评测。

证据：单元与 SVG 测试及本机 Chrome 0.2 示例通过。未执行真实模型或无障碍验证。
