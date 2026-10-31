---
doc_id: spec-0036-tasks
version: "0.3"
status: verifying
updated: 2026-10-31
language: zh-CN
---
# M4 执行与验收

[English](tasks.md)

冻结评测全部结束且最终修改通过远端CI前，M4保持verifying。[结构化证据](verification.json)及[支持矩阵](../../docs/zh-CN/support-matrix.md)区分安装包、宿主、模型与CI的结果。

| AC | 结果 | 证据 |
| --- | --- | --- |
| AC16 | 工具与评分器检查通过；替代语料真实运行中 | [运行前审查](holdout-audit-v2.json)、[冻结来源](evaluation-provenance-v2.json)；60任务×4模型×3轮；私有注册表与独立编写的图形值，保留原始响应/失败。 |
| AC17 | 本地及Linux CI通过 | 11个隔离tarball，Node22.22.3/24.22.1各45项安装后浏览器测试；导出/类型/CLI/官方MCP/worker/地图/宿主SDK/资源/许可。[性能](performance.json)，浏览器[22](browser-performance-22.22.3.json)/[24](browser-performance-24.22.1.json)。 |
| AC18 | 已推送实现通过远端CI；最终报告版本待复验 | [CI41207042168](https://github.com/diysimon/ChartNexus/actions/runs/41207042168)，提交7345f34：verify、browser、两项packages及required全部通过。 |

## 实现与回归发现

共享ECharts模块配置替代整包导入。安装后的浏览器测试发现零占比饼图缺少ARIA注册，已在验收前修复。全部包生成LICENSE/NOTICE。消费者通过overrides固定经审核的锁文件版本，只解析tarball和安装后的依赖，不链接工作区源码。

提交1eb69c6的[首轮远端CI](https://github.com/diysimon/ChartNexus/actions/runs/41206228999)暴露三项问题：包含七次子进程的CLI用例超过5秒、强制点击SVG图例失败、离线消费者缺少Rolldown Linux依赖。拆分CLI用例但不延长超时，采用Playwright普通点击的稳定性/命中检查，保留失败轨迹和截图，并在线解析固定版本消费者元数据、提前验证Vite导入。下一轮完整远端CI中相关检查全部通过。已有完整元数据/内容缓存时仍可离线运行，没有删断言或增加重试。

## 评测资格

原[语料审查](corpus-audit.json)因家族重叠拒绝独立性；中断开发结果的[来源](evaluation-provenance.json)/[快照](evaluation-summary.json)保留为已替代记录，不是留出验收证据。替代语料在模型调用前完成审查与冻结，以30个公开任务和教学配方为参照，隔离宿主目录组合家族；不声称与编译器测试、协议基本能力或模型常识隔离。作者/审查者为同一本地Agent。

冻结评分器因图形表示变化误判合法的可选引用`keyField`。独立且经过测试的报告修正保留严格分数与原始渲染，先验证原始键再归一化，仍拒绝错误源/版本、重复键、数值变化、任务要求的身份字段及渲染失败。披露两种评分及修正来源，不改原始记录、提示词、修复机会或冻结运行器源码。见[指南](../../docs/zh-CN/trial-distribution.md)。

## 正在执行的验收

完成720轮，审查失败，导出不含私有数据的聚合结果，并依据建议95%目标记录各模型的实验性状态。随后提交最终证据/文档、通过SSH推送，并验证该精确版本的required CI。包保持私有，不授权也未执行npm发布。
