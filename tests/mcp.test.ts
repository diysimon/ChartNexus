import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { describe, expect, test } from 'vitest';
import recipe from '../resources/recipes/bar.json';
import { resources } from '@chartnexus/agent';
import modelIndex from '../resources/model-index.json';
import invalid from '../resources/recipes/unknown-field.json';
const entry = resolve('packages/mcp/bin/chartnexus-mcp.mjs');

describe('real MCP stdio connection', () => {
  test('negotiates, discovers resources and completes diagnose → repair → render → read', async () => {
    const client = new Client({
      name: 'chartnexus-integration-test',
      version: '0.1',
    });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [entry],
      stderr: 'pipe',
    });
    let stderr = '';
    transport.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    try {
      await client.connect(transport);
      expect((await client.listTools()).tools).toHaveLength(5);
      expect(
        (await client.callTool({ name: 'list_capabilities' }))
          .structuredContent,
      ).toMatchObject({
        ok: true,
        value: { agent: { transport: 'stdio', interactiveDisplay: false } },
      });
      expect(
        (
          await client.callTool({
            name: 'get_chart_schema',
            arguments: { mode: 'intent' },
          })
        ).structuredContent,
      ).toMatchObject({ ok: true });
      expect(
        (
          await client.callTool({
            name: 'get_chart_schema',
            arguments: { schemaVersion: '0.2', mode: 'intent' },
          })
        ).structuredContent,
      ).toMatchObject({
        ok: true,
        value: { $id: 'https://chartnexus.dev/schemas/chart-document/0.2' },
      });
      expect(
        await client.callTool({
          name: 'get_chart_schema',
          arguments: { schemaVersion: '0.2', mode: 'echarts' },
        }),
      ).toMatchObject({
        isError: true,
        structuredContent: {
          diagnostics: [{ code: 'UNSUPPORTED_CAPABILITY' }],
        },
      });
      expect(
        (await client.listResources()).resources.map((item) => item.uri).sort(),
      ).toEqual(resources.map((item) => item.uri).sort());
      const index = await client.readResource({
        uri: 'chartnexus://resources/index/0.1',
      });
      expect(index.contents[0]).toHaveProperty('text');
      const entry = await client.readResource({
        uri: 'chartnexus://resources/model-entry/zh-CN/0.1',
      });
      expect(entry.contents[0]).toMatchObject({
        mimeType: 'text/markdown',
        text: expect.stringContaining('模型与 Agent 入口'),
      });
      const retrieval = await client.readResource({
        uri: 'chartnexus://resources/retrieval/0.1',
      });
      const examples = await client.readResource({
        uri: 'chartnexus://resources/examples/0.1',
      });
      const examplesText = examples.contents[0];
      if (!examplesText || !('text' in examplesText))
        throw new Error('Expected synthetic example pairs.');
      expect(examplesText.text.trim().split('\n')).toHaveLength(22);
      const retrievalText = retrieval.contents[0];
      if (!retrievalText || !('text' in retrievalText))
        throw new Error('Expected retrieval JSONL text.');
      const records = retrievalText.text
        .trimEnd()
        .split('\n')
        .map((line: string) => JSON.parse(line));
      expect(
        records.map((item: { id: string; language: string }) => [
          item.id,
          item.language,
        ]),
      ).toEqual(modelIndex.entries.map((item) => [item.id, item.language]));
      for (const language of ['en', 'zh-CN']) {
        for (const id of [
          'product-boundary',
          'chart-catalog',
          'agent-guide',
          'getting-started',
          'genui-integrations',
          'llms-entry',
        ]) {
          expect(
            records.find(
              (item: { id: string; language: string }) =>
                item.id === id && item.language === language,
            ),
          ).toMatchObject({ body: expect.any(String), schemaVersion: '0.3' });
        }
      }
      expect(
        records.find(
          (item: { id: string }) => item.id === 'native-strict-schema',
        ),
      ).toMatchObject({ capabilityIds: ['native-strict-basic-0.1'] });
      expect(
        records.find(
          (item: { id: string }) => item.id === 'chart-document-0.2',
        ),
      ).toMatchObject({ schemaVersion: '0.2', capabilityIds: ['basic-0.2'] });
      const schema02 = await client.readResource({
        uri: 'chartnexus://schema/chart-document/0.2',
      });
      expect(schema02.contents[0]).toHaveProperty('text');
      const capabilities02 = await client.readResource({
        uri: 'chartnexus://capabilities/basic-0.2',
      });
      const cap = capabilities02.contents[0];
      if (!cap || !('text' in cap))
        throw new Error('Expected 0.2 capabilities.');
      expect(JSON.parse(cap.text)).toMatchObject({
        combo: { axes: ['shared', 'right'] },
        funnel: { conversionRate: 'not inferred' },
        heatmap: { range: 'explicit', aggregation: false },
        temporal: { kinds: ['date', 'instant'] },
        units: { kinds: ['currency', 'percent', 'unit'] },
        presentation: {
          dataLabels: { show: true },
          legend: { positions: ['top', 'bottom'] },
        },
      });
      expect(
        records.find(
          (item: { id: string; language: string }) =>
            item.id === 'model-entry' && item.language === 'zh-CN',
        ),
      ).toMatchObject({
        schemaVersion: '0.3',
        license: 'Apache-2.0',
        contentHash: expect.stringMatching(/^sha256:/),
        body: expect.stringContaining('模型与 Agent 入口'),
      });
      for (const uri of [
        'chartnexus://recipes/combo/0.2',
        'chartnexus://recipes/funnel/0.2',
        'chartnexus://recipes/heatmap/0.2',
        'chartnexus://recipes/chat-bar/0.2',
        'chartnexus://recipes/line/0.3',
        'chartnexus://recipes/pie/0.3',
        'chartnexus://recipes/scatter/0.3',
        'chartnexus://recipes/combo/0.3',
        'chartnexus://recipes/funnel/0.3',
        'chartnexus://recipes/heatmap/0.3',
      ]) {
        const recipeResource = await client.readResource({ uri });
        const value = recipeResource.contents[0];
        if (!value || !('text' in value))
          throw new Error('Expected recipe text.');
        const result = await client.callTool({
          name: 'validate_chart',
          arguments: { document: JSON.parse(value.text) },
        });
        expect(result.structuredContent).toMatchObject({
          ok: true,
          value: { profile: uri.endsWith('/0.3') ? 'basic-0.3' : 'basic-0.2' },
        });
      }
      const tasks = await client.readResource({
        uri: 'chartnexus://evaluation/tasks/0.1',
      });
      const tasksText = tasks.contents[0];
      if (!tasksText || !('text' in tasksText))
        throw new Error('Expected task corpus text.');
      expect(JSON.parse(tasksText.text).tasks).toHaveLength(20);
      const schema = await client.readResource({
        uri: 'chartnexus://schema/chart-document/0.1',
      });
      expect(schema.contents[0]).toHaveProperty('text');
      const validated02 = await client.callTool({
        name: 'validate_chart',
        arguments: {
          document: {
            ...recipe,
            schemaVersion: '0.2',
            chart: { ...recipe.chart, orientation: 'horizontal' },
            presentation: {
              dataLabels: { show: true },
              legend: { show: true, position: 'top' },
            },
          },
        },
      });
      expect(validated02.structuredContent).toMatchObject({
        ok: true,
        value: { profile: 'basic-0.2', validation: 'structure-and-semantics' },
      });
      const strictSchema = await client.readResource({
        uri: 'chartnexus://schema/native-strict-basic/0.1',
      });
      expect(strictSchema.contents[0]).toHaveProperty('text');
      const strictNative = {
        schemaVersion: '0.1',
        id: 'strict',
        mode: 'echarts',
        option: {
          xAxis: { type: 'category', data: ['A'] },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: [2] }],
        },
      };
      const strictResult = await client.callTool({
        name: 'validate_chart',
        arguments: {
          document: strictNative,
          nativeValidation: 'strict-basic-0.1',
        },
      });
      expect(strictResult.structuredContent).toMatchObject({
        ok: true,
        value: { validation: 'native-strict-basic-0.1' },
      });
      const rejectedStrict = await client.callTool({
        name: 'validate_chart',
        arguments: {
          document: {
            ...strictNative,
            option: {
              ...strictNative.option,
              series: [{ type: 'bar', data: [2], typo: true }],
            },
          },
          nativeValidation: 'strict-basic-0.1',
        },
      });
      expect(rejectedStrict.isError).toBe(true);
      const styled = await client.callTool({
        name: 'compile_chart',
        arguments: {
          document: {
            ...recipe,
            schemaVersion: '0.2',
            presentation: { detailLevel: 'detailed' },
          },
          chatPresentation: { theme: 'dark', background: 'transparent' },
        },
      });
      expect(styled.structuredContent).toMatchObject({
        ok: true,
        value: {
          option: {
            backgroundColor: 'transparent',
            series: [{ label: { show: true } }],
          },
        },
      });
      const nativeValidation = await client.callTool({
        name: 'validate_chart',
        arguments: {
          document: {
            schemaVersion: '0.1',
            id: 'native',
            mode: 'echarts',
            option: { series: [] },
          },
        },
      });
      expect(nativeValidation.structuredContent).toMatchObject({
        ok: true,
        value: { validation: 'guarded-native-partial' },
      });
      const failure = await client.callTool({
        name: 'validate_chart',
        arguments: { document: invalid },
      });
      expect(failure.isError).toBe(true);
      expect(failure.structuredContent).toMatchObject({
        ok: false,
        diagnostics: [{ code: 'UNKNOWN_FIELD' }],
      });
      expect(
        (
          await client.callTool({
            name: 'validate_chart',
            arguments: { document: recipe },
          })
        ).isError,
      ).not.toBe(true);
      expect(
        (
          await client.callTool({
            name: 'compile_chart',
            arguments: { document: recipe },
          })
        ).structuredContent,
      ).toMatchObject({ ok: true, value: { chartId: 'sales' } });
      const rendered = await client.callTool({
        name: 'render_chart',
        arguments: { document: recipe },
      });
      expect(rendered.isError).not.toBe(true);
      expect(JSON.stringify(rendered)).not.toContain('<svg');
      const content = rendered.content;
      if (!Array.isArray(content))
        throw new Error('Expected MCP content array.');
      const link = content.find((item) => item.type === 'resource_link');
      if (!link || typeof link.uri !== 'string')
        throw new Error('Expected resource link.');
      const svg = await client.readResource({ uri: link.uri });
      const first = svg.contents[0];
      if (!first || !('text' in first))
        throw new Error('Expected SVG text resource.');
      expect(first.text).toContain('<svg');
      expect(rendered.structuredContent).toMatchObject({
        value: {
          sha256: createHash('sha256').update(first.text).digest('hex'),
        },
      });
      expect(
        (await client.listResources()).resources.map((item) => item.uri).sort(),
      ).toEqual([...resources.map((item) => item.uri), link.uri].sort());
      const chatSvgResult = await client.callTool({
        name: 'render_chart',
        arguments: {
          document: {
            ...recipe,
            schemaVersion: '0.2',
            presentation: { detailLevel: 'detailed' },
          },
          chatPresentation: { theme: 'dark', background: 'transparent' },
        },
      });
      if (!Array.isArray(chatSvgResult.content))
        throw new Error('Expected MCP content array.');
      const chatLink = chatSvgResult.content.find(
        (item) => item.type === 'resource_link',
      );
      if (!chatLink || typeof chatLink.uri !== 'string')
        throw new Error('Expected chat SVG resource link.');
      const chatSvg = (await client.readResource({ uri: chatLink.uri }))
        .contents[0];
      if (!chatSvg || !('text' in chatSvg))
        throw new Error('Expected chat SVG text.');
      expect(chatSvg.text).toContain('fill="none"');
      expect(chatSvg.text).toContain('#f3f4f6');

      await expect(
        client.readResource({ uri: 'file:///etc/passwd' }),
      ).rejects.toThrow();
      expect((await client.callTool({ name: 'missing_tool' })).isError).toBe(
        true,
      );
      expect(
        (
          await client.callTool({
            name: 'render_chart',
            arguments: { document: recipe, output: '/tmp/no.svg' },
          })
        ).isError,
      ).toBe(true);
      expect(stderr).toBe('');
    } finally {
      await client.close();
    }
  }, 15000);
  test('bounds malformed transport input without echoing payload to stdout', async () => {
    const result = await new Promise<{ stdout: string; stderr: string }>(
      (resolveResult, reject) => {
        const child = spawn(process.execPath, [entry], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '',
          stderr = '';
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error('Transport failed to close.'));
        }, 8000);
        child.stdout.on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
        });
        child.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });
        child.on('error', reject);
        child.stdin.on('error', () => {});
        child.on('close', () => {
          clearTimeout(timer);
          resolveResult({ stdout, stderr });
        });
        child.stdin.end('x'.repeat(2_097_153));
      },
    );
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('MCP_TRANSPORT_ERROR');
  }, 10000);
});
