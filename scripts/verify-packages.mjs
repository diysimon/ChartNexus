import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  cp,
  readdir,
  realpath,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '..');
const output = resolve(
  process.env.CHARTNEXUS_PACKAGE_OUTPUT ?? 'outputs/packages',
);
await mkdir(output, { recursive: true });
const reportPath = join(output, `node-${process.versions.node}.json`);
await writeFile(
  reportPath,
  JSON.stringify(
    {
      status: 'running',
      node: process.version,
      started: new Date().toISOString(),
    },
    null,
    2,
  ) + '\n',
);
const consumer = await realpath(
  await mkdtemp(join(tmpdir(), 'chartnexus-consumer-')),
);
const run = (cmd, args, cwd = root) =>
  execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    timeout: 300000,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
const rootManifest = JSON.parse(
  await readFile(join(root, 'package.json'), 'utf8'),
);
const dependencies = {},
  overrides = {},
  artifacts = [];
for (const dir of (await readdir(join(root, 'packages'))).sort()) {
  const pkg = JSON.parse(
    await readFile(join(root, 'packages', dir, 'package.json'), 'utf8'),
  );
  const packed = JSON.parse(
    run(
      'pnpm',
      ['pack', '--pack-destination', output, '--json'],
      join(root, 'packages', dir),
    ),
  );
  const file = resolve(packed.filename);
  const entries = run('tar', ['-tzf', file]).trim().split('\n');
  for (const required of [
    'package/LICENSE',
    'package/NOTICE',
    'package/package.json',
    'package/dist/index.js',
    'package/dist/index.d.ts',
  ]) {
    if (!entries.includes(required))
      throw new Error(`${pkg.name}: missing ${required}`);
  }
  if (
    entries.some(
      (x) =>
        !/^package\/(?:dist\/|bin\/|package.json$|LICENSE$|NOTICE$|README(?:\.md)?$)/.test(
          x,
        ),
    )
  )
    throw new Error(`${pkg.name}: unexpected tarball file`);
  const packedManifest = JSON.parse(
    run('tar', ['-xOf', file, 'package/package.json']),
  );
  if (JSON.stringify(packedManifest).includes('workspace:'))
    throw new Error('Unresolved workspace dependency');
  dependencies[pkg.name] = `file:${file}`;
  overrides[pkg.name] = `file:${file}`;
  const bytes = await readFile(file);
  artifacts.push({
    name: pkg.name,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    entries: entries.length,
  });
}
for (const name of [
  'echarts',
  'react',
  'react-dom',
  'san',
  'marklang',
  'zod',
  '@openuidev/react-lang',
  '@cosui/cosmic-dynamic-ui',
  '@modelcontextprotocol/sdk',
  'vite',
  '@playwright/test',
  'typescript',
  '@types/react',
  '@types/react-dom',
  '@types/node',
])
  dependencies[name] = rootManifest.devDependencies[name];
// Freeze unique third-party versions from the reviewed workspace lock. This is a
// pinned consumer rehearsal, not a claim that all future semver resolutions work.
const lock = await readFile(join(root, 'pnpm-lock.yaml'), 'utf8');
const locked = new Map();
for (const line of lock
  .split('packages:')[1]
  .split('snapshots:')[0]
  .split('\n')) {
  if (!/^  [^ ]/.test(line) || !line.endsWith(':')) continue;
  const key = line.trim().slice(0, -1).replace(/^'|'$/g, '');
  const at = key.lastIndexOf('@');
  if (at < 1) continue;
  const name = key.slice(0, at),
    version = key.slice(at + 1);
  const versions = locked.get(name) ?? new Set();
  versions.add(version);
  locked.set(name, versions);
}
for (const [name, versions] of locked)
  if (versions.size === 1) overrides[name] = [...versions][0];
await writeFile(
  join(consumer, 'package.json'),
  JSON.stringify({ private: true, type: 'module', dependencies }, null, 2),
);
// Pin pnpm 11's clean-project config; no workspace root or parent node_modules is present.
await writeFile(
  join(consumer, 'pnpm-workspace.yaml'),
  JSON.stringify({ packages: [], overrides }, null, 2),
);
await cp(join(root, 'resources'), join(consumer, 'resources'), {
  recursive: true,
});
await cp(join(root, 'examples'), join(consumer, 'examples'), {
  recursive: true,
  filter: (p) => !p.split('/').includes('dist'),
});
await cp(join(root, 'tests/browser'), join(consumer, 'tests/browser'), {
  recursive: true,
});
await cp(
  join(root, 'playwright.config.ts'),
  join(consumer, 'playwright.config.ts'),
);
await cp(
  join(root, 'scripts/package-consumer.mjs'),
  join(consumer, 'consumer.mjs'),
);
const installArgs = [
  'install',
  '--ignore-scripts',
  '--store-dir',
  resolve(process.env.CHARTNEXUS_STORE ?? join(root, '.local/pnpm-store')),
];
if (process.argv.includes('--offline')) installArgs.push('--offline');
// A frozen workspace install populates package contents, but a clean consumer
// also needs registry manifests to resolve optional platform packages. CI uses
// online resolution with the reviewed version overrides; --offline is only for
// an already warmed metadata cache.
const log = [];
try {
  log.push(run('pnpm', installArgs, consumer));
  log.push(run(process.execPath, ['consumer.mjs'], consumer));
  // Fail before Playwright starts if the consumer's bundler/native optional
  // dependencies are absent. Resolution happens wholly inside the consumer.
  log.push(
    run(
      process.execPath,
      ['--input-type=module', '-e', "await import('vite')"],
      consumer,
    ),
  );
  // Type exports are resolved only from installed declarations under NodeNext.
  await writeFile(
    join(consumer, 'consumer.ts'),
    Object.keys(dependencies)
      .filter((n) => n.startsWith('@chartnexus/'))
      .map(
        (n) =>
          `import * as p${n.split('/')[1].replaceAll('-', '_')} from '${n}';`,
      )
      .join('\n'),
  );
  log.push(
    run(
      'pnpm',
      [
        'exec',
        'tsc',
        '--noEmit',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        '--target',
        'ES2022',
        '--skipLibCheck',
        'consumer.ts',
      ],
      consumer,
    ),
  );
  if (process.argv.includes('--browser'))
    log.push(run('pnpm', ['exec', 'playwright', 'test'], consumer));
  const result = {
    status: 'pass',
    node: process.version,
    consumer,
    artifacts,
    browser: process.argv.includes('--browser') ? 'pass' : 'not-run',
    nodeModulesIsolated: true,
    installMode: process.argv.includes('--offline')
      ? 'offline-warm-cache'
      : 'registry-pinned-versions',
  };
  await writeFile(
    join(output, `node-${process.versions.node}.json`),
    JSON.stringify(result, null, 2) + '\n',
  );
  console.log(JSON.stringify(result));
} catch (error) {
  log.push(String(error.stdout ?? ''), String(error.stderr ?? ''));
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        status: 'fail',
        node: process.version,
        consumer,
        artifacts,
        error: String(error.message),
      },
      null,
      2,
    ) + '\n',
  );
  throw error;
} finally {
  try {
    await cp(
      join(consumer, 'test-results'),
      join(output, `browser-${process.versions.node}`),
      { recursive: true },
    );
  } catch (error) {
    if (error.code !== 'ENOENT')
      log.push(`Could not preserve browser artifacts: ${error.message}`);
  }
  await writeFile(
    join(output, `node-${process.versions.node}.log`),
    log.join('\n'),
  );
  console.log(`Retained isolated consumer: ${consumer}`);
}
