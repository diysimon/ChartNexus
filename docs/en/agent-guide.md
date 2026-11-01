---
doc_id: agent-guide
version: "0.1"
status: experimental
updated: 2026-11-01
language: en
---

# Agent integration and retrieval guide

[简体中文](../zh-CN/agent-guide.md)

The application decides whether to request a chart and supplies authorized data; ChartNexus does not discover facts or force tool calls. Give an agent the host's actual enabled profile, trusted data/field names and appropriate schema. Ask it for one complete JSON document. Never treat the synthetic examples below as answers to the user's business question.

Repository-aware tools can start from the plain-text [llms.txt](../../llms.txt) or [Chinese index](../../llms.zh-CN.txt); website hosting and automatic discovery are not implied. Both are included in the retrieval corpus.

## Discovery order

1. Inspect host policy: allowed versions/types, whether chat presentation or ordered operations are enabled, authorized table/map references, and size limits.
2. Read `chartnexus://capabilities/basic-0.3`, then call `get_chart_schema` with `{ "schemaVersion": "0.3", "chartType": "bar" }` (choose the requested supported type). Tool default is 0.1; a projected schema describes one branch, not host permissions.
3. Read `chartnexus://recipes/manifest/0.1` and the matching recipe URI. All eleven chart types have 0.3 recipes; older 0.2 recipes must retain their version unless explicitly migrated. Map requires a host-registered asset; references require authorized host registry and exact revisions.
4. Submit the complete document to `validate_chart`. Inspect actual `code` and JSON Pointer `path` on failure; retry only when host policy permits, without inventing business data. `compile_chart` provides a plan; `render_chart` produces a session-local SVG resource, not an interactive browser component.

## 0.3 recipe lookup

The recipe suffixes below are appended to `chartnexus://recipes/`: bar → `chat-bar/0.3`; line → `line/0.3`; pie → `pie/0.3`; scatter → `scatter/0.3`; combo → `combo/0.3`; funnel → `funnel/0.3`; heatmap → `heatmap/0.3`; radar → `radar/0.3`; tree → `tree/0.3`; sankey → `sankey/0.3`; map → `map/0.3`. The map recipe needs the host's `two-regions@1` synthetic asset; it cannot register that asset itself. Check the manifest and capabilities for constraints before reusing a recipe.

## Copyable prompt template

```text
The host has requested a chart. Output one complete ChartDocument JSON object.
Use only the supplied allowed schema/version, fields, values and authorized references.
Do not invent data or include executable functions, callbacks or URLs in the document. Apply aggregation or sorting only when explicitly requested.
Preserve nulls, units and source identity. Return a structured inability to comply through the host's own response format if necessary.
Host profile: <host-provided profile>; Schema: <schema or schema reference>;
Allowed data: <host-provided fields and rows or trusted reference>; User request: <request>.
```

The host chooses its own response envelope and handles refusal/no-chart states; those are not ChartDocument fields. For OpenUI/A2UI/COSUI, follow the relevant [GenUI guide](genui-integrations.md) and use the expected JSON string/operation envelope. For streaming, buffer fragments; pass only complete documents. The optional ordered profile needs a host-supplied operation ID and actual base revision. Do not invent them.

## Retrieval and training use

`chartnexus://resources/index/0.1` lists sources, versions, language, license and source-byte hashes. `chartnexus://resources/retrieval/0.1` provides newline-delimited records with `body`; filter by `language` and `capabilityIds`, then apply host profile policy and retrieve the relevant schema, catalog and example. `schemaVersion` gives the resource’s main version context; an entry can list additional compatible capability IDs. Index entries with `uri: null` are available in the retrieval corpus, not as independent MCP resources. Repository consumers can read [JSONL](../../resources/model-retrieval.jsonl) directly. Source examples are synthetic and Apache-2.0; preserve provenance/license and avoid training or indexing private data or held-out evaluation outputs. Reusing material does not mean a model has been trained or that an MCP client has selected it.

The separate [synthetic example pairs](../../resources/model-examples.jsonl) are also available from `chartnexus://resources/examples/0.1`: 11 chart types × two languages. Each record includes an explicit input data/chart specification, a complete output document, source recipe hash, license and any host prerequisite. They demonstrate serialization and faithful handling of supplied input; they do not teach or evaluate independent chart selection or factual retrieval. The corpus-level index language is `mul`; include it in language filters and then select individual `en` or `zh-CN` records. These 22 pairs are a small starting set, not evidence of training effectiveness or broad coverage. Review provenance and suitability before using them for training or few-shot prompts.

From the repository root, inspect the Chinese 0.3 guide records without an MCP client:

```js
import { readFileSync } from 'node:fs';
const records = readFileSync('resources/model-retrieval.jsonl', 'utf8')
  .trim().split('\n').map((line) => JSON.parse(line));
const guides = records.filter((item) => item.language === 'zh-CN'
  && item.capabilityIds.includes('basic-0.3')
  && ['agent-guide', 'chart-catalog'].includes(item.id));
console.log(guides.map(({ id, source, contentHash }) => ({ id, source, contentHash })));
```

Save this as an `.mjs` file and run it with Node from the repository root. A retrieval system should index `body`, retain the accompanying metadata and select only resources permitted by the host profile.

See [model entry](model-entry.md), [chart catalog](chart-catalog.md), [responsibility boundary](product-boundary.md), and [CLI/MCP guide](agent-integration.md).
