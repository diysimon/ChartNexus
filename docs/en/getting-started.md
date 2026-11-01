---
doc_id: getting-started
version: "0.1"
status: experimental
updated: 2026-11-01
language: en
---

# Quick start: embed a chart in a chatbot

[简体中文](../zh-CN/getting-started.md)

This tutorial runs a real browser component from this repository without model credentials, Ollama or MCP. Version 0.3 is experimental; packages are private workspaces and are not available from public npm.

## 1. Prepare and run

Install Node 22.22.3 (or tested 24.22.1), pnpm 11.25.0 and Git. In a terminal:

```sh
git clone https://github.com/diysimon/ChartNexus.git
cd ChartNexus
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Open `http://127.0.0.1:5173/quickstart.html`. You should see a bar chart with Jan, Feb and Mar, a complete JSON document, and `VALID · revision 1`. If port 5173 is busy, use the address Vite prints. Stop the server with `Ctrl+C`.

## 2. Change data and observe recovery

In `data.rows`, change Jan's `revenue` to `200` and click Update; the revision increases. Replace the JSON temporarily with `{` and click again: `INVALID_JSON` appears and the last chart remains visible. You can also set `chart.encoding.y.field` to `missing` in a complete document: this reports `UNKNOWN_FIELD` while keeping the old chart. Restore a complete document and update again. Keep the same `id` while updating one chart.

## 3. Copy into your host

Use the [page](../../examples/playground/quickstart.html), [component code](../../examples/playground/quickstart.ts), and [example ChartDocument](../../resources/recipes/chat-bar-03.json). Your browser bundler must resolve `@chartnexus/runtime` and its matching `echarts@6.1.0` peer. A host in this repository can use workspace dependencies; an external project needs trusted private packages or an internal registry supplied by a maintainer. Do not assume a public npm install exists. To rehearse actual installed artifacts on this machine, run `pnpm test:packages` from the repository root. It packs all eleven packages, installs them into an isolated temporary consumer, and prints `Retained isolated consumer: <path>`. This does not publish packages. The consumer uses absolute local tarball paths and is not a portable distribution. To start its copied example, substitute the printed path below:

```sh
cd /path/printed/for/chartnexus-consumer
pnpm exec vite examples/playground --host 127.0.0.1 --port 5174 --strictPort
```

Open `http://127.0.0.1:5174/quickstart.html`, then use `Ctrl+C` to stop it. For the automated installed-browser suite, first install Playwright Chromium with `pnpm exec playwright install chromium` in the repository and run `pnpm test:packages --browser` there.

For example, in a Vite project that can already resolve these dependencies, save the recipe as `chart-document.json`, add a container to the page, and run this code from the entry module:

```html
<div id="chart" style="width: 100%; height: 320px"></div>
```

```js
import { mountChart } from '@chartnexus/runtime';
import chartDocument from './chart-document.json';

const container = document.querySelector('#chart');
if (!container) throw new Error('Chart container is missing');
const mounted = mountChart(container, undefined, {
  chatPresentation: { theme: 'light', background: 'transparent', detailLevel: 'standard' },
});
if (!mounted.ok) throw new Error(JSON.stringify(mounted.diagnostics));
const chart = mounted.value;
const result = chart.update(chartDocument);
if (!result.ok) console.error(result.diagnostics);
// In your host's component-unmount cleanup: chart.dispose();
```

Give the container nonzero width and height; call `mountChart(container, onSelect, { chatPresentation: settings })`; check `mounted.ok`; call `chart.update(document)` only with a complete ChartDocument and inspect the result; call `chart.dispose()` when the component unmounts. The example uses `pagehide` for cleanup; framework hosts should clean up on component unmount. Wait until a hidden container is measurable or use the [waiting mount coordinator](chat-host-quality.md).

## 4. Connect a model or GenUI host

The application decides when to request a chart and supplies authorized data; the model returns complete JSON. The host buffers stream fragments before committing. For invalid output show diagnostics or a text/table fallback; do not invent facts. Concurrent updates require the optional ordered controller and real host revision; the simple example's `update` alone does not prevent stale responses. Maps and data references additionally require host-registered trusted assets and exact revisions.

Choose the [OpenUI, A2UI or COSUI integration guide](genui-integrations.md), and see the [agent guide](agent-guide.md), [catalog](chart-catalog.md) and [responsibility boundary](product-boundary.md). These are tested pinned profiles, not all hosts/browsers/models. Before production, check your actual container, theme, network/CSP, error recovery, target devices, data authorization and operational monitoring.
