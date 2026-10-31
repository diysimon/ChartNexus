---
doc_id: spec-0026-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# 显式双轴组合图
[English](spec.md)
## 契约
实验性 0.2 柱线组合可用 `chart.secondary.axis: "right"` 将折线放到第二数值轴。两个指标均须显式声明单位，可以不同；绝不换算数值。`axis: "shared"` 或省略时保留单轴单位一致规则。名称与主题样式分别跟随各自坐标轴；系列数据和源行身份保持不变。双轴可能夸大视觉关系，必须由用户或模型显式请求。其他组合图限制不变。
## 验收
验证 USD/percent 和 ratio 不换算、必须声明单位、单轴兼容、行身份、排序、主题、SVG/浏览器和能力发现；保持 0.1 行为。不证明选图合理或所有数据下视觉质量。

证据：本地单元、SVG 和 Chrome 测试通过。真实模型和全面视觉质量验证未执行。
