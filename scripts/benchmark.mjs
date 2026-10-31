import { build } from 'vite';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { cpus, platform, arch } from 'node:os';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import { boundaryFixtures } from './performance-fixtures.mjs';
import { mapCatalog } from '@chartnexus/echarts';
import { fingerprint } from './independent-evaluation.mjs';
const compareIndex = process.argv.indexOf('--compare');
const comparison =
  compareIndex >= 0
    ? JSON.parse(await readFile(process.argv[compareIndex + 1], 'utf8'))
    : undefined;
const output = 'outputs/performance';
await mkdir(output, { recursive: true });
await mkdir('.local/bundle', { recursive: true });
const bundles = [];
for (const name of [
  'core',
  'runtime',
  'adapter-openui',
  'adapter-a2ui',
  'adapter-cosui',
]) {
  for (const includePeers of [false, true]) {
    const entry = `.local/bundle/${name}.mjs`;
    await writeFile(entry, `export * from '@chartnexus/${name}';\n`);
    const result = await build({
      configFile: false,
      logLevel: 'error',
      build: {
        write: false,
        minify: true,
        lib: { entry, formats: ['es'] },
        rollupOptions: {
          external: includePeers
            ? []
            : (id) =>
                !id.startsWith('@chartnexus/') &&
                !id.startsWith('.') &&
                !id.startsWith('/'),
        },
        reportCompressedSize: false,
      },
    });
    const code = result[0].output
      .filter((x) => x.type === 'chunk')
      .map((x) => x.code)
      .join('\n');
    bundles.push({
      name,
      includePeers,
      rawBytes: Buffer.byteLength(code),
      gzipBytes: gzipSync(code).length,
    });
  }
}
const recipe = JSON.parse(
  await readFile('resources/recipes/chat-bar-03.json', 'utf8'),
);
const stats = (values) => ({
  samples: values.length,
  medianMs: values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)],
  p95Ms: values.toSorted((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1],
  maxMs: Math.max(...values),
});
const measurements = [];
for (const rows of [100, 1000, 10000]) {
  const document = {
    ...recipe,
    data: {
      kind: 'inline',
      fields: ['month', 'revenue'],
      keyField: 'month',
      rows: Array.from({ length: rows }, (_, i) => ({
        month: `item-${i}`,
        revenue: i % 101,
      })),
    },
  };
  const compile = [],
    svg = [];
  for (let i = 0; i < 25; i++) {
    const start = performance.now(),
      result = compileChart(document);
    if (!result.ok) throw new Error(JSON.stringify(result));
    if (i >= 5) compile.push(performance.now() - start);
  }
  global.gc?.();
  const before = process.memoryUsage().heapUsed;
  for (let i = 0; i < 12; i++) {
    const start = performance.now(),
      result = renderSvg(document, { width: 640, height: 360 });
    if (!result.ok) throw new Error(JSON.stringify(result));
    if (i >= 2) svg.push(performance.now() - start);
  }
  global.gc?.();
  measurements.push({
    rows,
    compile: stats(compile),
    svg: stats(svg),
    heapAfterDisposalDelta: process.memoryUsage().heapUsed - before,
  });
}
const boundaries = [];
for (const fixture of await boundaryFixtures()) {
  const compile = [],
    svg = [];
  for (let i = 0; i < 12; i++) {
    let start = performance.now();
    const c = compileChart(fixture.document, {}, mapCatalog(fixture.maps));
    if (!c.ok) throw new Error(JSON.stringify(c));
    if (i >= 2) compile.push(performance.now() - start);
    start = performance.now();
    const r = renderSvg(fixture.document, {
      width: 640,
      height: 360,
      maps: fixture.maps,
    });
    if (!r.ok) throw new Error(JSON.stringify(r));
    if (i >= 2) svg.push(performance.now() - start);
  }
  boundaries.push({
    name: fixture.name,
    compile: stats(compile),
    svg: stats(svg),
  });
}
const result = {
  node: process.version,
  platform: platform(),
  arch: arch(),
  cpu: cpus()[0].model,
  created: new Date().toISOString(),
  inputFingerprint: fingerprint(recipe),
  bundles,
  measurements,
  boundaries,
  gcExposed: !!global.gc,
  note: 'SDK all-export ESM minified bundles; includePeers includes host libraries; otherwise all third-party imports external. Heap delta is observational, not a leak proof. Same-machine ratios only.',
};
await writeFile(
  `${output}/baseline-${process.versions.node}.json`,
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));

// Bundle bytes are machine-independent; runtime timings are not.
try {
  const budgets = JSON.parse(
    await readFile('resources/performance-budgets.json', 'utf8'),
  );
  for (const entry of bundles) {
    const budget = budgets.bundles.find(
      (b) => b.name === entry.name && b.includePeers === entry.includePeers,
    );
    if (
      !budget ||
      entry.rawBytes > budget.rawBytes ||
      entry.gzipBytes > budget.gzipBytes
    )
      throw new Error(
        `Bundle budget exceeded: ${entry.name} peers=${entry.includePeers}`,
      );
  }
} catch (error) {
  throw error;
}
if (comparison) {
  const baseline = comparison;
  for (const key of ['node', 'platform', 'arch', 'cpu'])
    if (baseline[key] !== result[key])
      throw new Error('Timing comparison requires same runtime and machine');
  for (const row of measurements) {
    const old = baseline.measurements.find((x) => x.rows === row.rows);
    if (!old) throw new Error('Missing baseline rows');
    for (const metric of ['compile', 'svg'])
      if (row[metric].p95Ms > old[metric].p95Ms * 1.2)
        throw new Error(`p95 regression >20%: ${row.rows} ${metric}`);
  }
}
