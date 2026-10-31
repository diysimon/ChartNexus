---
doc_id: spec-0003-spec
version: "0.1"
status: done
updated: 2026-10-30
language: zh-CN
---

# OpenUI Lang 接入

[English](spec.md)

## 目标与范围
在真实 OpenUI React 宿主中从 OpenUI Lang 渲染 ChartNexus 图表。复用 OpenUI 解析器、Renderer 与现有 ChartDocument 编译器和 runtime，保留原生及 intent 两种输入；不包含模型供应商、标准 A2UI 或 COSUI 实现。

## 设计与契约
使用 @openuidev/react-lang 1.0.2、React 19 与 Zod 4。注册 ChartNexusChart 组件，使用 JSON 字符串属性传入完整 ChartDocument；只解析数据并送入现有校验管线，避免复制 ChartDocument schema。提示词指向权威 schema 和 recipes。流式输入可能不完整，宿主流式期间不提交候选状态；完成后解析和校验，无效更新保留上一有效图表并提供诊断。宿主可接收选择和诊断。卸载必须销毁 runtime；更新使用稳定图表 ID，数据引用需要宿主提供可信 registry。

## 验收与验证
- AC-01：真实 OpenUI Renderer 解析语言，在浏览器展示 intent 和原生图表。
- AC-02：完整更新替换旧图；流式半成品与无效数据保留上一有效状态，完成后产生诊断。
- AC-03：图表选择送达宿主，卸载释放 runtime。
- AC-04：工程检查及浏览器测试通过；双语文档、可运行演示和模型指引说明限制。

## 故障、限制与兼容性
遵守现有核心预算和 runtime 限制。JSON 错误时安全失败，不执行模型输出。不宣称完整协议或真实模型兼容。SDK、React、Zod 许可证为 MIT；浏览器/SDK 精确版本及结果记录在任务中，包体积与干净安装需要测量；不授权 npm 发布。可回退 adapter 和 demo 而不更改核心契约。如果 OpenUI 遇到格式错误时移除组件树，宿主应保留最后提交的 response。API 为未发布的实验功能。
