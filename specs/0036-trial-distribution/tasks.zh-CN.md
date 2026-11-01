---
doc_id: spec-0036-tasks
version: "0.6"
status: done
updated: 2026-11-01
language: zh-CN
---
# M4 执行与验收

[English](tasks.md)

M4工程及评测已完成；所有profile保持实验状态，包未发布。完成测量不代表模型已适合生产自动运行。见[结构化证据](verification.json)。

| AC | 结果 | 证据 |
| --- | --- | --- |
| AC16 | 完成720/720轮；四模型各三次重复，保留全部失败 | [聚合](evaluation-summary-v2.json)、[完整性审核](evaluation-integrity-v2.json)、[来源](evaluation-provenance-v2.json)、[运行前范围审核](holdout-audit-v2.json) |
| AC17 | 通过：11个隔离tarball，Node22/24本地及Linux CI，每个消费者46项浏览器测试 | [性能](performance.json)、浏览器[22](browser-performance-22.22.3.json)/[24](browser-performance-24.22.1.json)、结构化包证据 |
| AC18 | verify/browser/两个package任务/required全部通过 | [远端CI](https://github.com/diysimon/ChartNexus/actions/runs/41230226310)，提交`2261351`；最终文档提交在交付时单独核验 |

> 边界澄清：以下结果描述当时的评测设置。模型调用和事实准确性由宿主负责，95% 实验目标不是 SDK 发布门槛。见[产品责任边界](../../docs/zh-CN/product-boundary.md)。

## 实现与回归发现

共享ECharts模块配置替代整包导入。安装后的浏览器测试发现零占比饼图缺少ARIA注册，已在验收前修复。全部包生成LICENSE/NOTICE。消费者通过overrides固定经审核的锁文件版本，只解析tarball和安装后的依赖，不链接工作区源码。

提交1eb69c6的[首轮远端CI](https://github.com/diysimon/ChartNexus/actions/runs/41206228999)暴露三项问题：包含七次子进程的CLI用例超过5秒、强制点击SVG图例失败、离线消费者缺少Rolldown Linux依赖。拆分CLI用例但不延长超时，采用Playwright普通点击的稳定性/命中检查，保留失败轨迹和截图，并在线解析固定版本消费者元数据、提前验证Vite导入。下一轮完整远端CI中相关检查全部通过。已有完整元数据/内容缓存时仍可离线运行，没有删断言或增加重试。

## 评测资格

原[语料审查](corpus-audit.json)因家族重叠拒绝独立性；中断开发结果的[来源](evaluation-provenance.json)/[快照](evaluation-summary.json)保留为已替代记录，不是留出验收证据。替代语料在模型调用前完成审查与冻结，以30个公开任务和教学配方为参照，隔离宿主目录组合家族；不声称与编译器测试、协议基本能力或模型常识隔离。作者/审查者为同一本地Agent。

冻结评分器因图形表示变化误判合法的可选引用`keyField`。独立且经过测试的报告修正保留严格分数与原始渲染，先验证原始键再归一化，仍拒绝错误源/版本、重复键、数值变化、任务要求的身份字段及渲染失败。披露两种评分及修正来源，不改原始记录、提示词、修复机会或冻结运行器源码。见[指南](../../docs/zh-CN/trial-distribution.md)。

## 原生兼容修复

补齐MarkLine/MarkPoint/MarkArea注册，不改变guarded native契约，也不扩大strict-basic校验范围。[SVG回归](../../tests/native-markers.test.ts)和[浏览器回归](../../tests/browser/native-markers.spec.ts)先复现缺失标签，修复后验证三个标签均呈现、替换后消失以及销毁清理。体积预算保持不变并通过。

模型调用使用原冻结引擎；结束后仅变更记录中的两处引擎源码/构建文件。[精确渲染重放](render-replay.json)覆盖所有323个原来渲染成功的候选，包括语义错误候选，323个SVG哈希全部一致。没有借重放增加模型调用、改分或删除失败；此证据只覆盖观测候选，不保证任意文档。

## 模型结果与资格

| 模型 | 首次结构合格 | 首次任务正确 | 修复后任务正确 | 原严格评分：修复后 |
| --- | --- | --- | --- | --- |
| `qwen3.5:9b` | 127/180 (70.6%) | 51/180 (28.3%) | 60/180 (33.3%) | 6/180 |
| `mistral:latest` | 106/180 (58.9%) | 43/180 (23.9%) | 53/180 (29.4%) | 38/180 |
| `qwen3.5:27b` | 175/180 (97.2%) | 111/180 (61.7%) | 122/180 (67.8%) | 26/180 |
| `goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest` | 0/180 (0.0%) | 0/180 (0.0%) | 0/180 (0.0%) | 0/180 |

在这一具体实验中，四个结果的修复后正确率均未达到建议95%目标；Qwen3.5:27b的首次结构合格率为175/180，达到独立的结构目标。这些数字既不授予模型资格，也不是SDK发布门槛。报告层可选键修正保留严格原分。诊断子集的JSON Pointer提示歧义、零样本仅Schema提示、同一作者审查及宿主目录题目范围均限制结果解释，见[指南](../../docs/zh-CN/trial-distribution.md)。这不是beta发布，也不是通用模型排名。私有题库与原始响应保持忽略，未发布npm。
