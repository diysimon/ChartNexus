---
doc_id: contracts
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: zh-CN
---

# 契约、数据与兼容性规范

[English](../en/contracts.md)

当前实现与候选设计的分级盘点见[核心能力审查](core-capability-review.md)，0.2 仅为[提案](core-protocol-0.2.md)，不能作为当前 Schema。

## 状态
这是字段级契约的设计要求。下列名称为候选，P0 RFC 定稿前不能作为已发布接口。schemaVersion 与包版本独立；初始候选版本为 0.1。

## ChartDocument
必需字段：schemaVersion、id、mode。mode=echarts 时必须有 option，禁止 chart；mode=intent 时必须有 chart，禁止 option。公共扩展只能放到命名空间 extensions，未知业务字段默认报错。
候选 data 为 kind=inline 的字段与行，或 kind=reference 的 id/revision。原生 option 内联 dataset 与外部绑定不得同时成为同一数据集的权威来源；冲突报 DATA_SOURCE_CONFLICT。绑定通过稳定 dataset ID 完成，不用数组位置。
保存源文档，不把规范化后 option 回写成用户原始意图。编译元数据包含 compilerVersion、capabilityProfile、dataRevision 和显式环境设置。

## 数据语义
- missing/null：缺失与零不同；不做静默填补。intent 默认保留间断，按图表能力验证。
- 数值：仅有限数值；数值字符串只有显式转换时接受。金额单位与百分比比例必须声明。
- 时间：显式字段类型及解析格式；带偏移的 ISO 时间可标准化，日期与时间点分开处理。无时区时间需要显式时区，不能使用机器本地时区猜测。
- 排序：稳定排序，明确字段、方向和 null 排序位置；无排序时保留数据顺序。
- 聚合：sum/count/mean 等以白名单、分组字段和结果字段显式声明。重复分类不自动求和；若图表语义有歧义则诊断。
- 行身份：宿主提供稳定 rowId；没有 rowId 时事件明确标为位置身份，并绑定数据 revision。
- 大数据：数据留在宿主，模型只接收字段描述、必要统计和经过授权的样本。限制项由 capability profile 明示并执行。

## 操作与状态
操作候选字段为 operationId、chartId、baseRevision、type、payload。运行状态候选为 empty、ready、updating、error、disposed。
重复 operationId 且 payload 相同返回已有结果；同 ID 不同 payload 返回 OPERATION_ID_CONFLICT。过期 baseRevision 返回 REVISION_CONFLICT。成功应用一次只增加一次 revision。
校验和编译成功后才进入提交；渲染失败保留最后成功快照，报告可重试状态。取消、销毁后到达的异步结果不得复活实例。幂等缓存必须有明确会话作用域、容量和保留期，不承诺跨进程永久去重。

## 流式
文本提取器只接受约定 JSON 对象或指定代码块；多候选结果报歧义。不得静默补数字、改字段或执行表达式修复 JSON。上游部分状态暂存，不标记为有效 ChartDocument。只有完整有效状态进入提交。

## 诊断
统一结构包括 code、severity、path(JSON Pointer)、message、recoverable，以及可选 suggestions、details。错误码稳定，文案可以改进。不能在 details 中默认回显数据行、令牌或绝对敏感路径。
首批错误：INVALID_SCHEMA、UNKNOWN_FIELD、UNSUPPORTED_CAPABILITY、DATA_SOURCE_CONFLICT、REVISION_CONFLICT、OPERATION_ID_CONFLICT、RESOURCE_LIMIT、RENDER_FAILED。

## 事件
事件包含 eventId、chartId、chartRevision、dataRevision、type 和 payload。选择事件返回稳定行/系列身份与必要字段；聚合结果用分组键和聚合元数据，不伪造单行 ID。hover 默认不发给 Agent；宿主选择订阅、节流及数据披露范围。

## 兼容与演进
每个适配器记录上游包名、精确测试版本、协议 profile、支持操作、限制和验证证据。未测版本标 unverified，不能写 supported。
协议/模型/图表类型/输出环境分别列矩阵。模型可访问不等于模型任务成功；MCP 可连接不等于客户端可显示交互图表。
破坏性 schema 变更必须新版本、迁移说明和旧输入的明确拒绝/转换行为。转换不改变数值含义。初期不承诺对所有历史实验版本自动迁移。
