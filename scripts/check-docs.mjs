import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const manifest = JSON.parse(
  await readFile(path.join(root, 'docs/manifest.json'), 'utf8'),
);
let links = 0;
for (const entry of manifest.documents) {
  for (const language of ['en', 'zh-CN']) {
    const file = path.join(root, entry[language]);
    const text = await readFile(file, 'utf8');
    for (const value of [
      `doc_id: ${entry.id}`,
      `language: ${language}`,
      `version: "${entry.version}"`,
    ]) {
      if (!text.includes(value)) throw new Error(`${file}: missing ${value}`);
    }
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
