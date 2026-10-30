---
doc_id: security-reliability
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# Security and reliability requirements

[简体中文](../zh-CN/security-reliability.md)

## Trust boundaries
Model output, upstream payloads, fields, labels, and example text are untrusted data. Valid JSON is not necessarily safe or semantically correct. Host-registered code is a separate trust boundary and cannot be registered by models themselves.
Core has no network, filesystem, or execution privileges. Hosts configure render/CLI/MCP permissions; models cannot choose arbitrary output paths, read paths, or remote targets.

## Required controls
- Validate structure, depth, object keys, array lengths, and string sizes after parsing. Reject dangerous prototype-key paths and prevent prototype pollution during merges.
- Disable eval/new Function, script formatters, and arbitrary event code on model-facing paths. HTML tooltips/labels require safe text or audited escaping.
- External images, symbol URLs, map/extension resources are disabled by default or explicitly host-registered and permitted. Check static SVG for links, executable content, and external references; it is not inherently safe HTML.
- Enforce explicit budgets for input bytes, rows, series, dimensions, time, and artifact size. P0 benchmarks determine values; releases cannot leave them unlimited.
- Errors, logs, and telemetry exclude rows, full prompts, and credentials by default. Telemetry is off by default; enabling it declares fields and purpose.
- Test server-render concurrency, cancellation, and timeouts to prevent one chart exhausting process resources.

## Failure handling
Stable diagnostics distinguish invalid input, unsupported capabilities, host data failures, and rendering faults. Preserve the last valid state and clean failed resources. Bound retries by attempts/time; side effects use idempotency rules.
Remote MCP, multitenancy, and hosted services are outside the first release. Add authentication, authorization, quotas, session isolation, and a deployment spec before introducing them; never expose a local stdio service directly.

## Supply chain and reporting
Review dependency licensing, provenance, and install scripts. Use least-privilege publishing, pinned Action SHAs, and traceable builds.
Maintainers must confirm and enable a private vulnerability channel. Until then do not claim availability or promise a response SLA. Do not post secrets or exploit details in public issues; use a privately published maintainer contact channel. Configure it before launch and update root SECURITY guidance.
