---
doc_id: spec-0001-spec
version: "0.1"
status: done
updated: 2026-10-30
language: zh-CN
---

# SPEC-0001：核心开发基线

状态：Done；日期：2026-10-30。授权：用户要求开始代码开发。

## 范围
实现 schema/core/runtime/render 四个私有 workspace 包、两种输入、四类基础 intent、同步宿主数据引用、DOM 与 SVG、离线演示、基础 CI。暂不实现 MCP、UI 协议、发布、多轮 operation 去重或完整原生 ECharts option。

## 设计决定
schemaVersion 0.1 为实验契约，未发布。JSON Schema 是形状源，生成 TS 类型。intent 明确 x/y/series 映射；饼图使用 x 分类与 y 数值；scatter 的 x/y 为定量。数据为字段名列表和对象行；支持宿主注册 id/revision，不主动联网。
原生模式只支持声明的安全组件与四类 series；不执行代码，不允许外部资源、HTML tooltip、custom series。限制输入 1 MiB、深度 32、行数 10000、系列 50、SVG/DOM 尺寸 4096。同步编译和 ECharts 执行无法硬中断，靠结构预算限制；进程隔离超时留待服务化，不宣称已支持。
完整替换使用 notMerge；本阶段不保留缩放/图例交互状态。更新失败保存上一有效渲染；同一 runtime 禁止换 chartId。选择事件含图表 revision 和数据 revision，intent 返回行位置身份，不伪装稳定 rowId。

## 验收
- AC-01：两模式互斥，未知字段、函数、非有限值、危险键与超限有结构化诊断。
- AC-02：四类 intent 与分组编译、缺失值、字段、数据版本检查正确；输入不变且确定性。
- AC-03：浏览器挂载、类型切换、系列删除、数据更新、无效更新保留、resize/dispose 正确。
- AC-04：Node 无 DOM 编译并输出真实 SVG，无密钥运行。
- AC-05：生成物、双语文档、示例与 CI 检查一致，版本精确锁定。

## 验证与资源
Vitest 验证契约/语义/SSR；Playwright 验证真实浏览器生命周期和选择事件；build 与 docs 检查。数据为合成销售记录。运行证据记 tasks；无真实模型或外部协议验证声明。

## 兼容、风险与回滚
私有包不发布；保留原始文档，不提供历史版本迁移。ECharts 6.1.0、Node 22 的本地测试范围不扩大为所有版本支持。回滚本地改动不改变远端。Git 同步若网络失败记录为独立阻塞。
