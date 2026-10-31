// Executed from a clean consumer; never import the workspace source here.
import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { compileChart } from '@chartnexus/core';
import { renderSvg } from '@chartnexus/render';
import { createAgentService, resources } from '@chartnexus/agent';
import { createMapAsset } from '@chartnexus/echarts';
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const packages = Object.keys(manifest.dependencies).filter((n) =>
  n.startsWith('@chartnexus/'),
);
for (const name of packages) {
  const resolved = await realpath(new URL(import.meta.resolve(name)));
  assert(
    resolved.startsWith(`${process.cwd()}/node_modules/`),
    `${name}: escaped consumer`,
  );
  await import(name);
  const pkg = JSON.parse(
    await readFile(`node_modules/${name}/package.json`, 'utf8'),
  );
  for (const target of Object.values(pkg.exports)) {
    await readFile(`node_modules/${name}/${target.types}`);
    await readFile(`node_modules/${name}/${target.import}`);
  }
  for (const file of ['LICENSE', 'NOTICE'])
    assert(
      (await readFile(`node_modules/${name}/${file}`, 'utf8')).length > 100,
    );
}
await import('@chartnexus/adapter-cosui/marklang');
const doc = JSON.parse(
  await readFile('resources/recipes/chat-bar-03.json', 'utf8'),
);
assert(compileChart(doc).ok);
assert(renderSvg(doc).ok);
const service = createAgentService();
assert(
  (await service.execute('render_chart', { document: doc })).ok,
  'installed worker',
);
assert(resources.length > 10);
const map = createMapAsset(
  JSON.parse(await readFile('examples/maps/two-regions.json', 'utf8')),
);
assert(map.ok);
const mapDoc = JSON.parse(
  await readFile('resources/recipes/map-03.json', 'utf8'),
);
assert(
  (
    await createAgentService({ maps: { [map.value.id]: map.value } }).execute(
      'render_chart',
      { document: mapDoc },
    )
  ).ok,
  'installed map worker',
);
const cli = execFileSync('node_modules/.bin/chartnexus', ['compile', '-'], {
  input: JSON.stringify(doc),
  encoding: 'utf8',
  timeout: 15000,
});
assert(JSON.parse(cli).ok);
const client = new Client({ name: 'packed-consumer', version: '0.1' });
try {
  await client.connect(
    new StdioClientTransport({
      command: `${process.cwd()}/node_modules/.bin/chartnexus-mcp`,
      stderr: 'pipe',
    }),
  );
  assert.equal((await client.listTools()).tools.length, 5);
  for (const resource of (await client.listResources()).resources) {
    assert(
      (await client.readResource({ uri: resource.uri })).contents.length > 0,
    );
  }
  const result = await client.callTool({
    name: 'render_chart',
    arguments: { document: doc },
  });
  assert(result.structuredContent.ok);
  const artifact = result.structuredContent.value;
  const response = await client.readResource({ uri: artifact.uri });
  assert.equal(
    createHash('sha256').update(response.contents[0].text).digest('hex'),
    artifact.sha256,
  );
} finally {
  await client.close();
}
console.log(
  JSON.stringify({
    node: process.version,
    packages: packages.length,
    exports: true,
    resources: true,
    worker: true,
    mapWorker: true,
    cli: true,
    mcp: true,
  }),
);
