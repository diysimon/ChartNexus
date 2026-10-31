---
doc_id: ollama-playground
version: "0.1"
status: experimental
updated: 2026-10-31
language: en
---

# Local Ollama chart playground

[简体中文](../zh-CN/ollama-playground.md)

With a local Ollama service already running and a model installed, run from the repository root:

```sh
pnpm dev:ollama
```

Open `http://127.0.0.1:5180/ollama.html`. Choose a model from the detected list, describe a chart **and its data**, then select Generate. Check “基于上一张有效图表修改” when requesting a change to the prior valid document. Expand the two panels to inspect or edit the ChartDocument and view the original model response. Invalid output or cancellation keeps the prior chart. If Ollama is unavailable, start it according to your installation and refresh the model list.

The development server binds to `127.0.0.1:5180`; its narrow same-origin middleware contacts the fixed Ollama address `127.0.0.1:11434`. It does not accept a model-provided endpoint or execute model code. Requests go to the local Ollama service; if that service is configured to use a cloud model, data handling depends on that configuration. No MCP or GenUI protocol is involved in this page. The page sends the actual user request and, only if selected, the previous chart document to Ollama. Responses are not persisted by ChartNexus.

The server limits requests to 1 MiB, prompts to 12,000 characters, responses to 2 MiB and generation to 120 seconds. It requests JSON; a complete Markdown JSON fence is also accepted. Model output still goes through the existing ChartDocument validation and its capability/size limits before rendering; unsupported or missing data is diagnosed, not filled in by the application. Validation does not establish that model-generated numbers match the request; inspect the chart and document. This is a local development tool, not a public-facing service, and model accuracy is not guaranteed. Production static build does not include the local middleware.

Local evidence on 2026-10-31: Chromium 149 and local `qwen3.5:9b` generated a bar chart for three supplied values 120/180/150 and then changed it to a line chart while retaining them. Browser tests separately simulate unavailable service, cancellation, invalid JSON and native option validation. Other models and Ollama configurations may behave differently. See [SPEC-0009](../../specs/0009-ollama-playground/spec.md).

When the model returns an empty object, the page explains that it has not supplied usable chart data and that the current page does not look it up online. The exact reason for an empty model response cannot be inferred.
