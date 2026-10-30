import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { renderSvg } from '@chartnexus/render';
const input = JSON.parse(
  await readFile(
    new URL('../resources/recipes/bar.json', import.meta.url),
    'utf8',
  ),
);
const result = renderSvg(input);
if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
await mkdir(new URL('../outputs/', import.meta.url), { recursive: true });
await writeFile(new URL('../outputs/sales.svg', import.meta.url), result.value);
console.log('Rendered outputs/sales.svg');
