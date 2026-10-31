---
doc_id: readme
version: "0.1"
status: implementation-baseline
updated: 2026-10-30
language: en
---

# ChartNexus project documentation

> 2026-10-30: Experimental core implementation has started; see [development guide](docs/en/development.md) for commands and limits. Local CLI/MCP stdio is implemented; no publication or UI protocol integration yet.

[简体中文](README.zh-CN.md)

ChartNexus is Apache ECharts infrastructure for language models and agents, with planned UI protocol adapters, MCP tools, and resources for RAG/training.

**Experimental local core packages now exist; CLI/MCP stdio is available locally; protocol adapters and published packages do not yet exist.** Local documents are not automatically committed or pushed. Planned commands are not implemented scripts.

Repository: [diysimon/ChartNexus](https://github.com/diysimon/ChartNexus). The remote repository uses Apache-2.0; retain its LICENSE when synchronizing these documents.

## Reading order
Read the charter and architecture, then initialization, spec execution, coding standards, and pipelines. Read [agent guidance](AGENTS.md) before implementation.

## Standards index
- [Project charter and scope](docs/en/project-charter.md)
- [Technical architecture and design](docs/en/architecture.md)
- [Coding standards and engineering requirements](docs/en/coding-standards.md)
- [Contracts, data, and compatibility specification](docs/en/contracts.md)
- [Spec-driven execution workflow](docs/en/spec-workflow.md)
- [Project initialization plan](docs/en/initialization.md)
- [CI/CD pipelines and gates](docs/en/pipelines.md)
- [Testing, evaluation, and acceptance](docs/en/testing-evaluation.md)
- [Model, agent, RAG, and training resources](docs/en/model-resources.md)
- [Bilingual documentation and governance](docs/en/documentation-governance.md)
- [Security and reliability requirements](docs/en/security-reliability.md)
- [Implementation roadmap and dependencies](docs/en/roadmap.md)
- [Sources, decisions, and open questions](docs/en/sources-decisions.md)

## Copyable templates
- [Feature spec template](templates/en/feature-spec.md)
- [Tasks and execution evidence template](templates/en/tasks.md)
- [RFC template](templates/en/rfc.md)
- [Pull request template](templates/en/pull-request.md)
- [Release checklist template](templates/en/release-checklist.md)

## Contribution and security

[Contributing](CONTRIBUTING.md) · [Security reporting status](SECURITY.md) · [Document manifest](docs/manifest.json)

[CLI and MCP integration guide](docs/en/agent-integration.md)

[Model and agent entry](docs/en/model-entry.md) · [Offline evaluation baseline](docs/en/evaluation-baseline.md)

[Try the local Ollama chart playground](docs/en/ollama-playground.md)
