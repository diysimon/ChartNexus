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

// Package copies are derived from repository resources, never maintained twice.
for (const relative of [
  'recipes/bar.json',
  'recipes/chat-bar.json',
  'recipes/combo.json',
  'recipes/funnel.json',
  'recipes/heatmap.json',
  'recipes/unknown-field.json',
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
  [
    'chat-bar-recipe-0.2',
    'en',
    'Synthetic chat bar chart',
    'resources/recipes/chat-bar.json',
    'chartnexus://recipes/chat-bar/0.2',
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
    'heatmap-recipe-0.2',
    'en',
    'Synthetic sparse heatmap',
    'resources/recipes/heatmap.json',
    'chartnexus://recipes/heatmap/0.2',
  ],
  [
    'combo-recipe-0.2',
    'en',
    'Synthetic single-axis bar-line combo',
    'resources/recipes/combo.json',
    'chartnexus://recipes/combo/0.2',
  ],
  [
    'funnel-recipe-0.2',
    'en',
    'Synthetic ordered funnel chart',
    'resources/recipes/funnel.json',
    'chartnexus://recipes/funnel/0.2',
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
    'bar-recipe',
    'en',
    'Synthetic bar recipe',
    'resources/recipes/bar.json',
    'chartnexus://recipes/bar',
  ],
  [
    'repair-unknown-field',
    'en',
    'Unknown field example',
    'resources/recipes/unknown-field.json',
    'chartnexus://recipes/unknown-field',
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
for (const [id, language, title, sourcePath, uri] of entries) {
  const content = await readFile(new URL(`../${sourcePath}`, import.meta.url));
  const metadata = {
    id,
    language,
    title,
    summary: title,
    capabilityIds: [
      id.startsWith('native-strict-')
        ? 'native-strict-basic-0.1'
        : id.endsWith('-0.2')
          ? 'basic-0.2'
          : 'basic-0.1',
    ],
    schemaVersion: id.endsWith('-0.2') ? '0.2' : '0.1',
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
