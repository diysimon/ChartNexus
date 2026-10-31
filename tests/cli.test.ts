import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import recipe from '../resources/recipes/bar.json';
const entry = resolve('packages/cli/bin/chartnexus.mjs');
function run(args: string[], input = '') {
  const result = spawnSync(process.execPath, [entry, ...args], {
    input,
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 12_000_000,
  });
  return { ...result, json: JSON.parse(result.stdout || '{}') };
}

describe('CLI child process', () => {
  test('discovers capabilities', () => {
    expect(run(['capabilities']).json).toMatchObject({
      ok: true,
      value: { id: 'basic-0.1' },
    });
  });
  test('discovers the intent schema', () => {
    expect(run(['schema', '--mode', 'intent']).json.value.oneOf).toHaveLength(
      1,
    );
  });
  test('returns machine-readable help', () => {
    expect(run(['--help']).status).toBe(0);
  });
  test.each([
    {
      args: ['schema'],
      expected: {
        json: {
          value: { $id: 'https://chartnexus.dev/schemas/chart-document/0.1' },
        },
      },
    },
    {
      args: ['schema', '--schema-version', '0.2', '--mode', 'intent'],
      expected: {
        json: {
          value: { $id: 'https://chartnexus.dev/schemas/chart-document/0.2' },
        },
      },
    },
    {
      args: ['schema', '--schema-version', '0.2', '--mode', 'echarts'],
      expected: {
        status: 1,
        json: { ok: false, diagnostics: [{ code: 'UNSUPPORTED_CAPABILITY' }] },
      },
    },
    {
      args: ['schema', '--schema-version', '0.3', '--chart-type', 'bar'],
      expected: {
        status: 0,
        json: {
          ok: true,
          value: { properties: { schemaVersion: { const: '0.3' } } },
        },
      },
    },
    { args: ['schema', '--schema-version', '0.4'], expected: { status: 2 } },
    {
      args: ['capabilities', '--schema-version', '0.2'],
      expected: { status: 2 },
    },
    {
      args: ['schema', '--schema-version', '0.1', '--schema-version', '0.2'],
      expected: { status: 2 },
    },
  ])('selects/rejects schema arguments: $args', ({ args, expected }) => {
    expect(run(args)).toMatchObject(expected);
  });
  test('validates file input', () => {
    expect(run(['validate', 'resources/recipes/bar.json']).json).toMatchObject({
      ok: true,
    });
  });
  test('compiles stdin', () => {
    const compiled = run(['compile', '-'], JSON.stringify(recipe));
    expect(compiled.status).toBe(0);
    expect(compiled.stderr).toBe('');
    expect(compiled.json.value.option.series[0].type).toBe('bar');
  });
  test.each([
    {
      args: ['validate'],
      input: '{',
      expected: { json: { diagnostics: [{ code: 'INVALID_JSON' }] } },
    },
    {
      args: ['validate', 'resources/recipes/unknown-field.json'],
      expected: { status: 1 },
    },
    {
      args: ['validate'],
      input: ' '.repeat(1_048_577),
      expected: { status: 1 },
    },
    { args: ['render', '--unknown', 'x'], expected: { status: 2 } },
    {
      args: ['schema', '--mode', 'intent', '--mode', 'echarts'],
      expected: { status: 2 },
    },
    { args: ['schema', 'unexpected'], expected: { status: 2 } },
    {
      args: ['validate', 'missing-chartnexus-file.json'],
      expected: { json: { diagnostics: [{ code: 'IO_ERROR' }] } },
    },
  ])(
    'reports failure with stable exit codes: $args',
    ({ args, input, expected }) => {
      expect(run(args, input)).toMatchObject(expected);
    },
  );
  test('renders SVG only to an explicitly requested new path', () => {
    const directory = mkdtempSync(join(tmpdir(), 'chartnexus-cli-'));
    const output = join(directory, 'chart.svg');
    try {
      const result = run([
        'render',
        'resources/recipes/bar.json',
        '--output',
        output,
        '--width',
        '640',
      ]);
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(readFileSync(output, 'utf8')).toContain('<svg');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  test('refuses to overwrite an existing output', () => {
    const directory = mkdtempSync(join(tmpdir(), 'chartnexus-cli-'));
    const output = join(directory, 'chart.svg');
    try {
      writeFileSync(output, 'KEEP');
      expect(
        run(['render', 'resources/recipes/bar.json', '--output', output])
          .status,
      ).toBe(2);
      expect(readFileSync(output, 'utf8')).toBe('KEEP');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
