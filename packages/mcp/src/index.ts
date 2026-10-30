import { Buffer } from 'node:buffer';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import {
  createAgentService,
  tools,
  resources,
  readStaticResource,
} from '@chartnexus/agent';
import { failure, type DataRegistry } from '@chartnexus/schema';
import { ArtifactStore } from './artifacts.js';
export { ArtifactStore } from './artifacts.js';

export function createChartNexusServer(
  settings: { registry?: DataRegistry } = {},
): Server {
  const server = new Server(
    { name: 'chartnexus', version: '0.0.1-alpha.0' },
    {
      capabilities: { tools: {}, resources: {} },
      instructions:
        'Discover capabilities, then fetch the chart schema. Validate data semantics before rendering. Render returns a temporary static SVG resource, not an interactive UI. No filesystem or network tools.',
    },
  );
  const service = createAgentService(settings);
  const artifacts = new ArtifactStore();
  server.onclose = () => artifacts.clear();
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: tools.map((tool) => ({
      ...tool,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: tool.name !== 'render_chart',
        openWorldHint: false,
      },
    })),
  }));
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request, extra): Promise<CallToolResult> => {
      try {
        const result = await service.execute(
          request.params.name,
          request.params.arguments ?? {},
          extra.signal,
        );
        if (!result.ok)
          return {
            isError: true,
            content: [{ type: 'text', text: JSON.stringify(result) }],
            structuredContent: result,
          };
        if (request.params.name === 'render_chart') {
          const value = result.value;
          if (
            typeof value !== 'object' ||
            value === null ||
            !('svg' in value) ||
            typeof value.svg !== 'string'
          )
            throw new Error('Invalid render result.');
          // Keep escaped resource responses below the SDK default 10 MiB read buffer.
          if (
            Buffer.byteLength(JSON.stringify(value.svg), 'utf8') > 8_388_608
          ) {
            const error = failure(
              'RESOURCE_LIMIT',
              '',
              'Encoded SVG resource exceeds the 8 MiB wire budget.',
            );
            return {
              isError: true,
              content: [{ type: 'text', text: JSON.stringify(error) }],
              structuredContent: error,
            };
          }
          const cached = artifacts.put(value.svg);
          const artifact = {
            uri: cached.uri,
            name: cached.name,
            mimeType: cached.mimeType,
            bytes: cached.bytes,
            sha256: cached.sha256,
            expiresAt: cached.expiresAt,
          };
          const metadata = { ok: true, value: artifact };
          return {
            content: [
              { type: 'text', text: JSON.stringify(metadata) },
              {
                type: 'resource_link',
                uri: artifact.uri,
                name: artifact.name,
                mimeType: artifact.mimeType,
                size: artifact.bytes,
                description:
                  'Session-local static SVG; expires in ten minutes or on cache eviction.',
              },
            ],
            structuredContent: metadata,
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        };
      } catch {
        const result = failure(
          'INTERNAL_ERROR',
          '',
          'Tool execution failed without exposing internal details.',
        );
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        };
      }
    },
  );
  server.setRequestHandler(ListResourcesRequestSchema, () => ({
    resources: [
      ...resources.map(({ value: _value, ...resource }) => resource),
      ...artifacts
        .list()
        .map(
          ({
            text: _text,
            bytes,
            sha256: _hash,
            expiresAt: _expires,
            ...resource
          }) => ({ ...resource, size: bytes }),
        ),
    ],
  }));
  server.setRequestHandler(ReadResourceRequestSchema, (request) => {
    const resource =
      readStaticResource(request.params.uri) ??
      artifacts.get(request.params.uri);
    if (!resource)
      throw new McpError(
        -32002,
        'Resource is unavailable, expired, or belongs to another session.',
      );
    return {
      contents: [
        { uri: resource.uri, mimeType: resource.mimeType, text: resource.text },
      ],
    };
  });
  return server;
}
