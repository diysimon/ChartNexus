---
doc_id: spec-0010-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: zh-CN
---

# 图表更新顺序控制

[Other language](spec.md)

## 目标和范围
为现有 runtime 增加可选的会话级更新控制器，保护显式操作免受异步结果乱序与重复投递影响。保留原生/intent 输入、宿主 registry、现有生命周期和错误时保留图表。不隐式映射协议，不承诺远程持久化、缩放/图例状态保留或稳定行 ID。

## 契约与数据流
控制器包装已有 ChartRuntime，接受包含 operationId、baseRevision、complete 的 JSON 操作；完整更新还需 document。异步工作开始前记录 baseRevision，提交时必须等于 runtime.getRevision。部分更新只返回 pending，不渲染也不缓存。成功操作在会话缓存中记录 ID 和含 registry 的规范化 JSON；相同 ID/相同内容重试返回 duplicate，不再渲染；同 ID 不同内容报冲突。失败不缓存，允许修复重试。提交前检查已取消的 AbortSignal；同步渲染中途不可中断。销毁控制器只清空缓存，runtime 仍由宿主独立管理。

缓存最多 128 条、4 MiB 签名、10 分钟有效期。淘汰/过期后不承诺永久去重，revision 检查仍有效。registry 是宿主可信输入，计入 1 MiB 指纹检查预算。非法 JSON、重复冲突、过期 revision、已销毁及取消均返回诊断。协议适配器必须显式选择接入并提供正确 revision；现有适配器不会自动获得排序能力。

## 验收
- AC-01：完整有效操作只应用一次，相同重试返回 duplicate，同 ID 不同内容冲突。
- AC-02：过期/乱序、部分、取消和无效更新不替换有效图表，也不增加 revision。
- AC-03：容量/过期、销毁和 registry 行为有确定性测试；明确所有权和内存边界。
- AC-04：双语文档、RFC、测试和工程门禁通过；仅在实际测试时声明浏览器集成。

## 发布/回退
新增实验 API，不改 core schema；移除控制器即可回退。显式协议版本映射和交互状态保留在后续实现，本阶段不是完整流式传输。
