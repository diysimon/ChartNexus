---
doc_id: coding-standards
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# Coding standards and engineering requirements

[简体中文](../zh-CN/coding-standards.md)

## Normative rules
MUST is a merge requirement; SHOULD permits a documented reason; MAY is optional. Fix implementation or revise the standard before accepting a MUST violation; do not silently waive it in a PR. Formatting-only documentation changes need no feature spec.

## TypeScript and APIs
- Enable strict, noUncheckedIndexedAccess, and exactOptionalPropertyTypes. Do not disable rules globally to fix local errors.
- Treat external values as unknown and narrow after boundary validation. No implicit any in public APIs or double assertions to bypass contracts.
- Public configuration is serializable JSON: no functions, Date, Map, NaN, Infinity, or undefined on the wire.
- Declare public inputs, outputs, and error types. Export via package exports; never deep-import another package's source.
- Treat configuration as readonly. Do not mutate caller options, data arrays, or shared defaults.
- Expected invalid input returns Result/diagnostics. Reserve exceptions for unexpected system/programming failures. Entry points convert them to stable diagnostics without exposing stacks or sensitive values.

## Naming and structure
Use kebab-case files, PascalCase types/classes, camelCase variables/functions, and UPPER_SNAKE_CASE error codes. Co-locate *.test.ts unit tests; put browser tests in explicit integration directories.
Split by capability and responsibility rather than arbitrary line limits. Avoid general frameworks for one call site. Public APIs require documentation and versioning; internals may evolve.
Use English for identifiers, error codes, source API documentation, and commit titles. Comments explain reasons and boundaries rather than repeat code. Hosts localize user-facing messages.

## Resources and async work
Every subscription, listener, timer, and instance needs cleanup. Outer asynchronous operations support AbortSignal or equivalent cancellation. Timeout/cancellation must not commit stale results. No unhandled promise rejections.
Failed updates preserve the last valid chart. Rendering failure must not mark an updated data revision as successfully rendered.

## Data and charts
Do not implicitly convert null to zero, sort time strings as chronological values, discard invalid rows, or change aggregation meaning. Conversion must be explicit and diagnosable. Contract rules define aggregation, ordering, and null handling.
Model-facing paths must not eval/new Function, execute shell commands, download scripts, or invoke unregistered extensions. Formatters use declarative formats or host-registered IDs.
Declare capabilities for supported features; unavailable modules are not supported capabilities. Compilation and rendering must enforce dimension, data-volume, complexity, and time budgets.

## Dependencies and packaging
For new dependencies, explain purpose, alternatives, license, runtime, and bundle impact. Commit lockfiles; do not use floating latest in CI. Separate Node-only, DOM-only, and shared exports.
Use peerDependencies for host libraries such as ECharts and React where appropriate; avoid duplicate bundles. Start with ESM; add CJS only for a demonstrated need and test it.

## Tests and review
Test contracts, boundaries, state, and failures rather than merely mirroring implementation. Public behavior changes need normal, boundary, and error cases. Explain visual changes; do not mass-accept snapshots without review.
PRs describe the problem, final behavior, linked spec/ACs, evidence, and remaining limits. Passing simulations is not evidence of live-model or live-host validation.
