---
doc_id: spec-0032-spec
version: "0.1"
status: done
updated: 2026-10-31
language: zh-CN
---
[Other language](spec.md)

# 资源清单与模型输入契约

## 范围与设计
实施 M0 的 A01/A03。Recipe manifest 统一驱动发现、包内副本和检索条目。每种支持的意图图表均有正例和声明式负例。公开合成 recipe 是开发资源，不是独立评测集。文档检查解析 frontmatter 并拒绝双语状态、日期漂移。

共享 runtime helper 推荐 0.2 intent，返回 schema、资源 URI 与完整规范示例。非聊天宿主保留 0.1 intent/native；聊天宿主仅接受 0.2 intent。有序更新说明宿主拥有 operationId 与 baseRevision。OpenUI/A2UI 描述消费同一契约；COSUI 导出 helper 供宿主拼接提示词。不包含 0.3、新图表、外部调用或 Marklang 聊天支持。

## 验收
- AC01：全部 recipe 的声明版本和类型可编译；负例返回声明诊断；生成的 MCP 资源与规范源一致。
- AC02：双语文档状态或日期不一致会阻断检查。
- AC03：helper 示例匹配 schema、编译器和宿主 profile；非聊天保留旧版；聊天拒绝旧版；返回值互不污染。
- AC04：真实 OpenUI 提示词和 A2UI schema 含匹配描述；现有宿主浏览器回归通过。

## 失败、兼容与证据
不修改运行时接受范围和修订语义。生成漂移阻断检查，保留原有 recipe URI，资源增量添加。回滚时同时恢复 helper、描述与资源。无新增依赖或数据限额。依赖审视和 SPEC-0031，验收证据已记录在 tasks。

全部 AC 通过；证据映射见 [tasks](tasks.zh-CN.md)。
