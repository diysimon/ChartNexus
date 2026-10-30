---
doc_id: template-tasks
version: "0.1"
status: template
updated: 2026-10-29
language: zh-CN
---

# 任务与执行证据模板

[English](../en/tasks.md)

# SPEC-NNNN 任务

## 有序任务
| ID | 任务与产物 | 依赖 | AC | 状态 | 证据 |
| --- | --- | --- | --- | --- | --- |
| T01 | <契约/实现/测试/资源> | 无 | AC-01 | planned | 无 |

状态：planned/in-progress/blocked/done。done 必须链接产物与验证；被取消任务记录原因，不能冒充完成。

## 执行日志
| 日期 | 命令或操作 | 环境/版本 | 结果 | 证据 |
| --- | --- | --- | --- | --- |
| <日期> | <命令> | <环境> | not-run/pass/fail | <路径> |

## 阻塞与交接
<已完成、下一步、阻塞复现、继续条件；不包含秘密。>
## 最终核查
- [ ] 所有 AC 已通过，或正式变更范围并说明原因。
- [ ] 双语资源、Schema、示例与 changeset 同步。
- [ ] 实际执行与未执行检查区分明确。
- [ ] 交付报告包含限制，不宣称未经验证的宿主或发布状态。
