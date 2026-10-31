import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  compileChart,
  compileChatChart,
  validateChart,
} from '@chartnexus/core';
import * as echarts from 'echarts';

// Review observations, not a pass/fail benchmark. Only project-authored synthetic data.
const root = new URL('../../', import.meta.url);
const doc = {
  schemaVersion: '0.2',
  id: 'review',
  mode: 'intent',
  data: {
    kind: 'inline',
    fields: ['category', 'value'],
    rows: [
      { category: 'A', value: 0 },
      { category: 'B', value: 0 },
    ],
  },
  chart: {
    type: 'pie',
    encoding: {
      x: { field: 'category', type: 'ordinal' },
      y: { field: 'value', type: 'quantitative' },
    },
  },
};
const zero = compileChatChart(doc);
if (!zero.ok) throw new Error('Probe setup failed: zero-sum pie');
const chart = echarts.init(null, undefined, {
  renderer: 'svg',
  ssr: true,
  width: 400,
  height: 320,
});
let zeroObservation;
try {
  chart.setOption(zero.value.plan.option);
  const svg = chart.renderToSVGString();
  const arcPaths = (svg.match(/<path[^>]+>/g) ?? []).filter(
    (path) =>
      path.includes('ecmeta_ssr_type="chart"') && /d="[^"]*A/.test(path),
  );
  zeroObservation = {
    inputValues: [0, 0],
    accepted: true,
    stillShowZeroSum: chart.getOption().series[0].stillShowZeroSum,
    nonzeroArcPaths: arcPaths.length,
    seriesPaths: arcPaths.map((path) => path.match(/d="([^"]+)"/)?.[1]),
  };
} finally {
  chart.dispose();
}
const invalidHeatmap = { ...doc, chart: { ...doc.chart, type: 'heatmap' } };
const heatmapCompiled = compileChart(invalidHeatmap);
const grouped = {
  ...doc,
  data: {
    kind: 'inline',
    fields: ['category', 'value', 'group'],
    rows: [
      { category: 'A', value: 1, group: '' },
      { category: 'A', value: 2, group: 'value' },
    ],
  },
  chart: {
    ...doc.chart,
    type: 'bar',
    encoding: { ...doc.chart.encoding, series: { field: 'group' } },
  },
};
const groupedResult = compileChart(grouped);
if (!groupedResult.ok) throw new Error('Probe setup failed: grouped bar');
const names = groupedResult.value.option.series.map((series) => series.name);
const manifest = JSON.parse(
  await readFile(new URL('resources/recipes/manifest.json', root), 'utf8'),
);
const missingRecipes = [
  'chat-bar.json',
  'combo.json',
  'funnel.json',
  'heatmap.json',
].filter((path) => !manifest.examples.some((example) => example.path === path));
const adapters = {};
for (const name of ['a2ui', 'openui']) {
  const source = await readFile(
    new URL(`packages/adapter-${name}/src/index.ts`, root),
    'utf8',
  );
  adapters[name] = {
    suggests01: source.includes('Use schemaVersion 0.1'),
    hasChatProfile: source.includes('chatPresentation'),
  };
}
console.log(
  JSON.stringify(
    {
      purpose:
        'Reproducible baseline observations; not a comprehensive audit or model benchmark',
      baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
      }).trim(),
      node: process.version,
      echarts: echarts.version,
      observations: {
        zeroSumPie: zeroObservation,
        groupedLegendCollision: {
          names,
          uniqueNames: new Set(names).size,
          seriesCount: names.length,
        },
        missingHeatmapConfig: {
          structurallyValid: validateChart(invalidHeatmap).ok,
          compilable: heatmapCompiled.ok,
          diagnostics: heatmapCompiled.ok ? [] : heatmapCompiled.diagnostics,
        },
        adapterDescriptions: adapters,
        recipeManifestMissing: missingRecipes,
        intentAnimation: groupedResult.value.option.animation,
      },
    },
    null,
    2,
  ),
);
