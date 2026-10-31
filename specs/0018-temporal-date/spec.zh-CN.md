---
doc_id: spec-0018-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# 显式日历日期轴
[English](spec.md)
## 契约
实验性 0.2 intent 折线图的 x 可使用 `{field, type:"temporal", temporalKind:"date"}`。值必须为有效公历 `YYYY-MM-DD`，年份 1000–9999。仅为渲染坐标将日期转换为 UTC 零点毫秒，设置 ECharts `useUTC: true` 和时间轴；日期表达日历日期，不是本地时间或时刻。保留输入，不推断时区；同组重复日期沿用现有拒绝逻辑。分组、空位、排序和原始行索引沿用现有编译器。未显式排序时系列点保持输入顺序；时间轴按时间定位。无效日期、缺少 temporalKind、非 temporal 字段携带 temporalKind、非折线图和超范围日期须拒绝。带偏移的时间戳、本地日期时间、其他历法和时区不在本次范围。
## 验收
测试有效闰日、错误和歧义日期、分组、缺失值、原始行索引、排序及输入不变、UTC 坐标与设置、原生 0.1 兼容、SSR/浏览器、能力发现和双语文档。不声称支持时间戳或真实模型验证。

证据：单元与 SVG 测试及本机 Chrome 0.2 示例通过。未执行真实模型或无障碍验证。
