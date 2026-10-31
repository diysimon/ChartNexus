---
doc_id: trial-distribution
version: "0.5"
status: experimental
updated: 2026-11-01
language: zh-CN
---
# M4 试用与分发

[English](../en/trial-distribution.md)

见 [SPEC-0036](../../specs/0036-trial-distribution/spec.zh-CN.md)、[证据](../../specs/0036-trial-distribution/verification.json)和[支持矩阵](support-matrix.md)。冻结评测及已推送版本 CI 全部完成前，M4 保持 verifying。全部11个包仍为私有、未发布。

## 评测来源与范围

首版私有语料**未通过任务家族隔离审查**：零占比饼图、纯数值散点图与教学示例存在重叠。保留其中断的开发结果及[拒绝记录](../../specs/0036-trial-distribution/corpus-audit.json)；私有存储不等于独立性。

替代语料的[运行前审查](../../specs/0036-trial-distribution/holdout-audit-v2.json)以30个公开开发任务和教学配方为参照，纳入60个新编写的宿主目录组合任务：精确授权快照、草稿干扰项、字典序更新但已撤销的版本、图数据原子重定向、保留样式的编辑、过期版本诊断与恢复。包含33个创建任务（11类×3）、12个编辑、9个非法文档、6个恢复。这些家族与公开教学/评测隔离，**不声称**与协议基本能力、编译器测试或模型常识隔离。作者和审查者为同一本地 Agent，不属于外部审计或通用基准。

合成数据表及期望图形值均本地编写。模型仅获得目录元数据、请求、前序/非法文档及宿主地图元数据。注册表行数据和标准答案不进入请求、教学/RAG资源、包或 MCP 资源。数值、树节点与边断言从原始数据独立编写；编译参考文档仅检查一致性，不用于生成期望值。该评测衡量指定图表类型下的构建与授权数据源/版本选择，不衡量事实检索或开放式图表推荐。

[运行来源](../../specs/0036-trial-distribution/evaluation-provenance-v2.json)在请求前冻结源码、构建 JS、锁文件、提示词、语料、本地模型摘要及 Ollama 版本。配置：JSON模式、关闭 thinking、温度0.2、种子42/43/44、上下文32768、输出2048 token、请求90秒、响应上限2MiB。4个模型×60任务×3轮，共720轮。最多两次修复只使用实际解析器/编译器/渲染器诊断；单纯与标准答案不符不增加修复机会。属于宿主编排的 Agent 辅助生成，不是模型自主选择 MCP 工具。无云端上传或模型下载。

## 评分及报告修正

冻结的严格评分器比较数据源对象哈希、独立编写的编译后图形值以及要求的文档字段。运行中发现其误判合法可选 `keyField`：带键图形使用 `{id,value}`，不带键时使用标量。报告阶段的 `reference-keyfield-equivalence-v1` 修正先验证和编译原始候选，仅在移除引用数据的可选键后与期望数据源哈希完全相同时，进行等价比较。原始校验与实际 SVG 渲染必须成功。错误数据源/版本、非法或重复键、数值改变、任务要求的身份断言及渲染错误仍然失败；不归一化内联数据。即使归一化后的数据源匹配，原始文档的明确断言也仍然有效；回归用例覆盖精确`/data`断言。收紧该保护后，当时已有885次尝试的分数完全不变。

原始严格评分、响应、SVG哈希和全部失败均保留。单独报告修正分数、差值与修正模块哈希。请求、设置、修复机会和模型提示词均未改变。明确披露这是事后修正的表示形式误判，不伪装为预注册指标，也不声称覆盖全部语义等价情况或像素一致性。

报告分别记录首轮 JSON/结构/编译/源数据及图形保真/正确性、修复后数量、延迟、token和失败类别。明确计划分母与未完成数，未完成结果不能用于模型准入。Wilson区间仅为描述统计，多次重复相关，并非独立总体抽样。结构及修复后95%的建议目标不承诺生产可靠性；未达标模型保持实验性，完成评测不代表达标。

```sh
pnpm eval:independent:check
pnpm eval:independent --corpus .local/m4-holdout-v2/corpus.json --models qwen3.5:9b,mistral:latest,qwen3.5:27b,goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest --output outputs/m4-holdout-v2
# 原进程退出后，使用完全相同的参数追加 --resume。
node scripts/report-independent-evaluation.mjs outputs/m4-holdout-v2 outputs/m4-holdout-v2/aggregate.json --semantic
```

私有语料和原始日志保留在维护者本地并被 Git 忽略，其他用户需独立编写语料。`freeze.json`、`status.json`、`summary.json`和各模型 JSONL 支持审计与续跑。源码、语料、提示词、模型、Ollama或设置漂移会拒绝续跑；语义重评分也拒绝源码/语料漂移。聚合导出不含请求、行数据、期望值及模型文本。JSON解析异常可能夹带私有响应片段，因此公开报告仅保留稳定错误类别；错误码与JSON指针的匹配情况单独统计，但不放宽完整正确性的要求。PR不自动运行真实模型，也未配置定时任务。

## 结果解释边界

这是零样例的“Schema＋诊断说明”入口基线：没有注入配方检索、RAG示例、few-shot示范，也没有启用供应方强制JSON Schema解码。调用使用JSON模式，投影Schema以文本提供。结果衡量这一入口设计在宿主目录组合任务上的表现，不代表模型的通用能力、普通内联绘图成功率或所有模型/宿主组合。

9个诊断任务的请求及系统提示未明确要求JSON Pointer格式。已完成模型能选对错误码，却使用点分路径；修复反馈虽然给出实际指针，也可能诱导其返回不需要的修复图表。保留全部精确匹配失败，单独报告错误码/路径一致率；这一子集仅作为探索性的契约跟随测试，不能据此直接断言模型不会诊断版本冲突。产品路径应直接返回校验器的结构化诊断，真实路径已经由工具计算。不得用这批结果调提示词后，再把下一轮称为未经接触的留出评测。

## 安装包验证

`pnpm test:packages --browser`构建并打包11个包，在新的系统临时目录安装 tarball，不含祖先工作区或源码软链接。固定经审核的锁文件版本，验证实际 peer 版本。CI在线解析注册表元数据，因为冻结工作区安装可能仅缓存包内容，缺少新消费者解析可选平台依赖所需的元数据；已有完整内容/元数据缓存时可用`--offline`。两种方式均不证明所有未来 semver 解析组合。

审计归档路径、LICENSE/NOTICE、JS/类型导出、静态资源、安装后的CLI、官方stdio MCP客户端协商/工具/资源/SVG往返、worker相对导入、宿主地图资产和实际固定版本GenUI适配器。浏览器运行前先导入Vite检查原生依赖。TypeScript通过NodeNext及第三方`skipLibCheck`解析已安装声明。macOS arm64下Node22.22.3/24.22.1各通过45项安装后浏览器测试；当前远端状态见结构化证据。保留临时消费者和失败日志，不执行npm发布。

## 模块与性能

共享桥接注册10个ECharts系列模块（组合图使用柱/线）、SVG渲染器、组件、标签布局及ARIA。安装测试曾发现并修复零占比饼图缺少ARIA注册。原生模式仍限制为4类图表，不开放任意插件。

[预算](../../resources/performance-budgets.json)冻结全导出压缩ESM的原始/gzip字节基线并预留10%。`includePeers:false`外置包括Ajv在内的全部第三方依赖，true包含宿主SDK及依赖。runtime外置依赖时gzip约35.4kB，打入依赖约362.3kB；这是SDK体积，不是demo体积。

```sh
pnpm benchmark
node --expose-gc scripts/benchmark.mjs --compare /absolute/path/to/prior-baseline.json
```

基准强制字节预算，记录编译/SVG中位数、p95及GC后堆内存：100/1000/10000行、雷达6×8、树1000节点、桑基200节点/1000边、地图1000区域、原生50系列/50000点。浏览器预热两次后记录10个生命周期样本，断言实例/SVG/可访问性DOM清理。堆内存观察不证明零泄漏；并行模型负载下的耗时仅供观察。同机同运行时且空闲时可启用20% p95对比，共享CI不设硬耗时门禁，也无跨设备SLA。

## CI 与迁移

required聚合verify、browser和Node22/24安装包任务；保留失败轨迹/截图及包/性能报告。[M4任务](../../specs/0036-trial-distribution/tasks.zh-CN.md)记录实际推送版本的运行、失败与修复，旧版本成功不能证明后续修改。[0.3迁移](contracts-03.md)通过`migrateIntentTo03`显式执行；原生仍为0.1，不适用当前图表的字段直接拒绝。M4不自动迁移用户数据或发布包。
