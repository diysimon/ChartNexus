---
doc_id: agent-integration
version: "0.1"
status: experimental
updated: 2026-10-30
language: en
---

# CLI and MCP integration

[Other language](../zh-CN/agent-integration.md)

## Current status
Local CLI and MCP stdio are implemented with SDK 1.32.2. Official SDK client integration is tested separately from any desktop application or live model. Packages remain private; do not use an npm package name as a published installation command. No user client configuration is changed automatically.

## Build and CLI
Run `pnpm install --frozen-lockfile --ignore-scripts` and `pnpm build` first. Use direct Node commands for clean machine-readable stdout:

```sh
node packages/cli/dist/main.js capabilities
node packages/cli/dist/main.js schema --mode intent
node packages/cli/dist/main.js validate resources/recipes/bar.json
node packages/cli/dist/main.js compile resources/recipes/bar.json
cat resources/recipes/bar.json | node packages/cli/dist/main.js validate -
mkdir -p outputs
node packages/cli/dist/main.js render resources/recipes/bar.json --width 800 --height 480 --output outputs/agent-chart.svg
```

Rendering without `--output` returns SVG inside the JSON result. The output flag creates a new file exclusively and will not overwrite an existing file, including a symlink. Parent directories must exist. CLI file paths are explicit user/host choices; MCP tools never accept them. Commands also have `pnpm cli` convenience entry points, but wrappers may emit runner logs; use Node in automation. Source bin launchers exist before building and report BUILD_REQUIRED until compiled output is available.

Exit codes: 0 success; 1 invalid JSON, schema/semantic/capability/render failure; 2 usage or IO failure. All command results are JSON on stdout. Sanitized operational diagnostics go to stderr. Unknown/repeated options are errors, not ignored. Input is limited to 1 MiB.

## Configure a local MCP client
After building, adapt this configuration to the host's supported format and replace the absolute path. This is an example, not a claim that every client uses this format:

```json
{
  "mcpServers": {
    "chartnexus": {
      "command": "node",
      "args": ["/absolute/path/ChartNexus/packages/mcp/dist/main.js"]
    }
  }
}
```

The host must resolve the correct Node runtime. The executable does not depend on cwd. Do not use `pnpm build && ...` as the transport command: build output would pollute MCP stdout. No HTTP endpoint or model credentials are involved.

## Tools
| Tool | Arguments | Success value |
| --- | --- | --- |
| list_capabilities | none | Chart/profile limits and agent runtime limits |
| get_chart_schema | optional mode: intent/echarts | Canonical schema or narrowed variant with its own ID |
| validate_chart | document | Compact structure-and-semantics validation result |
| compile_chart | document | ECharts RenderPlan |
| render_chart | document; optional width/height | Temporary SVG metadata and resource_link |

All tools reject extra arguments. `validate_chart` runs semantic compilation; the existing core `validateChart` API only checks JSON/shape. Validation does not guarantee that every accepted native option renders successfully: native coverage is deliberately partial. Tool failure returns `isError: true`, structuredContent, and a JSON text fallback. No inferred data repair is performed.

## Resources and lifecycle
Discover static resources through resources/list: capabilities, ChartDocument schema, valid bar recipe, unknown-field repair recipe, bilingual diagnostics. Source recipes and diagnostics are copied into the agent package by `pnpm generate`; `generate:check` detects drift. Resources do not depend on the repository cwd.
`render_chart` returns a session-local `chartnexus://artifacts/...svg` URI. Read it with resources/read; it is not an HTTP URL or disk path. SVG is static and client display support varies. Cache retention is ten minutes, at most eight artifacts and 16 MiB total. Eviction/expiry/another session yields a resource error; rerender when necessary. Metadata includes bytes, SHA-256, and expiry. Resource reads do not extend TTL.

## Limits and trust
Tool arguments: 1 MiB; stdio buffer: 2 MiB; compiled output: 4 MiB; SVG: 8 MiB raw and 8 MiB JSON-escaped resource payload. Renderer runs in a worker with a 5-second deadline, cancellation and two concurrent jobs per service. BUSY fails immediately, without an unbounded queue. Worker limits are not an OS sandbox, remote-service isolation, or a real-time SLA. Direct renderSvg remains synchronous and has no deadline.
The CLI/stdio executable has no preloaded data registry. Use inline data; references return DATA_NOT_FOUND. Programmatic factories can receive a trusted in-memory registry. Tools cannot register data, read files, request URLs, or change output paths. The resource cache contains input-derived chart labels/data; only connect authorized local clients.

## Verified workflow and remaining work
The SDK client test launches an actual server process, negotiates, lists tools/resources, validates an invalid field, repairs it, compiles/renders, and reads the SVG with a matching checksum. Tests also cover deadline/cancellation, limits, cache eviction/expiry, CLI refusal to overwrite, and transport errors. This is not a live-model evaluation or proof of desktop-client rendering. Experimental A2UI/OpenUI profiles exist separately; remote MCP, MCP prompts, and desktop client installation remain unimplemented.

## Model resources and offline evaluation
Read `chartnexus://resources/index/0.1` to discover the bilingual model entry and `chartnexus://evaluation/tasks/0.1` public synthetic development corpus. See [model entry](model-entry.md) and [evaluation baseline](evaluation-baseline.md); reference fixture checks do not establish live-model performance.

[Local model and MCP pilot](local-model-pilot.md) records a real local model calling this server via the official SDK client; it is not desktop-client evidence.

## Optional chat output

MCP `validate_chart`, `compile_chart` and `render_chart` accept `chatPresentation` with optional `theme`, `detailLevel`, and `background` fields. It is host opt-in, applies only to 0.2 intent, and defaults to transparent/light/standard when absent in settings and document. Validation/compilation include adjustment codes; rendering returns an SVG resource, so inspect adjustments through compile first if needed. `presentation.detailLevel` is a document suggestion, not an instruction to change host settings. See [chat presentation](chat-presentation.md).
