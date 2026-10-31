---
doc_id: spec-0009-tasks
version: "0.1"
status: done
updated: 2026-10-31
language: zh-CN
---

# 本地 Ollama 图表体验页

[Other language](tasks.md)

- [x] 实现受限本地服务和交互页面。
- [x] 验证失败、取消、输入边界与真实浏览器 + Ollama 生成。
- [x] 更新双语文档、执行门禁并记录证据。

## 证据（2026-10-31）
- AC-01：真实本机 Ollama `qwen3.5:9b` + Chromium 149：用户提示生成 120/180/150 柱状图；使用上一文档发起的后续修改生成折线图并保留上述数值。截图位于忽略目录 `test-results/ollama-live.png`。
- AC-02/03：`tests/browser/ollama.spec.ts` 覆盖错误 JSON、取消、服务不可用和原生 option；`tests/ollama-proxy.test.ts` 覆盖同源、固定地址、请求上限、错误上游响应、超时和无效上一文档。完整浏览器套件 10 项通过。
- AC-04：`pnpm check`：55 项测试、生成资源、52 对双语文档和构建通过。远程模型、云 Ollama 配置和公网部署未测试。

- 缺少数据提示：浏览器测试覆盖 `{}` 以及上一张图表保留；`pnpm check` 通过。联网查询尚未实现，等待数据来源选择。
