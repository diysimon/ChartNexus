---
doc_id: readme
version: "0.3"
status: experimental
updated: 2026-11-02
language: en
---

# GenUI for Apache ECharts

[简体中文](README.zh-CN.md)

GenUI for Apache ECharts (formerly ChartNexus) is experimental infrastructure for language models and agents: versioned JSON chart contracts, validation, browser/SVG rendering, GenUI adapters, CLI/MCP tools and resources for RAG or training workflows. It is an independent project; compatibility does not imply upstream endorsement.

The existing `@chartnexus/*` workspace package names, CLI commands and `chartnexus://` MCP resource identifiers remain unchanged for compatibility. They do not indicate npm publication or ownership of an npm scope.

The 0.3 intent profile includes bar, line, pie, scatter, combo, funnel, heatmap, radar, tree, Sankey and host-registered maps. Light/dark themes, transparent chat backgrounds and five detail levels are available. The retained guarded native0.1 profile supports a restricted ECharts option subset. OpenUI Lang, A2UI v0.9, COSUI JSON and COSUI Marklang have pinned real-host tests; support is profile/version-specific.

All eleven packages remain private and unpublished. Model quality, installed packages and UI hosts have separate evidence; see the [support matrix](docs/en/support-matrix.md), [contracts/migration](docs/en/contracts-03.md), and [evaluation/distribution guide](docs/en/trial-distribution.md). Model-independent architecture does not establish every-model success.

## Start here

- [Quick start: run and embed](docs/en/getting-started.md)
- [Chart, theme and example catalog](docs/en/chart-catalog.md)
- [Model, agent, MCP and retrieval guide](docs/en/agent-guide.md)
- [Product responsibility boundary](docs/en/product-boundary.md)
- [AI text index](llms.txt)

## Local preview

Use Node22.22.3 or the tested Node24 runtime and pnpm11.25.0:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm dev
# For the localhost Ollama playground:
pnpm dev:ollama
```

The default preview is `http://127.0.0.1:5173/`; host demos include `/openui.html`, `/a2ui.html`, `/cosui.html` and `/marklang.html`. The Ollama page is `http://127.0.0.1:5180/ollama.html` and requires a running local Ollama service with an installed model. See the [development guide](docs/en/development.md) for browser/package checks and limits.

Repository: [diysimon/genui-for-echarts](https://github.com/diysimon/genui-for-echarts). License: [Apache-2.0](LICENSE).

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
