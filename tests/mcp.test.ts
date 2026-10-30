import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { describe, expect, test } from 'vitest';
import recipe from '../resources/recipes/bar.json';
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
      expect((await client.listResources()).resources).toHaveLength(5);
      const schema = await client.readResource({
        uri: 'chartnexus://schema/chart-document/0.1',
      });
      expect(schema.contents[0]).toHaveProperty('text');
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
      expect((await client.listResources()).resources).toHaveLength(6);
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
