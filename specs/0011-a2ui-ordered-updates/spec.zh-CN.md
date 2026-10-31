---
doc_id: spec-0011-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---
# A2UI 图表顺序更新
[English](spec.md)
## 问题与目标
A2UI 图表组件能渲染完整文档，但无法保护宿主异步更新免受乱序覆盖。通过现有控制器及真实 A2UI 数据绑定增加显式可选的 profile。
## 设计与边界
宿主选择顺序模式，在现有 document 绑定中提供 JSON 编码的 operation。异步工作开始前捕获 baseRevision，创建唯一 operation ID 并提供完整操作；未完成操作不携带 document。组件通过宿主回调报告回执和诊断。这是 ChartNexus profile，不是 A2UI 协议字段，也不会自动为消息排序。既有文档模式保持不变。控制器生命周期与组件挂载一致；传输、分帧缓冲、取消和版本捕获由宿主负责。本次不增加联网或交互状态保持。
## 验收与证据
浏览器测试须覆盖官方 A2UI processor 和 React surface、乱序、重复、未完成、无效更新、恢复与销毁；同时保留单元测试。验证后记录实际结果。
## 依赖与回滚
依赖 runtime 控制器及现有 A2UI profile。移除可选模式即可回滚；原有文档模式保持兼容。流式传输及跨协议排序仍属后续工作。

浏览器证据：本机 Chrome 中官方 A2UI 宿主和原有 profile 共 2 项测试通过。提交前取消由控制器单元测试覆盖；传输取消未测试。
