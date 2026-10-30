---
doc_id: rfc-0004-agent-tools
version: "0.1"
status: experimental-design
updated: 2026-10-30
language: en
---

# Agent tool boundaries

[Other language](0004-agent-tools.zh-CN.md)

Status: experimental implementation under SPEC-0002; no stable published API.

## Decision
A Node-only agent package owns tool definitions, semantic validation, bounded worker rendering, and packaged resources. CLI and MCP adapt that service. Core stays free of Node/model/protocol dependencies. Reusing MCP inside CLI would couple unrelated transports; duplicating validation would drift.

## Tools and resources
Use five canonical tools defined in agent/src/tools.json. Document schemas/capabilities remain in their owning packages. Recipe/diagnostic copies are generated and checked. Narrowed schema variants get distinct IDs. MCP render outputs use bounded ephemeral resources; CLI writes require explicit host flags and exclusive creation.

## Risks and verification
Worker deadline/concurrency bounds prevent indefinite tool jobs but are not a security sandbox. Cache artifacts contain chart data and expire; hosts must handle missing resources. Static SVG is not an interactive MCP app. Official SDK stdio process tests, CLI child processes, cancellation/budget/cache tests and bilingual documentation gate this experimental subset.

## Deferred
Remote transport, authentication, persistent artifacts, protocol UI adapters, provider-specific schemas, prompts and publication require separate specs.
