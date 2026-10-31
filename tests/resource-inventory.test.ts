import { createMapAsset, mapCatalog } from '@chartnexus/echarts';
import assetInput from '../examples/maps/two-regions.json';
const asset = createMapAsset(assetInput);
if (!asset.ok) throw new Error('Invalid authored map asset');
const maps = mapCatalog({ [asset.value.id]: asset.value });
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, test, expect } from 'vitest';
import {
  compileChart,
  capabilities,
  capabilities02,
  capabilities03,
} from '@chartnexus/core';
import { readStaticResource } from '@chartnexus/agent';
import manifest from '../resources/recipes/manifest.json';

function patch(document: unknown, pointer: string, value: unknown): unknown {
  const result = structuredClone(document);
  const keys = pointer.slice(1).split('/');
  let parent = result as Record<string, unknown>;
  for (const key of keys.slice(0, -1))
    parent = parent[key] as Record<string, unknown>;
  parent[keys.at(-1)!] = value;
  return result;
}

describe('canonical recipe inventory', () => {
  test('covers exactly supported intent types without claiming proposed charts', () => {
    const positive = manifest.examples.filter(
      (entry) => entry.expected === 'success',
    );
    expect(
      [...new Set(positive.map((entry) => entry.chartType))].sort(),
    ).toEqual([...capabilities03.charts].sort());
    expect(new Set(manifest.examples.map((entry) => entry.uri)).size).toBe(
      manifest.examples.length,
    );
    expect(
      JSON.parse(readStaticResource('chartnexus://recipes/manifest/0.1')!.text),
    ).toEqual(manifest);
  });
  for (const entry of manifest.examples) {
    test(`${entry.id}: canonical resource and positive/negative semantics`, () => {
      const document = JSON.parse(
        readFileSync(`resources/recipes/${entry.path}`, 'utf8'),
      );
      expect(document.schemaVersion).toBe(entry.schemaVersion);
      expect(document.chart.type).toBe(entry.chartType);
      const supported =
        entry.schemaVersion === '0.3'
          ? capabilities03
          : entry.schemaVersion === '0.2'
            ? capabilities02
            : capabilities;
      expect(supported.charts).toContain(entry.chartType);
      const resource = JSON.parse(readStaticResource(entry.uri)!.text);
      expect(resource).toEqual(
        entry.expectedCode
          ? { document, expectedCode: entry.expectedCode, repair: entry.repair }
          : document,
      );
      if (entry.expectedCode) {
        const invalid = compileChart(document);
        expect(invalid.ok).toBe(false);
        if (!invalid.ok)
          expect(invalid.diagnostics.map((item) => item.code)).toContain(
            entry.expectedCode,
          );
        expect(
          compileChart(patch(document, entry.repair!.path, entry.repair!.value))
            .ok,
        ).toBe(true);
      } else {
        expect(compileChart(document, {}, maps).ok).toBe(true);
        const negative = entry.negative!;
        const invalid = compileChart(
          patch(document, negative.path, negative.value),
          {},
          maps,
        );
        expect(invalid.ok).toBe(false);
        if (!invalid.ok)
          expect(invalid.diagnostics.map((item) => item.code)).toContain(
            negative.expectedCode,
          );
      }
    });
  }
});

test('docs checker rejects paired dates, manifest statuses and body-only metadata', () => {
  const root = mkdtempSync(join(tmpdir(), 'chartnexus-docs-'));
  try {
    mkdirSync(join(root, 'docs'));
    writeFileSync(
      join(root, 'docs/manifest.json'),
      JSON.stringify({
        documents: [
          {
            id: 'fixture',
            version: '0.1',
            status: 'done',
            en: 'en.md',
            'zh-CN': 'zh.md',
          },
        ],
      }),
    );
    const text = (language: string, date = '2026-10-31', status = 'done') =>
      `---\ndoc_id: fixture\nversion: "0.1"\nstatus: ${status}\nupdated: ${date}\nlanguage: ${language}\n---\n`;
    writeFileSync(join(root, 'en.md'), text('en'));
    const run = (content: string) => {
      writeFileSync(join(root, 'zh.md'), content);
      return spawnSync(
        process.execPath,
        ['scripts/check-docs.mjs', '--root', root],
        { encoding: 'utf8' },
      );
    };
    expect(run(text('zh-CN')).status).toBe(0);
    expect(run(text('zh-CN', '2026-10-30')).stderr).toContain(
      'paired updated dates differ',
    );
    expect(run(text('zh-CN', '2026-10-31', 'planned')).stderr).toContain(
      'status must equal done',
    );
    expect(run('Body only\n' + text('zh-CN')).stderr).toContain(
      'missing frontmatter',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
