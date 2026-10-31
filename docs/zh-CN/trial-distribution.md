---
doc_id: trial-distribution
version: "0.1"
status: experimental
updated: 2026-10-31
language: zh-CN
---
# M4 试用与分发

[English](../en/trial-distribution.md)

M4 实现已落地；完整冻结模型评测和远端 CI 尚未结束，**验收仍未关闭**。参见 [SPEC-0036](../../specs/0036-trial-distribution/spec.zh-CN.md)、[证据](../../specs/0036-trial-distribution/verification.json)和[支持矩阵](support-matrix.md)。所有包保持 private、未发布。

## 独立评测

**题库审核：不接受为独立留出集证据。** [复核](../../specs/0036-trial-distribution/corpus-audit.json)发现与公开样例共享语义家族（全零饼图、仅改变数值的散点变体）。当前 60 题运行应视为**私有开发基线**，即使冻结输入保留历史 `split: heldout` 标签。AC16 需要重新编写家族分离题库并全新运行；资源隔离和保密不等同于独立性。


公开开发集包含原 20 题及[新增 10 题 0.3 样例](../../resources/evaluation/development-03.json)。本机独立编写的私有集共 60 题：33 图表题（11×3）、12 编辑题、9 无效输入题、6 恢复题；不进入 Git、包、检索、训练示例或 MCP 资源。数据均为 Apache-2.0 合成数据，无生产数据或事实检索。按身份、排序、缺失值、正负范围和拓扑等语义组合划分任务家族，允许共享协议/Schema。这是项目自建评测，不是外部审核基准。

运行器只白名单传入请求、原始数据、此前/无效文档和宿主地图元信息；预期数值和断言不进入消息。指定图表类型的任务使用投影 Schema，测量按要求构造图表的能力，不代表任意图表推荐。显式指定类型按要求评分；评分器也支持未来选择题的多个可接受类型。完整 data 对象摘要保留字段/行顺序和原值，仅规范化对象键顺序。独立断言核对编译数值/结构及指定选项，不等同于像素比较或所有语义等价形式的证明。

请求前冻结模型摘要/量化、Ollama 版本、源码与**构建 JS** 摘要、锁文件、提示词、Schema 投影、题库和随机种子。设置为 JSON 模式、关闭 thinking、温度 0.2、种子 42/43/44、上下文 32768、输出上限 2048 token、请求期限 90 秒、响应上限 2 MiB。各模型重复三轮，至多修复两次，只由解析/编译/渲染诊断触发修复；合法但答错的图不会获得标准答案提示或额外机会。无效文档题的反馈来自真实 Agent 校验工具。这是宿主编排的 Agent 辅助生成，不是模型自主选择 MCP 工具。

分别记录首次 JSON/结构、编译、源数据/图形值保真、正确性、真实 worker SVG 摘要、耗时和失败。汇总以计划总量为分母，显式列出 pending；未完成比例不能用于模型准入。Wilson 区间仅为任务轮次的描述性统计，重复任务具有相关性。拟定的 95% 结构/修复后正确率是评估标准，不是已验证服务承诺；未达标模型保持实验状态。冻结前中断试运行已保留，没有删除失败或据此调优提示词；该题库已经试用，不能宣传为未经接触的外部留出集。

```sh
pnpm eval:independent:check
pnpm eval:independent --corpus .local/m4/heldout.json --models qwen3.5:9b,mistral:latest,qwen3.5:27b,goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest --output outputs/m4-baseline-v1
# 原进程退出后，使用完全相同的参数恢复：
pnpm eval:independent --corpus .local/m4/heldout.json --models qwen3.5:9b,mistral:latest,qwen3.5:27b,goonsai/qwen2.5-3B-goonsai-nsfw-100k:latest --output outputs/m4-baseline-v1 --resume
```

私有题库只存在于维护者本地；其他消费者需自行编写独立题库。公开开发题可测试工具，但不构成留出证据。原始请求/结果保存在忽略的 `outputs/`；`freeze.json`、`summary.json`、`status.json` 和各模型逐次 JSONL 支持检查/续跑。代码、提示词、题库、模型摘要、Ollama 或设置变化会拒绝恢复；异常中断保留已写入记录。CI 不逐 PR 运行真实模型；没有配置云端接口、模型下载或定时任务。

## 安装产物

`pnpm test:packages --offline --browser` 构建并打包 11 个包，在全新系统临时目录通过 file tarball 安装，父目录不依赖工作区，也不链接包源码。可复用依赖缓存字节；这是安装隔离，不是空下载缓存。演练从审核后的锁文件固定唯一传递版本并使用实际 peer 版本，不保证未来 semver 解析组合。缺少缓存时可去掉 `--offline` 联网安装。Node 22.22.3 与 24.22.1 已在 macOS arm64 本地通过，同组 tarball 摘要一致，各通过 45 项浏览器测试。

审计允许的归档路径、LICENSE/NOTICE、JS/类型 exports、全部静态 Agent/MCP 资源、隔离导入解析、CLI bin、stdio MCP 资源/SVG 摘要、SVG/地图 worker 相对路径、浏览器渲染及固定 React/San 适配器。消费者以 NodeNext 解析安装声明，第三方使用 `skipLibCheck`，不代表全面第三方类型认证。保留临时消费者和日志便于排查，清理时使用脚本打印的精确目录。不会发布到注册表。

## 模块、体积与性能

共享桥显式注册 10 个 ECharts 系列模块（combo 组合 bar+line）、SVG renderer、支持的组件、标签布局和 ARIA；浏览器与 worker 使用同一组合。安装回归发现全零饼图遗漏 ARIA 注册，已修复。内部组合保持原四类 native 支持，不开放任意插件。

[字节预算](../../resources/performance-budgets.json)以实测压缩 ESM 全导出构建加 10% 余量冻结。`includePeers:false` 将 **全部第三方依赖** 外置，包括 Ajv；true 则包含依赖/宿主 SDK。运行时 gzip 约 35.4 kB（依赖外置）/362.3 kB（打入依赖）。这是 SDK 测量，不是多页 demo；demo 仍可能提示大块体积。

```sh
pnpm benchmark
node --expose-gc scripts/benchmark.mjs --compare /absolute/path/to/prior-baseline.json
```

`pnpm benchmark` 强制字节预算并记录编译/SVG median/p95、GC 后堆观察及边界：100/1000/10000 行、雷达 6×8、树 1000 节点、桑基 200 节点/1000 边、地图 1000 区域、native 50 系列/50000 点。浏览器每档记录 10 次预热后挂载渲染、更新、销毁，断言没有残留实例/SVG/无障碍 DOM。堆差值不能证明绝无泄漏。可选 p95 20% 比较需使用空闲的同机器/运行时；CPU 名称相同不保证负载相同，不承诺跨设备绝对 SLA。预算缺失即失败；共享 CI 存在噪声，所以耗时比对按需开启。

## CI 与迁移

必需 CI 汇总 verify、browser、Node22/24 安装三个独立门禁，失败保留安装/性能/浏览器产物。工作流已本地实现，**未提交改动不存在对应远端运行**；旧提交通过不能替代本次验收。[0.3 迁移](contracts-03.md)仍通过 `migrateIntentTo03` 显式执行；native 保持 0.1，不适用字段报错而非丢弃。M4 不迁移用户数据或发布。在完整模型结果及授权推送版本通过 CI 前，0029 与 M4 保持未关闭。

## Aggregate report

```sh
node scripts/report-independent-evaluation.mjs outputs/m4-baseline-v1 specs/0036-trial-distribution/evaluation-summary.json
```

此命令仅导出统计、失败分类和来源，可在评测中运行；生成时间与 pending 数量标识未完成快照。模型准入必须先审查最终失败。
