import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// An alternate root supports isolated checker regression fixtures.
const rootIndex = process.argv.indexOf('--root');
const root =
  rootIndex < 0
    ? fileURLToPath(new URL('..', import.meta.url))
    : path.resolve(process.argv[rootIndex + 1]);
const manifest = JSON.parse(
  await readFile(path.join(root, 'docs/manifest.json'), 'utf8'),
);
let links = 0;
for (const entry of manifest.documents) {
  let pairedDate;
  for (const language of ['en', 'zh-CN']) {
    const file = path.join(root, entry[language]);
    const text = await readFile(file, 'utf8');
    const header = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1];
    if (!header) throw new Error(`${file}: missing frontmatter`);
    const metadata = {};
    for (const line of header.split(/\r?\n/)) {
      const field = /^([a-z_]+):\s*(.*?)\s*$/.exec(line);
      if (!field) continue;
      const [, key, value] = field;
      if (Object.hasOwn(metadata, key))
        throw new Error(`${file}: duplicate ${key}`);
      metadata[key] = value.replace(/^(["'])(.*)\1$/, '$2');
    }
    for (const [key, value] of Object.entries({
      doc_id: entry.id,
      language,
      version: entry.version,
      status: entry.status,
    })) {
      if (metadata[key] !== value)
        throw new Error(`${file}: ${key} must equal ${value}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.updated ?? ''))
      throw new Error(`${file}: invalid updated date`);
    if (pairedDate && pairedDate !== metadata.updated)
      throw new Error(`${file}: paired updated dates differ`);
    pairedDate = metadata.updated;
    for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (target.includes('://') || target.startsWith('#')) continue;
      await access(path.resolve(path.dirname(file), target.split('#')[0]));
      links++;
    }
  }
}
console.log(
  `Validated ${manifest.documents.length} bilingual pairs and ${links} local links.`,
);
