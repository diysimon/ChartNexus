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
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { describe, test, expect } from 'vitest';
import {
  compileChart,
  capabilities,
  capabilities02,
  capabilities03,
} from '@chartnexus/core';
import { readStaticResource } from '@chartnexus/agent';
import { renderSvg } from '@chartnexus/render';
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
    expect(
      positive
        .filter((entry) => entry.schemaVersion === '0.3')
        .map((entry) => entry.chartType)
        .sort(),
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
        if (entry.schemaVersion === '0.3') {
          const rendered = renderSvg(document, {
            maps: { [asset.value.id]: asset.value },
          });
          expect(rendered.ok).toBe(true);
          if (rendered.ok) expect(rendered.value).toContain('<svg');
        }
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

test('MCP retrieval exposes the bilingual product boundary, chart catalog and agent guidance from canonical bytes', () => {
  const index = JSON.parse(
    readStaticResource('chartnexus://resources/index/0.1')!.text,
  );
  const records = readStaticResource('chartnexus://resources/retrieval/0.1')!
    .text.trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  for (const language of ['en', 'zh-CN']) {
    for (const id of [
      'product-boundary',
      'chart-catalog',
      'agent-guide',
      'getting-started',
      'genui-integrations',
    ]) {
      const matches = index.entries.filter(
        (entry: { id: string; language: string }) =>
          entry.id === id && entry.language === language,
      );
      expect(matches).toHaveLength(1);
      const entry = matches[0];
      const bytes = readFileSync(`docs/${language}/${id}.md`);
      expect(entry.uri).toBeNull();
      expect(entry.schemaVersion).toBe('0.3');
      expect(entry.updatedAt).toBe('2026-11-01');
      if (id !== 'chart-catalog')
        expect(entry.capabilityIds).toEqual([
          'basic-0.1',
          'basic-0.2',
          'basic-0.3',
        ]);
      expect(entry.contentHash).toBe(
        `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
      );
      const retrieved = records.filter(
        (record: { id: string; language: string }) =>
          record.id === id && record.language === language,
      );
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].body).toBe(bytes.toString('utf8'));
      expect(retrieved[0].contentHash).toBe(entry.contentHash);
    }
    const catalog = readFileSync(`docs/${language}/chart-catalog.md`, 'utf8');
    for (const chart of capabilities03.charts) expect(catalog).toContain(chart);
    const source = language === 'en' ? 'llms.txt' : 'llms.zh-CN.txt';
    const entry = index.entries.find(
      (item: { id: string; language: string }) =>
        item.id === 'llms-entry' && item.language === language,
    );
    const text = readFileSync(source, 'utf8');
    expect(entry.contentHash).toBe(
      `sha256:${createHash('sha256').update(text).digest('hex')}`,
    );
    expect(
      records.find(
        (item: { id: string; language: string }) =>
          item.id === 'llms-entry' && item.language === language,
      ).body,
    ).toBe(text);
    for (const [, path] of text.matchAll(/\]\(([^)]+)\)/g))
      expect(readFileSync(path!, 'utf8').length).toBeGreaterThan(0);
  }
});

test('synthetic model example pairs preserve source data and compile for all 0.3 charts', () => {
  const bytes = readFileSync('resources/model-examples.jsonl', 'utf8');
  expect(readStaticResource('chartnexus://resources/examples/0.1')!.text).toBe(
    bytes,
  );
  const index = JSON.parse(
    readStaticResource('chartnexus://resources/index/0.1')!.text,
  );
  expect(
    index.entries.find(
      (item: { id: string }) => item.id === 'model-examples-0.3',
    ),
  ).toMatchObject({
    language: 'mul',
    uri: 'chartnexus://resources/examples/0.1',
    capabilityIds: ['basic-0.3'],
    contentHash: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
  });
  const examples = bytes
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  expect(examples).toHaveLength(capabilities03.charts.length * 2);
  for (const language of ['en', 'zh-CN']) {
    const selected = examples.filter((item) => item.language === language);
    expect(selected.map((item) => item.chartType).sort()).toEqual(
      [...capabilities03.charts].sort(),
    );
    for (const item of selected) {
      const source = readFileSync(item.provenance.source);
      expect(item.provenance.sourceHash).toBe(
        `sha256:${createHash('sha256').update(source).digest('hex')}`,
      );
      expect(item.provenance.kind).toBe('project-authored-synthetic');
      expect(item.license).toBe('Apache-2.0');
      expect(item.output).toEqual(JSON.parse(source.toString('utf8')));
      expect(item.input.id).toBe(item.output.id);
      expect(item.input.data).toEqual(item.output.data);
      expect(item.input.chart).toEqual(item.output.chart);
      expect(item.input.presentation).toEqual(item.output.presentation);
      expect(compileChart(item.output, {}, maps).ok).toBe(true);
      if (item.chartType === 'map') expect(item.hostRequirement).toBeTruthy();
    }
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
