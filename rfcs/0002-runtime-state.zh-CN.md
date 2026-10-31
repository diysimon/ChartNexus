---
doc_id: rfc-0002-runtime-state
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: zh-CN
---

# 运行时与状态

[Other language](0002-runtime-state.md)

决定状态：实验子集，完整 operation 语义仍待实现。

## 方案
一个运行时拥有一个 DOM 容器和 chartId。先编译再渲染，notMerge 完整替换避免旧系列残留。仅成功渲染增加 revision。校验失败保留原图；渲染失败尝试恢复旧计划，恢复失败需重挂载。ResizeObserver 和 dispose 负责清理。

## 替代与边界
默认合并可能残留系列；完整替换暂不保留缩放/图例状态。baseRevision、operationId、去重将在协议更新前通过独立控制层设计。本阶段更新同步、调用方排序。选择身份是位置加 revision，不声称稳定行 ID。

## 验证
真实浏览器验证模式/类型切换、系列替换、无效更新保留、点击、尺寸和销毁。SSR 单独验证，不证明交互能力。同步渲染不提供硬超时。

## 实施说明（2026-10-31）

可选的会话级 `createUpdateController` 提供显式版本检查和有限资源的操作去重。宿主必须主动接入；A2UI profile 可以选择接入；其他协议适配器和流式传输不会自动使用它。交互状态保持仍属于后续工作，当前契约见开发指南。
