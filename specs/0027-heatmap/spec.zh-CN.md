---
doc_id: spec-0027-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# 分类热力图 profile
[English](spec.md)
## 契约
实验性 0.2 `chart.type: "heatmap"` 使用字符串 ordinal x 和 y 字段，`chart.heatmap: {field, min, max}` 指定颜色数值字段。字段须各不相同；min/max 必须明确、有限、差值有限且 min < max。非 null 数值须落在范围内；null 是缺失格，不是零。重复 x/y 组合（包含 null 行）作为歧义拒绝。分类按首次输入顺序排列；不生成交叉矩阵、不排序、分组或隐式聚合。可见格的选择 rowIndex 对应原始行；null 行不生成可见格。颜色使用固定内置色阶及 visualMap，不推断单位、不接受用户 formatter。本 profile 暂拒绝图例和数据标签覆盖；现有命名主题作用于轴和背景。不改变 0.1/原生模式。
## 验收
测试数值、null、范围、重复、来源身份、稀疏格、引用 revision、限制、输入不变、SSR/浏览器、MCP 发现。同步双语文档及实际证据，不声称全面视觉或模型准确率。

证据：单元、SVG、MCP 示例和本机 Chrome 点击测试通过；不声称全面视觉、无障碍或真实模型评测。
