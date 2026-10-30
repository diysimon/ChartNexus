import { describe, expect, test } from 'vitest';
import {
  createAgentService,
  createRenderer,
  getChartSchema,
  readStaticResource,
  tools,
} from '@chartnexus/agent';
import { ArtifactStore } from '@chartnexus/mcp';
import { chartDocumentSchema } from '@chartnexus/schema';
import recipe from '../resources/recipes/bar.json';
import invalid from '../resources/recipes/unknown-field.json';

describe('agent tools', () => {
  test('shares schemas and packaged recipe sources', () => {
    expect(tools.map((t) => t.name)).toEqual([
      'list_capabilities',
      'get_chart_schema',
      'validate_chart',
      'compile_chart',
      'render_chart',
    ]);
    expect(getChartSchema()).toEqual(chartDocumentSchema);
    expect(getChartSchema('intent').oneOf).toHaveLength(1);
    expect(getChartSchema('echarts').oneOf).toHaveLength(1);
    expect(getChartSchema('intent').$id).not.toBe(
      getChartSchema('echarts').$id,
    );
    expect(chartDocumentSchema.oneOf).toHaveLength(2);
    expect(
      JSON.parse(readStaticResource('chartnexus://recipes/bar')!.text),
    ).toEqual(recipe);
    expect(readStaticResource('file:///etc/passwd')).toBeUndefined();
  });
  test('validates semantic errors and returns compact validation', async () => {
    const service = createAgentService();
    expect(
      await service.execute('validate_chart', { document: invalid }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: 'UNKNOWN_FIELD' }] });
    const valid = await service.execute('validate_chart', { document: recipe });
    expect(valid).toMatchObject({
      ok: true,
      value: { valid: true, validation: 'structure-and-semantics' },
    });
    expect(JSON.stringify(valid)).not.toContain('revenue');
    expect(
      await service.execute('compile_chart', { document: recipe }),
    ).toMatchObject({
      ok: true,
      value: { option: { series: [{ type: 'bar' }] } },
    });
  });
  test('rejects unknown tools, extra args, invalid sizes and excessive input', async () => {
    const service = createAgentService();
    expect(await service.execute('constructor')).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'UNKNOWN_TOOL' }],
    });
    expect(
      await service.execute('render_chart', {
        document: recipe,
        output: '/tmp/private.svg',
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'INVALID_ARGUMENTS' }],
    });
    expect(
      await service.execute('render_chart', { document: recipe, width: 0 }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'INVALID_ARGUMENTS' }],
    });
    expect(
      await service.execute('list_capabilities', {
        text: 'x'.repeat(1_048_576),
      }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: 'RESOURCE_LIMIT' }] });
    expect(
      await service.execute('validate_chart', {
        document: { ...recipe, extra: () => 1 },
      }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: 'INVALID_JSON' }] });
  });
  test('supports only explicitly host-registered references', async () => {
    const document = {
      ...recipe,
      data: { kind: 'reference', id: 'sales', revision: 'r1' },
    };
    expect(
      await createAgentService().execute('validate_chart', { document }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: 'DATA_NOT_FOUND' }] });
    expect(
      await createAgentService({
        registry: { sales: { revision: 'r1', table: recipe.data } },
      }).execute('validate_chart', { document }),
    ).toMatchObject({ ok: true });
  });
  test('renders bounded SVG in worker', async () => {
    const result = await createAgentService().execute('render_chart', {
      document: recipe,
      width: 640,
      height: 360,
    });
    expect(result).toMatchObject({
      ok: true,
      value: { mimeType: 'image/svg+xml', width: 640, height: 360 },
    });
    expect(JSON.stringify(result)).toContain('<svg');
  });
  test('enforces deadlines, cancellation, busy limits and reclaims capacity', async () => {
    const timed = createRenderer({ timeoutMs: 1 });
    expect(await timed(recipe, 800, 480, {})).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'RENDER_TIMEOUT' }],
    });
    const render = createRenderer({ concurrency: 1 });
    const controller = new AbortController();
    const first = render(recipe, 800, 480, {}, controller.signal);
    expect(await render(recipe, 800, 480, {})).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'BUSY' }],
    });
    controller.abort();
    expect(await first).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'CANCELLED' }],
    });
    expect(await render(recipe, 800, 480, {})).toMatchObject({ ok: true });
    expect(await render(recipe, 800, 480, {}, controller.signal)).toMatchObject(
      { ok: false, diagnostics: [{ code: 'CANCELLED' }] },
    );
  });
});

describe('session artifact store', () => {
  test('expires and evicts artifacts without resolving paths', () => {
    let now = 0;
    const store = new ArtifactStore({
      maxEntries: 1,
      ttlMs: 10,
      now: () => now,
    });
    const first = store.put('<svg/>');
    const second = store.put('<svg>2</svg>');
    expect(store.get(first.uri)).toBeUndefined();
    expect(store.get(second.uri)?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(store.get('file:///etc/passwd')).toBeUndefined();
    now = 10;
    expect(store.get(second.uri)).toBeUndefined();
    expect(store.list()).toEqual([]);
  });
  test('enforces total bytes, single-artifact budget, and session isolation', () => {
    const store = new ArtifactStore({ maxBytes: 12 });
    const first = store.put('12345678');
    const next = store.put('abcdefgh');
    expect(store.get(first.uri)).toBeUndefined();
    expect(store.get(next.uri)).toBeDefined();
    expect(() => store.put('x'.repeat(13))).toThrow();
    expect(new ArtifactStore().get(next.uri)).toBeUndefined();
    store.clear();
    expect(store.list()).toEqual([]);
  });
});
