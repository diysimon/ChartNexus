---
doc_id: contributing
version: "0.1"
status: implementation-baseline
updated: 2026-10-30
language: en
---

# Contributing

> 2026-10-30: Experimental core implementation has started; see [development guide](docs/en/development.md) for commands and limits. No publication, MCP, or UI protocol integration yet.

[简体中文](CONTRIBUTING.zh-CN.md)

Start with [README](README.md) and [AGENTS](AGENTS.md). The project is at the experimental core stage.

1. Define scope and acceptance through the [spec workflow](docs/en/spec-workflow.md) for features/behavioral fixes; use lightweight records for simple docs.
2. Follow [coding standards](docs/en/coding-standards.md) and keep changes focused.
3. Update both languages and related schemas, capabilities, examples, and tool resources.
4. Provide reproducible evidence under [testing requirements](docs/en/testing-evaluation.md).
5. Use the [PR template](templates/en/pull-request.md); add changesets for package behavior changes.
6. Record third-party provenance/licensing; never commit secrets, private data, or large generated artifacts.

Implemented install/test commands are in the [development guide](docs/en/development.md). Names in current documents are not published packages. Follow repository Apache-2.0 and each third-party license.
