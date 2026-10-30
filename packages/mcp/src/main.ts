#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createChartNexusServer } from './index.js';
const server = createChartNexusServer();
const transport = new StdioServerTransport(process.stdin, process.stdout, {
  maxBufferSize: 2_097_152,
});
server.onerror = () => {
  process.stderr.write('MCP_TRANSPORT_ERROR\n');
};
const shutdown = () => {
  void server.close().catch(() => {
    process.exitCode = 1;
  });
};
process.stdin.once('end', shutdown);
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
try {
  await server.connect(transport);
} catch {
  process.stderr.write('MCP_START_FAILED\n');
  process.exitCode = 1;
}
