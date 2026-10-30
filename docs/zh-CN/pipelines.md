---
doc_id: pipelines
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: zh-CN
---

# CI/CD 流水线与门禁

[English](../en/pipelines.md)

## 状态
本文件定义待实现流水线；本轮没有创建 GitHub Actions YAML、启用分支保护或发布任务。CI workflow 就绪后必须用真实运行证据更新状态，不能仅凭文件存在声称已启用。

## PR 流水线
| Job | 检查 | 触发与依赖 |
| --- | --- | --- |
| docs | 本地链接、配对文件、版本元数据、模板完整性 | 所有 PR |
| quality | format、lint、typecheck | 代码/配置变化 |
| contracts | Schema 合法性、fixtures、生成物同步 | 契约、核心、资源、生成器变化 |
| unit | 编译、数据语义、操作、错误路径 | 相关代码变化 |
| browser | DOM 生命周期、交互、适配器与视觉基线 | runtime/适配器/依赖变化 |
| package | build、pack、干净环境安装和 exports | 可发布包/打包配置变化 |
| offline-eval | 固定任务和已记录轨迹回放 | 模型资源、核心或适配器变化 |
| required | 汇总必要 job 结果 | always；任何必需项失败或意外跳过即失败 |

文档专用 PR 可以跳过不相关代码检查，但 required 必须核实跳过原因。不要通过只给整个 workflow 配 paths 导致 required check 永久 pending。公共契约变化扩大检查范围，不仅测试直接修改包。
同一 PR 新提交可取消旧验证运行。发布工作不采用这种可中断策略。

## 执行环境
固定 Node/pnpm、锁文件、浏览器与字体。缓存键包含平台、运行时和 lockfile hash；缓存不作为正确性依赖。权限默认 contents:read，第三方 Actions 固定提交 SHA。外部 PR 不获得发布或模型凭证，不在高权限 pull_request_target 中执行 PR 代码。
设置 job 超时和产物保留期，具体数值在初始化 Spec 中确定。失败上传必要的截图、trace、诊断；不上传真实业务数据、密钥或未经许可的模型轨迹。

## main 与定期检查
合入 main 重跑受影响门禁，建立可追溯基线。依赖更新通过 PR 进入相同门禁。定期检查上游 SDK 新版本只报告兼容结果，不自动扩大 peer 范围或更新视觉基线。
真实模型评测使用独立受控 workflow，手动触发或明确授权的定期计划；指定模型、任务、最大调用数、费用上限与数据范围。它不成为外部 PR 必需凭证。

## 发布流水线
1. 维护者审查 changesets、破坏性变更、兼容矩阵、双语说明和许可。
2. 生成版本 PR；版本 PR 通过全量适用检查并合入。
3. 发布作业锁定待发布 commit 与 lockfile，重新构建并 pack。
4. 对实际 tarball 运行干净安装 smoke、exports 和许可证检查。
5. 通过受保护环境进行发布；优先可信发布/OIDC，最小化长期 token。
6. alpha/beta 使用对应 prerelease dist-tag，不覆盖 latest。
7. 记录 npm 产物版本、源码 commit、校验和及构建 provenance；随后更新文档和 GitHub release。

发布 job 使用独占 concurrency；失败不能盲目整体重试。先核对每个包是否已经发布，已发布版本不可覆盖，按依赖顺序恢复剩余包。禁止从 fork 发布。

## 回滚与恢复
npm 产物视为不可变。优先发布修复版本，必要时 deprecate 问题版本并将 dist-tag 指回经过验证版本；不要默认 unpublish。文档恢复到对应版本，保留事故和迁移说明。适配器回滚不得静默改变持久化文档的含义。
Git revert、npm dist-tag 调整与用户状态迁移是不同操作，分别记录授权、证据和结果。

## 工作流上线验收
至少验证：普通 PR、文档 PR、故意失败的 required job、外部 PR 无秘密访问、取消旧 PR 运行、alpha dry-run/pack 检查。没有实际 npm 发布时，只能报告发布演练成功。
