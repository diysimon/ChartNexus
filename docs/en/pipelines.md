---
doc_id: pipelines
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# CI/CD pipelines and gates

[简体中文](../zh-CN/pipelines.md)

## Status
This specifies future workflows. No GitHub Actions YAML, branch protection, or publishing job is created in this task. Update implementation status with actual run evidence; file existence alone does not establish an enabled workflow.

## PR pipeline
| Job | Checks | Trigger and dependencies |
| --- | --- | --- |
| docs | Local links, pairs, version metadata, template completeness | Every PR |
| quality | Format, lint, typecheck | Code/configuration changes |
| contracts | Schema validity, fixtures, generated synchronization | Contract/core/resource/generator changes |
| unit | Compilation, data semantics, operations, failures | Relevant code changes |
| browser | DOM lifecycle, interactions, adapters, visual baselines | Runtime/adapter/dependency changes |
| package | Build, pack, clean installation, exports | Publishable packages/build configuration |
| offline-eval | Fixed tasks and recorded trace replay | Model resources/core/adapters |
| required | Aggregate required job outcomes | always; required failure or unexpected skip fails |

Documentation-only PRs may skip unrelated code jobs, but required must verify the reason. Avoid workflow-level paths filters that leave required checks pending forever. Public contract changes expand verification beyond directly changed packages.
New PR commits may cancel older verification runs. Do not use this interruption policy for publishing.

## Execution environment
Pin Node/pnpm, lockfile, browser, and fonts. Cache keys include platform, runtime, and lockfile hash; correctness cannot depend on caches. Default to contents:read and pin third-party Actions to commit SHAs. External PRs get no publishing/model credentials; never execute PR code in privileged pull_request_target workflows.
Set job timeouts and artifact retention in the initialization spec. Upload necessary failure screenshots, traces, and diagnostics without real business data, secrets, or unlicensed model traces.

## Main and periodic checks
Rerun affected gates on main and establish traceable baselines. Dependency updates use PRs and the same gates. Periodic upstream SDK checks report compatibility without automatically expanding peer ranges or accepting visual baselines.
Live-model evaluation uses a separate controlled workflow, manually triggered or explicitly scheduled, with models, tasks, maximum calls, spending limits, and data scope. External PR checks must not require these credentials.

## Release pipeline
1. Maintainers review changesets, breaking changes, compatibility, bilingual notes, and licensing.
2. Generate a version PR; run all applicable checks and merge.
3. Lock the release job to the intended commit and lockfile; rebuild and pack.
4. Test actual tarballs through clean installation, exports, and license checks.
5. Publish through a protected environment, preferably trusted publishing/OIDC with minimal long-lived tokens.
6. Use alpha/beta prerelease dist-tags without replacing latest.
7. Record npm versions, source commit, checksums, and build provenance; then update docs and GitHub release.

Use exclusive publishing concurrency. Do not blindly retry an entire failed release. Inspect per-package publication state, never overwrite published versions, and resume remaining packages in dependency order. Never publish from forks.

## Rollback and recovery
Treat npm artifacts as immutable. Prefer a fix release; if necessary deprecate a broken version and point dist-tags to a verified version. Do not default to unpublish. Restore matching documentation while retaining incident and migration notes. Adapter rollback must not silently reinterpret persisted documents.
Git revert, npm dist-tag changes, and user-state migration are separate operations with distinct authorization, evidence, and results.

## Workflow acceptance
Verify a normal PR, documentation PR, deliberately failing required job, absence of secret access for external PRs, cancellation of older PR runs, and alpha dry-run/pack checks. Without real npm publication, report only a successful release rehearsal.
