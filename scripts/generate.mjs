import { compile } from 'json-schema-to-typescript';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { format } from 'prettier';
const path = new URL(
  '../packages/schema/src/chart-document.schema.json',
  import.meta.url,
);
const output = new URL('../packages/schema/src/generated.ts', import.meta.url);
const code = await compile(
  JSON.parse(await readFile(path, 'utf8')),
  'ChartDocument',
  {
    bannerComment:
      '/* Generated from chart-document.schema.json. Do not edit. */',
    style: { singleQuote: true },
  },
);
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')) !== code)
    throw new Error('Generated schema types differ; run pnpm generate.');
} else await writeFile(output, code);

const path02 = new URL(
  '../packages/schema/src/chart-document-0.2.schema.json',
  import.meta.url,
);
const output02 = new URL(
  '../packages/schema/src/generated-0.2.ts',
  import.meta.url,
);
const rawCode02 = await compile(
  JSON.parse(await readFile(path02, 'utf8')),
  'ChartDocument02',
  {
    bannerComment:
      '/* Generated from chart-document-0.2.schema.json. Do not edit. */',
    style: { singleQuote: true },
  },
);
const code02 = await format(rawCode02, {
  parser: 'typescript',
  singleQuote: true,
});
if (process.argv.includes('--check')) {
  if ((await readFile(output02, 'utf8')) !== code02)
    throw new Error('Generated 0.2 schema types differ; run pnpm generate.');
} else await writeFile(output02, code02);

const source03 = new URL(
  '../packages/schema/src/chart-document-0.3.schema.json',
  import.meta.url,
);
const code03 = await format(
  await compile(
    JSON.parse(await readFile(source03, 'utf8')),
    'ChartDocument03',
    {
      bannerComment:
        '/* Generated from chart-document-0.3.schema.json. Do not edit. */',
    },
  ),
  { parser: 'typescript', singleQuote: true },
);
const output03 = new URL(
  '../packages/schema/src/generated-0.3.ts',
  import.meta.url,
);
if (process.argv.includes('--check')) {
  if ((await readFile(output03, 'utf8')) !== code03)
    throw new Error('Generated 0.3 types differ.');
} else await writeFile(output03, code03);

const recipeManifest = JSON.parse(
  await readFile(
    new URL('../resources/recipes/manifest.json', import.meta.url),
    'utf8',
  ),
);
const recipeResources = [];
for (const entry of recipeManifest.examples) {
  const document = JSON.parse(
    await readFile(
      new URL(`../resources/recipes/${entry.path}`, import.meta.url),
      'utf8',
    ),
  );
  recipeResources.push({
    uri: entry.uri,
    name: entry.title,
    mimeType: 'application/json',
    value: entry.expectedCode
      ? { document, expectedCode: entry.expectedCode, repair: entry.repair }
      : document,
  });
}
for (const [target, value] of [
  ['../packages/agent/src/recipe-resources.json', recipeResources],
  [
    '../packages/runtime/src/input-example-03.json',
    recipeResources.find(
      (entry) => entry.uri === 'chartnexus://recipes/chat-bar/0.3',
    ).value,
  ],
  [
    '../packages/runtime/src/input-example.json',
    recipeResources.find(
      (entry) => entry.uri === 'chartnexus://recipes/chat-bar/0.2',
    ).value,
  ],
]) {
  const file = new URL(target, import.meta.url);
  const content = await format(JSON.stringify(value), { parser: 'json' });
  if (process.argv.includes('--check')) {
    if ((await readFile(file, 'utf8')) !== content)
      throw new Error(`Resource drift: ${target}`);
  } else await writeFile(file, content);
}

// Package copies are derived from repository resources, never maintained twice.
for (const relative of [
  ...recipeManifest.examples.map((entry) => `recipes/${entry.path}`),
  'recipes/manifest.json',
  'diagnostics.json',
  'evaluation/tasks.json',
]) {
  const source = new URL(`../resources/${relative}`, import.meta.url);
  const destination = new URL(
    `../packages/agent/src/${relative}`,
    import.meta.url,
  );
  const text = await readFile(source, 'utf8');
  if (process.argv.includes('--check')) {
    if ((await readFile(destination, 'utf8')) !== text)
      throw new Error(`Resource drift: ${relative}`);
  } else {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(new URL('.', destination), { recursive: true });
    await writeFile(destination, text);
  }
}

// A compact, versioned retrieval inventory references canonical source bytes.
const entries = [
  ...['en', 'zh-CN'].flatMap((language) => [
    [
      'chart-expansion-0.3',
      language,
      'Four bounded 0.3 chart types and trusted map assets',
      `docs/${language}/chart-expansion-03.md`,
      null,
      '0.3',
    ],
    [
      'contracts-0.3',
      language,
      '0.3 contracts and migration',
      `docs/${language}/contracts-03.md`,
      null,
      '0.3',
    ],
    [
      'chat-host-quality-0.3',
      language,
      'Chat host quality and support matrix',
      `docs/${language}/chat-host-quality.md`,
      null,
      '0.3',
    ],
  ]),
  [
    'chart-document-0.3',
    'en',
    'Experimental 0.3 contract',
    'packages/schema/src/chart-document-0.3.schema.json',
    'chartnexus://schema/chart-document/0.3',
    '0.3',
  ],
  [
    'capabilities-0.3',
    'en',
    'Implemented 0.3 capabilities',
    'packages/core/src/capabilities-0.3.json',
    'chartnexus://capabilities/basic-0.3',
    '0.3',
  ],
  ...recipeManifest.examples.map((entry) => [
    entry.resourceId,
    'en',
    entry.title,
    `resources/recipes/${entry.path}`,
    entry.uri,
    entry.schemaVersion,
  ]),
  [
    'recipe-manifest',
    'en',
    'Synthetic development recipe inventory',
    'resources/recipes/manifest.json',
    'chartnexus://recipes/manifest/0.1',
  ],
  [
    'chat-presentation-0.2',
    'en',
    'Chat presentation profile',
    'docs/en/chat-presentation.md',
    null,
  ],
  [
    'chat-presentation-0.2',
    'zh-CN',
    '聊天展示 profile',
    'docs/zh-CN/chat-presentation.md',
    null,
  ],
  [
    'native-strict-schema',
    'en',
    'Strict native option subset schema',
    'packages/schema/src/native-strict-basic-0.1.schema.json',
    'chartnexus://schema/native-strict-basic/0.1',
  ],
  [
    'native-strict-capabilities',
    'en',
    'Strict native subset capabilities',
    'packages/core/src/native-strict-capabilities.json',
    'chartnexus://capabilities/native-strict-basic-0.1',
  ],
  [
    'chart-document-0.2',
    'en',
    'Experimental 0.2 intent schema',
    'packages/schema/src/chart-document-0.2.schema.json',
    'chartnexus://schema/chart-document/0.2',
  ],
  [
    'capabilities-0.2',
    'en',
    'Experimental 0.2 capabilities',
    'packages/core/src/capabilities-0.2.json',
    'chartnexus://capabilities/basic-0.2',
  ],
  [
    'chart-document',
    'en',
    'ChartDocument schema',
    'packages/schema/src/chart-document.schema.json',
    'chartnexus://schema/chart-document/0.1',
  ],
  [
    'capabilities',
    'en',
    'Supported capabilities',
    'packages/core/src/capabilities.json',
    'chartnexus://capabilities/basic-0.1',
  ],
  [
    'diagnostics',
    'en',
    'Diagnostics and repairs',
    'resources/diagnostics.json',
    'chartnexus://diagnostics/basic-0.1',
  ],
  [
    'model-entry',
    'en',
    'Model and agent entry',
    'docs/en/model-entry.md',
    'chartnexus://resources/model-entry/en/0.1',
  ],
  [
    'model-entry',
    'zh-CN',
    '模型与 Agent 入口',
    'docs/zh-CN/model-entry.md',
    'chartnexus://resources/model-entry/zh-CN/0.1',
  ],
  [
    'evaluation-baseline',
    'en',
    'Offline evaluation baseline',
    'docs/en/evaluation-baseline.md',
    null,
  ],
  [
    'evaluation-baseline',
    'zh-CN',
    '离线评测基线',
    'docs/zh-CN/evaluation-baseline.md',
    null,
  ],
  [
    'evaluation-tasks',
    'en',
    'Synthetic bilingual development tasks',
    'resources/evaluation/tasks.json',
    'chartnexus://evaluation/tasks/0.1',
  ],
];
const index = {
  version: '0.1',
  schemaVersion: '0.1',
  status: 'experimental',
  license: 'Apache-2.0',
  entries: [],
};
const retrieval = [];
for (const [id, language, title, sourcePath, uri, explicitVersion] of entries) {
  const content = await readFile(new URL(`../${sourcePath}`, import.meta.url));
  const metadata = {
    id,
    language,
    title,
    summary: title,
    capabilityIds: [
      id.startsWith('native-strict-')
        ? 'native-strict-basic-0.1'
        : explicitVersion === '0.3'
          ? 'basic-0.3'
          : explicitVersion === '0.2' || id.endsWith('-0.2')
            ? 'basic-0.2'
            : 'basic-0.1',
    ],
    schemaVersion: explicitVersion ?? (id.endsWith('-0.2') ? '0.2' : '0.1'),
    source: sourcePath,
    license: 'Apache-2.0',
    updatedAt: '2026-10-31',
    uri,
    contentHash: `sha256:${createHash('sha256').update(content).digest('hex')}`,
  };
  index.entries.push(metadata);
  retrieval.push({ ...metadata, body: content.toString('utf8') });
}
const indexText = await format(JSON.stringify(index), { parser: 'json' });
for (const target of [
  '../resources/model-index.json',
  '../packages/agent/src/model-index.json',
]) {
  const file = new URL(target, import.meta.url);
  if (process.argv.includes('--check')) {
    if ((await readFile(file, 'utf8')) !== indexText)
      throw new Error(`Resource index drift: ${target}`);
  } else await writeFile(file, indexText);
}
const jsonl = retrieval.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
const retrievalTargets = [
  ['../resources/model-retrieval.jsonl', jsonl],
  [
    '../packages/agent/src/model-retrieval.json',
    JSON.stringify({ text: jsonl }, null, 2) + '\n',
  ],
];
for (const [target, content] of retrievalTargets) {
  const file = new URL(target, import.meta.url);
  if (process.argv.includes('--check')) {
    if ((await readFile(file, 'utf8')) !== content)
      throw new Error(`Retrieval drift: ${target}`);
  } else await writeFile(file, content);
}
for (const language of ['en', 'zh-CN']) {
  const source = new URL(`../docs/${language}/model-entry.md`, import.meta.url);
  const destination = new URL(
    `../packages/agent/src/model-entry-${language}.json`,
    import.meta.url,
  );
  const text =
    JSON.stringify({ text: await readFile(source, 'utf8') }, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if ((await readFile(destination, 'utf8')) !== text)
      throw new Error(`Model entry drift: ${language}`);
  } else await writeFile(destination, text);
}

// Every ordinary pnpm pack must include the same distribution notices.
for (const name of [
  'schema',
  'core',
  'echarts',
  'runtime',
  'render',
  'agent',
  'cli',
  'mcp',
  'adapter-a2ui',
  'adapter-openui',
  'adapter-cosui',
]) {
  for (const file of ['LICENSE', 'NOTICE']) {
    const value = await readFile(
      new URL(`../${file}`, import.meta.url),
      'utf8',
    );
    const target = new URL(`../packages/${name}/${file}`, import.meta.url);
    if (process.argv.includes('--check')) {
      if ((await readFile(target, 'utf8')) !== value)
        throw new Error(`${name}/${file} differs`);
    } else await writeFile(target, value);
  }
}
