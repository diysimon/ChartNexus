---
doc_id: rfc-0001-input-contract
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: zh-CN
---

# 输入与数据契约

[Other language](0001-input-contract.md)

决定状态：实验实现，不是稳定发布 API。用户于 2026-10-30 授权开始开发，当前范围为 SPEC-0001。

## 问题与方案
模型已熟悉原生 option，简单 intent 可减少字段映射错误。schemaVersion 0.1 支持互斥原生/intent。JSON Schema 为源，生成 TS。数据用标量对象行，显式 x/y/series，宿主按 id 和精确 revision 解析引用。

## 替代与边界
强制新 DSL 会限制 ECharts，完全放开 option 会破坏能力控制。因此原生 profile 有明确限制和诊断。时间解析、聚合、原生外部绑定和扩展注册暂缓。分类 x 缺失非法，y 可为 null 并保留间断，不变更数据或隐式转换。

## 兼容与验证
无历史已发布版本。破坏性变化需新 schema 版本。测试模式互斥、禁止值、引用版本、重复分类、分组对齐、空数据与数值保真；源和生成类型必须一致。
