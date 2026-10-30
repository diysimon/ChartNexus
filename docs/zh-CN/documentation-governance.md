---
doc_id: documentation-governance
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: zh-CN
---

# 双语文档与项目治理

[English](../en/documentation-governance.md)

## 文档状态与优先级
本轮文档为实施基线；字段级 API、版本矩阵和流水线仍需按各文档状态实施。优先级为明确用户任务授权、根 AGENTS 的执行要求、已采纳 RFC/Spec、通用规范、示例。发生冲突要记录并修复，不用示例覆盖契约。
英文是公共术语与 API 规范的基准文本；中文与英文必须语义一致。翻译缺陷不能通过“英文优先”长期搁置；同一 PR 修复，行为仍以已采纳契约和测试为准。

## 双语规则
每份规范和模板有英文、中文文件，顶部互链、共享 doc_id/version/status/updated。修改行为规则时同一 PR 更新两份。标识符、错误码、包名、命令不翻译；说明和示例语境可以本地化但不能改语义。
新资源必须加入 docs/manifest.json。manifest 记录相对路径、版本和语言，检查配对存在性；长度相似与标题数一致只作提示，不能代替语义审阅。
不要在公开规范引用本机绝对路径；初始化现状中的工作区路径仅用于此次交付定位。示例中的密钥用明显占位，不放可用凭证。

## RFC 与 ADR
跨包架构、破坏性契约、默认数据语义、新执行权限写 RFC：问题、约束、方案、替代、兼容、迁移、验证和决策。状态 proposed/accepted/rejected/superseded；accepted 标明维护者与日期。
小型内部决定可记 ADR，链接对应 Spec。不能把本轮设计建议批量标记为已通过用户逐项审批。

## 贡献与评审
单个 PR 聚焦可评审结果，附 Spec/AC、测试、双语资源和 changeset（影响发布包时）。缺陷修复不混入无关大重构。提交消息建议 Conventional Commits，但发布版本以 changesets 与兼容规则为准。
维护者对契约、发布和安全报告负责。CODEOWNERS 在明确实际 GitHub 用户与职责后设置，不编造所有者。Issue/PR 模板可由本轮模板转为 GitHub 模板，尚未部署。

## 许可、品牌与来源
项目使用 Apache-2.0。保留上游 LICENSE/NOTICE 要求；不凭空生成 Apache 官方 NOTICE 或把 ChartNexus 宣称为 ASF 官方项目。
第三方代码、文档、图片、数据分别记录来源及许可。Apache-2.0 不自动授权品牌或第三方训练数据。项目介绍使用“for Apache ECharts”说明技术关系，具体商标使用遵守适用政策。

## 发布文档
每次发布提供中英文变更说明、兼容矩阵、迁移和已知限制。清晰区分 planned/experimental/verified/deprecated；例子未发布前不提供貌似可运行的 npm 安装命令。文档站版本与包版本关联，历史文档不静默改成最新行为。
