---
doc_id: spec-0035-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: zh-CN
---
# M3 执行与验收证据

[English](tasks.md)

## 已交付

A12–A15 已在本地完成。四个独立的 0.3 编译器、类型专属严格 Schema、完整数据表和稳定身份接入浏览器/SVG/worker。共享地图准备/注册位于新增私有 workspace 包 @chartnexus/echarts，复用原有 ECharts peer，没有新增第三方运行依赖。core 只依赖 schema 与纯工具，不引入 ECharts、DOM、网络或模型 SDK。

| AC | 结果 | 证据 |
| --- | --- | --- |
| AC12 雷达 | pass | [编译测试](../../tests/chart-expansion.test.ts)：显式范围/单位、对象/指标上限、null/重复/越界拒绝、行键/重排、源数据保留、两主题五档和 SVG；[浏览器测试](../../tests/browser/chart-expansion.spec.ts)验证真实选择及图例/数据访问。 |
| AC13 树 | pass | 编译测试覆盖孤儿/自环/环/多根/重复/深度错误、重复 label、1000行显式回退且不丢数据。浏览器验证真实节点事件、折叠/重排/resize 保留、拓扑变化重置及失败更新不改 revision。SVG 明示折叠概览并含完整源层级。 |
| AC14 桑基 | pass | 编译测试覆盖端点、自环、重复边、含零边的环、负/null/字符串权、引用修订不匹配、节点上限、零流量渲染、流量差额和原文模板符号；浏览器真实点击产生 node/edge 身份。 |
| AC15 地图 | pass | [资产测试](../../tests/map-assets.test.ts)与 Node crypto 核对 SHA-256，覆盖克隆、Polygon/MultiPolygon、Unicode 区域键、非法几何/元信息/hash、20000点精确边界、8次注册上限与同版本替换拒绝。编译/浏览器区分0/null/缺失、失败保留修订；Agent 测试在有界 worker 中渲染四类图并拒绝被篡改的地图 hash。 |
| AC16 一致性 | pass | [recipe 台账](../../tests/resource-inventory.test.ts)、完整/投影 Schema、生成资源/诊断及双语检查。四类图均在固定真实 OpenUI/A2UI/COSUI JSON/Marklang SDK 中挂载、非法输入保留旧图、销毁清理。旧套件继续通过。 |

## 验证

[结构化证据](verification.json)记录环境与日志指纹。`pnpm check` 通过 **30个文件中230项单元/集成测试**、20项参考自检，以及生成、94组双语文档、格式、lint、类型和演示构建。最终浏览器套件 **44项通过**。本轮没有新增真实模型评测，已有浏览器 Ollama 用例使用模拟传输。远端 CI 和全包干净安装未执行。

已采集四类图明暗主题代表截图，并查看浅色雷达、深色树/桑基和浅色地图。视觉检查发现桑基默认显示内部ID、树节点与标签重叠，最终修正标签映射/位置和地图标签对比度，测试及截图已更新。全量回归曾发现 Marklang 隐藏恢复的 ResizeObserver 通知警告；将暂存提交安排到下一动画帧、销毁时取消，并断言无页面错误后解决。视觉截断时完整源表仍保留原文。

完整 ECharts 演示包仍有体积警告；模块精简和性能属于 M4。workspace 重链接使用已有离线 pnpm store，不等于已发布包的干净安装。截图、本地日志保持忽略。本轮未提交、推送或发布。

## 尚有限制

见[使用与限制](../../docs/zh-CN/chart-expansion-03.md)。地图资产归宿主所有，不由模型提供；自制两区域例子不代表真实边界。树 SVG 是初始折叠概览，不导出浏览器展开状态。Marklang 保留整篇替换重置状态的语义。不代表所有模型、所有协议、设备或全面 GIS/无障碍认证。M4 最终隐藏集评测、打包、性能和远端 CI 仍待完成。
