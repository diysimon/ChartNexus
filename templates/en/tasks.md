---
doc_id: template-tasks
version: "0.1"
status: template
updated: 2026-10-29
language: en
---

# Tasks and execution evidence template

[简体中文](../zh-CN/tasks.md)

# SPEC-NNNN tasks

## Ordered tasks
| ID | Task and artifact | Dependency | AC | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| T01 | <contract/implementation/test/resource> | None | AC-01 | planned | None |

States: planned/in-progress/blocked/done. Done links artifacts and verification; canceled work records reasons rather than claiming completion.

## Execution log
| Date | Command/action | Environment/version | Result | Evidence |
| --- | --- | --- | --- | --- |
| <date> | <command> | <environment> | not-run/pass/fail | <path> |

## Blockers and handoff
<Completed work, next action, blocker reproduction, continuation condition; no secrets.>
## Final checks
- [ ] Every AC passes, or scope was formally changed with reasons.
- [ ] Bilingual resources, schemas, examples, and changeset agree.
- [ ] Executed and unexecuted checks are distinguished.
- [ ] Delivery lists limitations without claiming unverified host/publication status.
