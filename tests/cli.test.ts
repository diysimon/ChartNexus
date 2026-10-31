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
  test('discovers capabilities/schema and returns machine-readable help', () => {
    expect(run(['capabilities']).json).toMatchObject({
      ok: true,
      value: { id: 'basic-0.1' },
    });
    expect(run(['schema', '--mode', 'intent']).json.value.oneOf).toHaveLength(
      1,
    );
    expect(run(['--help']).status).toBe(0);
  });
  test('selects schema versions explicitly and rejects incompatible modes', () => {
    expect(run(['schema']).json.value.$id).toBe(
      'https://chartnexus.dev/schemas/chart-document/0.1',
    );
    expect(
      run(['schema', '--schema-version', '0.2', '--mode', 'intent']).json.value
        .$id,
    ).toBe('https://chartnexus.dev/schemas/chart-document/0.2');
    expect(
      run(['schema', '--schema-version', '0.2', '--mode', 'echarts']),
    ).toMatchObject({
      status: 1,
      json: { ok: false, diagnostics: [{ code: 'UNSUPPORTED_CAPABILITY' }] },
    });
    expect(
      run(['schema', '--schema-version', '0.3', '--chart-type', 'bar']),
    ).toMatchObject({
      status: 0,
      json: {
        ok: true,
        value: { properties: { schemaVersion: { const: '0.3' } } },
      },
    });
    expect(run(['schema', '--schema-version', '0.4']).status).toBe(2);
    expect(run(['capabilities', '--schema-version', '0.2']).status).toBe(2);
    expect(
      run(['schema', '--schema-version', '0.1', '--schema-version', '0.2'])
        .status,
    ).toBe(2);
  });
  test('validates file input and compiles stdin', () => {
    expect(run(['validate', 'resources/recipes/bar.json']).json).toMatchObject({
      ok: true,
    });
    const compiled = run(['compile', '-'], JSON.stringify(recipe));
    expect(compiled.status).toBe(0);
    expect(compiled.stderr).toBe('');
    expect(compiled.json.value.option.series[0].type).toBe('bar');
  });
  test('reports input, semantic, usage and IO failures with stable exit codes', () => {
    expect(run(['validate'], '{').json.diagnostics[0].code).toBe(
      'INVALID_JSON',
    );
    expect(
      run(['validate', 'resources/recipes/unknown-field.json']).status,
    ).toBe(1);
    expect(run(['validate'], ' '.repeat(1_048_577)).status).toBe(1);
    expect(run(['render', '--unknown', 'x']).status).toBe(2);
    expect(
      run(['schema', '--mode', 'intent', '--mode', 'echarts']).status,
    ).toBe(2);
    expect(run(['schema', 'unexpected']).status).toBe(2);
    expect(
      run(['validate', 'missing-chartnexus-file.json']).json.diagnostics[0]
        .code,
    ).toBe('IO_ERROR');
  });
  test('renders SVG only to an explicitly requested new path and refuses overwrite', () => {
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
