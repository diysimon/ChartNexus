---
doc_id: initialization
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# Project initialization plan

[简体中文](../zh-CN/initialization.md)

## Current state and execution boundary
On 2026-10-29 remote main was verified to contain only LICENSE; local `/Users/zuming/code/echartsAI` was empty and not a Git checkout when this task began. This delivery creates documentation, not clone/init operations, installs, implementation, or releases. Commands below are planned interfaces, not currently working scripts.

## I0: Synchronize the repository
Inspect directory, Git state, and remotes. Fetch remote main in a separate temporary checkout and safely merge local documents into it, or initialize this directory and reconcile remote history after inspection. Do not clone over existing documents, overwrite LICENSE, or rewrite history. Verify origin is diysimon/ChartNexus, preserve Apache-2.0 verbatim, and review the diff before committing.

## I1: Pin the toolchain
Verify supported Node LTS, pnpm, TypeScript, ECharts, Ajv, Vitest, Playwright, MCP SDK, and adapter SDK versions at execution time. Record selections and reasons in the initialization spec and compatibility matrix. Commit .node-version or equivalent, packageManager, engines, and pnpm-lock.yaml; align local and CI environments.

## I2: Minimal workspace
Create schema/core/runtime packages, a private root workspace, shared tsconfig, ESLint, and Prettier. Separate Node/DOM targets and expose APIs through package exports. Never publish empty placeholder packages. Build one bar-chart vertical slice before expanding packages.

## I3: Contracts and tests
Specify ChartDocument, diagnostics, data resolver, and capability profile. Create success, failure, and empty-data fixtures for both modes. Test deterministic compilation, input immutability, and unsupported capabilities. A Node import smoke test verifies core has no window/document dependency.

## I4: Runtime and tools
Implement mount, update, resize, and disposal; verify series deletion and recovery. Add Node dependencies only when implementing SVG, CLI, and MCP. MCP stdout carries protocol data only; logs use stderr. Demos default to fixed data; live model calls are explicit optional paths.

## I5: Documentation and pipelines
Implement link, bilingual pairing, schema/fixture, and generated-diff checks. Create PR CI without publishing credentials; add a protected release workflow separately. Repository administrators must configure actual main-branch protections and record enabled required checks.

## Planned command interface
| Command | Expected result |
| --- | --- |
| pnpm install --frozen-lockfile | Reproducible dependency installation; only after a lockfile exists |
| pnpm lint | Static code rules |
| pnpm format:check | Formatting validation |
| pnpm typecheck | Types for all package targets |
| pnpm test | Offline unit and contract tests |
| pnpm test:browser | Browser lifecycle and interaction tests |
| pnpm docs:check | Links, bilingual pairs, and document structure |
| pnpm generate:check | No uncommitted derived-schema changes |
| pnpm build | Libraries and demo builds |
| pnpm pack:check | Tarball installation and public-export smoke tests |
| pnpm check | Required local checks combined |
| pnpm eval:offline | Fixed tasks and trace replay |
| pnpm eval:live | Live evaluation with explicit configuration, credentials, and budget |

## Initialization exit criteria
A fresh checkout installs and passes basic local checks using documented steps. One browser and one SVG example work without model keys. Offline tests make no network requests. Unpublished packages are not labeled available. Maintainers confirm scope ownership and first-release strategy.
