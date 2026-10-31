---
doc_id: local-model-pilot
version: "0.1"
status: experimental
updated: 2026-10-31
language: en
---

# Local model and MCP pilot

[简体中文](../zh-CN/local-model-pilot.md)

## Run locally

With an already installed model and running local Ollama server, run from the repository root:

```sh
pnpm eval:ollama --model qwen3.5:9b --tasks create-bar,repair-field,reject-unknown-field,data-null-zero --output my-pilot.json
```

Only the fixed `http://127.0.0.1:11434` endpoint is used. The command starts the actual ChartNexus MCP stdio server through the official SDK client, discovers `list_capabilities` and `validate_chart`, and exposes only these two tools to the model. It sends the selected public task, relevant source data or preceding/input document, canonical schema and capabilities. Expected assertions and reference chart answers are not included. There is no autonomous model-suggested shell execution or remote model endpoint.

The runner accepts 1–20 distinct task IDs and a new basename ending in `.json`; results are written exclusively beneath ignored `outputs/` and an existing file is not overwritten. The record contains selected tasks, model digest when available, Ollama and Node versions, seed, temperature, generation and tool limits, corpus/schema/tool hashes, latency, token counts when returned, tool-call names and diagnostic codes, raw final output, format-repair marker, and task scores. Treat local result files as potentially containing all input and generated data. Exit 0 means all selected tasks met the automated checks, 1 means at least one did not, and 2 means setup/usage failure. A task error is retained as a missing candidate in the score rather than omitted.

For a model-generated valid chart, the host also invokes MCP `render_chart`, reads the returned SVG resource and verifies its SHA-256. This render call is host-initiated, not a model tool call. The parser first accepts a complete JSON object; it also permits a single complete Markdown JSON fence as a separately reported **format repair**, without extracting JSON from surrounding prose. This is not a model retry or semantic repair. Each task has one model attempt, up to three tool rounds and four calls per round, up to 2048 generated tokens per response, and a 120-second request timeout. Task assembly and rendering beyond this pilot remain host responsibilities.

## Local evidence: 2026-10-31

All tasks use the public synthetic development corpus, one attempt per task, temperature 0 and seed 42. Records are local ignored files, not committed model datasets. These tiny samples are engineering smoke tests, not rankings or independent held-out results.

| Model and runtime | Task outcomes | MCP evidence |
| --- | --- | --- |
| Ollama `qwen3.5:9b`, digest `6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7` | 4/4 checks passed after format handling across create-bar, repair-field, reject-unknown-field and data-null-zero. Three responses were strict JSON; one needed a complete Markdown fence removed. | The model called `validate_chart` in 2/4 tasks. One succeeded; one intentionally returned the expected unknown-field error. The other two did not call a tool. The host rendered and verified all three valid chart candidates. |
| Ollama `mistral:latest`, digest `6577803aa9a036369e481d648a2baebb381ebc6e897f2bb9a766a2aa7bfbc1cf` | 0/2 checks passed for create-bar and reject-unknown-field because final responses were not valid candidate JSON objects. | The model called `list_capabilities` in one task; it made no model-initiated `validate_chart` call in these two samples. This run preceded the host SVG verification step and produced no valid candidate to render. |

Ollama 0.40.6, Node v22.22.3, MCP server `chartnexus` 0.0.1-alpha.0. Corpus SHA-256: `955f0e7ce9e4765a567bab75607ae51ea2d8cffef8e94a04504467d3bcfc78bb`; schema SHA-256: `5f96b812df6f4a350f6267f2fb7680e480a123de95bbe40830345e439637b832`. Qwen record: `outputs/ollama-pilot-render-20261031.json`; Mistral record: `outputs/ollama-mistral-pilot-20261031.json`. Output paths are machine-local and intentionally ignored by Git.

The Qwen pilot initially exposed an ambiguous development task: it asked to plot null/zero but did not specify a chart type even though the checker required a line chart. The task was corrected before the recorded four-task run. Full 20-task runs, repeated trials, independent held-out tasks, visual judgment, remote models, desktop MCP clients, multi-turn conversation replay and model comparisons remain not-run. Actual model calls are distinct from the simulated runner tests.

The historical pilot files record MCP call success/error but do not include the newer per-call diagnostic-code field; those codes are retained by the current runner when provided by MCP.

## Chat profile pilot (2026-10-31)

A local `qwen3.5:9b` model (digest `6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7`) was tested on synthetic 0.2 requests via local Ollama `/api/chat`, temperature 0, `think: false`, JSON output and at most 1800 generated tokens per request. The host separately compiled the result, applied the dark transparent chat profile and rendered SVG; this pilot did not test model tool calls. Full prompts, candidates and locally held task scripts are in ignored `.local/` and `outputs/`; no task answer assertions were included in model messages.

- Initial three tasks: 1/3 passed structure, rendering and the checked chart type, detail level, numeric values and ordering. Two failed schema or unsupported-capability checks; a single generic diagnostic repair attempt passed 0/2.
- Six additional synthetic prompts not present in project retrieval resources: 2/6 passed all checked invariants, including a scatter creation and a bar-to-line edit. Four failed on theme version being numeric rather than the required string; one diagnostic repair attempt per failing case passed 0/4.
- For those same four failures, a more explicit general prompt without examples gave 1/4 structurally valid but 0/4 semantically correct. A targeted repeat using different public bar/funnel examples in the prompt gave 4/4 on the checked invariants. The follow-up changed the schema description/type and prompt and reused known failed tasks; it is exploratory, not a clean comparison or new test set. The four tasks included only bar, line, pie and funnel, and the checked invariants do not establish overall visual or analytic correctness.

The initial schema hash was `1286ad36a507c0b0dade0bb9846b1e59ff1dd5daa0c84a67e41937e3089ae671`; the later guided/example runs used `cb76472f33cffaa02327b644ffbf7d5bbff76f6c30fa3f228abf526a0d1be903`. Tasks share familiar templates with public examples; model pretraining and family-level isolation are unknown. These tiny single-run samples are not a model ranking, a statistically representative estimate, or a complete independent held-out benchmark. Tool-using agents, real streamed model output and other models are not covered by this chat-profile pilot.
