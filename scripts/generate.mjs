import { compile } from 'json-schema-to-typescript';
import { readFile, writeFile } from 'node:fs/promises';
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

// Package copies are derived from repository resources, never maintained twice.
for (const relative of [
  'recipes/bar.json',
  'recipes/unknown-field.json',
  'diagnostics.json',
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
