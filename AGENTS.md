---
doc_id: agents
version: "0.1"
status: implementation-baseline
updated: 2026-10-30
language: en
---

# Agent execution guidance

> 2026-10-30: Experimental core implementation has started; see [development guide](docs/en/development.md) for commands and limits. Local CLI/MCP stdio and experimental OpenUI, COSUI and A2UI chart profiles are implemented; no publication.

[简体中文](AGENTS.zh-CN.md)

## Scope
Applies across the repository. Every agent reads this file and task-relevant standards first. Inspect actual package scripts and the development guide; do not assume planned features or releases exist.

## Starting work
1. Inspect cwd, Git state, and user changes; never overwrite existing work.
2. Read [spec workflow](docs/en/spec-workflow.md), [architecture](docs/en/architecture.md), and [coding standards](docs/en/coding-standards.md). For setup also read [initialization](docs/en/initialization.md).
3. Establish goals, non-goals, ACs, dependencies, and evidence using the [spec template](templates/en/feature-spec.md).
4. Do not create additional chats or delegate to agents unless the user or applicable module instructions explicitly requests it.

## Implementation rules
Respect dependency direction; core has no DOM, network, or model SDK. Preserve both native option and intent inputs; never execute model input as code. Synchronize schemas, capabilities, examples, tools, and bilingual docs.
Keep scope focused. Proceed with routine reversible work without repeatedly requesting existing authorization. Roadmaps alone do not authorize external releases, messages, or data uploads.

## Commands and verification
Implemented commands are documented in [development](docs/en/development.md); inspect actual scripts before executing them. Select relevant tests and mark unexecuted checks not-run. Review generated artifacts and diffs. Offline simulation is not real host/model verification.
Document edits update paired languages and docs/manifest.json. Pure prose changes do not require business-logic tests.

## Delivery
Explain what changed, why, verification, and unverified items. Use actual paths and evidence. Never claim commits, pushes, releases, upstream endorsement, or protocol support that did not occur.

[CLI and MCP integration guide](docs/en/agent-integration.md)
