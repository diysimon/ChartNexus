---
doc_id: template-release-checklist
version: "0.1"
status: template
updated: 2026-10-29
language: zh-CN
---

# 发布检查模板

[English](../en/release-checklist.md)

# <版本> 发布记录

状态：planned；源码 commit：<SHA>；dist-tag：<alpha/beta/latest>；负责人：<实际身份>

- [ ] 发布范围、changesets 与双语说明一致。
- [ ] 公共 API/Schema/peer 兼容性和迁移说明已审阅。
- [ ] 固定 commit 的所有必需 CI 通过。
- [ ] 实际 tarball 干净安装、公共导出和许可证通过。
- [ ] 支持矩阵有版本与证据；未验证项没有标成 supported。
- [ ] 发布授权、环境保护和最小权限已就绪。
- [ ] prerelease 未覆盖 latest；已发布版本不覆盖。
- [ ] 产物版本、校验和、provenance 与源码映射已记录。
- [ ] 文档站、GitHub release 和已知限制同步。

## 产物
| 包 | 版本 | npm 状态 | commit | 校验和/证据 |
| --- | --- | --- | --- | --- |
| <包> | <版本> | not-published | <SHA> | <证据> |

## 失败与恢复
<已发布哪些包、哪些未发布、恢复操作和结果；dry-run 不标 published。>
