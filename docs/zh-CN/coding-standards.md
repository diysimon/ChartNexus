---
doc_id: coding-standards
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: zh-CN
---

# 编码规范与工程要求

[English](../en/coding-standards.md)

## 强制规则
MUST/必须是合并要求；SHOULD/应当允许有记录的理由；MAY/可以是可选项。实现违反必须项时，先修正规范或实现，不能只在 PR 中忽略。仅涉及排版的文档修改无需功能 Spec。

## TypeScript 与 API
- 开启 strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes；禁止通过全局关闭规则解决局部错误。
- 外部数据使用 unknown，经边界校验后收窄。禁止公共 API 中的隐式 any；不得用双重断言绕过契约。
- 对外配置使用可序列化 JSON；不得传输函数、Date、Map、NaN、Infinity、undefined。
- 显式声明公共输入、输出和错误类型。对外导出通过 package exports；禁止深层导入其他包源码。
- 配置输入视为只读。不得原地修改调用者 option、数据数组或共享默认配置。
- 普通无效输入返回 Result/diagnostics；异常用于不可预期的系统或编程故障。入口捕获并转换为稳定诊断，不泄露堆栈或敏感值。

## 命名与结构
文件用 kebab-case，类型与类用 PascalCase，变量和函数用 camelCase，错误码用 UPPER_SNAKE_CASE。测试就近放置为 *.test.ts；浏览器测试放在明确的集成目录。
按能力和职责拆分，不以任意行数上限强制拆文件。避免只有一处调用的泛化框架。内部实现可变，公共 API 必须有版本和文档。
标识符、错误码、API 文档源和提交标题默认英文；说明注释解释原因和边界，不复述代码。用户文案由调用方本地化。

## 资源与异步
所有订阅、监听器、计时器和实例都有清理路径。异步外围操作支持 AbortSignal 或等效取消方式；超时与取消不提交过期结果。不得产生未处理 Promise rejection。
失败更新保留上一份有效图表。渲染器失败时报告状态，不能把已更新的数据 revision 当作成功渲染的 revision。

## 数据和图表
禁止隐式将 null 变 0、排序时间字符串冒充时间排序、丢弃无效行或自动更换聚合口径。类型转换必须显式且可诊断。聚合、排序和空值规则见契约规范。
model-facing 路径不得 eval/new Function、运行 shell、下载脚本或调用未注册的扩展。formatter 使用声明式格式或宿主注册 ID。
为支持项编写能力声明；未注册模块不能承诺可用。渲染和编译都受尺寸、数据量、复杂度及时间预算限制。

## 依赖和打包
新依赖说明用途、替代方案、许可、运行环境和包体影响。锁文件提交仓库；禁止在 CI 使用浮动 latest。Node-only、DOM-only 与共享代码通过导出入口隔离。
ECharts、React 等宿主依赖按实际集成使用 peerDependencies；不要无理由重复打包。首版 ESM，CJS 只有明确使用需求时增加并测试。

## 测试与评审
测试验证契约、边界、状态与失败行为，不只镜像实现。新增或修改公共行为必须给出正常、边界和错误用例。视觉变化说明原因，不能批量无审查更新截图。
PR 说明问题、最终行为、对应 Spec/AC、验证证据和剩余限制。禁止把模拟通过写成真实模型或宿主验证通过。
