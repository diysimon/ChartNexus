---
doc_id: spec-0034-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: zh-CN
---
# M2 执行与证据

[English](tasks.md)

## 已完成工作

- A06/A07：尺寸感知纯展示、共享明暗主题、五档复杂度、窄布局显式回退、完整源数据/渲染数据表、键盘图例控件和 SVG 标题/数据元信息。
- A08/A09：等待尺寸协调器、Marklang 原子暂存、稳定键选择与兼容图例状态保留。resize 使用已提交快照且不增加 revision；渲染失败保留旧状态。
- A10/A11：中立 JSON buffer、严格 Ollama NDJSON 分帧/终止/取消、过期结果保护及最多两次修复；固定 OpenUI、A2UI、COSUI JSON 和 Marklang 真实 SDK 用例。

## 验收证据

| AC | 结果 | 证据 |
| --- | --- | --- |
| AC01 | pass | [展示测试](../../tests/presentation-layout.test.ts)：七类型 × 两主题 × 五档 × 四宽度 × 三高度；[浏览器几何测试](../../tests/browser/host-quality.spec.ts)及中英文长标签/双轴/热力样本正常展示或显式回退；resize 保持 revision |
| AC02 | pass | 同组测试：声明背景上文字对比度≥4.5:1、必要图形≥3:1；保留原始 null/单位/键与 SVG 元信息；浏览器键盘可访问表格/图例 |
| AC03 | pass | 宿主质量浏览器测试：隐藏恢复、销毁待挂载项、第二张暂存图故障保留旧 Marklang 节点；同帧隐藏/更新/显示回归通过重新观察尺寸恢复 |
| AC04 | pass | 契约及宿主质量测试：键重排、图例保留/删除/新增可见、不兼容单位重置、JavaScript 保留名称和 resize 故障注入 |
| AC05 | pass | [解码器测试](../../tests/ollama-stream.test.ts)、[演示浏览器测试](../../tests/browser/ollama.spec.ts)、已有有序控制器测试和[真实本地流式证据](ollama-verification.json) |
| AC06 | pass | OpenUI/A2UI/COSUI JSON/Marklang 的固定真实 SDK 浏览器套件、有序 profile 与共享生命周期；[矩阵及显式不支持项](../../docs/zh-CN/chat-host-quality.md) |

## 验证与限制

[机器可读证据](verification.json)：`pnpm check` 通过 28 个文件中 207 项测试及 20 项参考自检；完整浏览器套件通过 33 项。首次收尾回归发现 Marklang 同帧可见性竞争（32 通过/1 失败）；重新观察尺寸并加入确定性回归后，全量重跑为 33/33。已在本地查看浅色布局与深色热力图截图；被忽略的截图/日志不是仓库必需资产。自动组合验证加代表性视觉检查，不代表手动查看了所有组合。

真实同源代理 → 本地 Ollama → 严格解码器 → 编译器：qwen3.5:9b Q4_K_M，单个合成样本，127 个片段、10755ms，首次输出保持 [3,5]；另一个真实请求取消通过。浏览器 Ollama 失败/修复用例使用模拟传输。这不是独立隐藏集基准，也不证明所有模型支持。

只验证声明的明暗宿主背景对比度；透明图需匹配宿主背景。全面 WCAG 认证、任意字体/背景、远端宿主、水合和移动设备认证未验证。Marklang 拒绝有序操作信封，整篇替换会重置状态，要求可信/已净化 Markdown。不支持缩放状态保留及非 Ollama 分帧/SSE。M3/M4 仍待完成；本轮未提交、推送或发布。
