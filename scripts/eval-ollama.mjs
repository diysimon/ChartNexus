import { readFile, mkdir, writeFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { evaluate } from './evaluate.mjs';
import { compileChart } from '@chartnexus/core';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const corpusText = await read('resources/evaluation/tasks.json');
const schemaText = await read('packages/schema/src/chart-document.schema.json');
const capabilitiesText = await read('packages/core/src/capabilities.json');
const corpus = JSON.parse(corpusText);
const hash = (text) => createHash('sha256').update(text).digest('hex');
const allowed = new Set(['list_capabilities', 'validate_chart']);
const system =
  'You are a chart generation assistant. Use only the supported ChartDocument 0.1 contract and capability profile provided below. Never invent fields, coerce data, aggregate, execute code or request external URLs. Use validate_chart on a complete document before returning. For diagnostic tasks call validate_chart with inputDocument and return JSON containing diagnosticCode and diagnosticPath. For chart tasks return only the complete ChartDocument JSON object. No Markdown, no explanations.\nSCHEMA:\n' +
  schemaText +
  '\nCAPABILITIES:\n' +
  capabilitiesText;

export function buildTaskMessage(task) {
  const input = { taskId: task.id, request: task.prompt.en };
  if (task.previousDocument) input.previousDocument = task.previousDocument;
  if (task.inputDocument) input.inputDocument = task.inputDocument;
  // Only task data, never reference charts, expected assertions or answer JSON.
  if (!task.inputDocument && !task.previousDocument && task.reference?.data)
    input.sourceData = task.reference.data;
  return JSON.stringify(input);
}
export function parseCandidate(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > 1_048_576)
    throw new Error('MODEL_OUTPUT_LIMIT');
  const value = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('MODEL_OUTPUT_NOT_OBJECT');
  return value;
}
export function parseModelOutput(text) {
  try {
    return { candidate: parseCandidate(text), formatRepair: null };
  } catch (error) {
    if (!(error instanceof SyntaxError) || typeof text !== 'string')
      throw error;
    // Accept only one complete fenced JSON block; do not extract or execute code.
    const match = /^\s*```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```\s*$/i.exec(
      text,
    );
    if (!match) throw error;
    return {
      candidate: parseCandidate(match[1]),
      formatRepair: 'markdown-json-fence',
    };
  }
}
export function validateToolCall(call) {
  const name = call?.function?.name;
  const args = call?.function?.arguments;
  if (typeof name !== 'string' || !allowed.has(name))
    return { ok: false, code: 'TOOL_NOT_ALLOWED' };
  if (
    !args ||
    typeof args !== 'object' ||
    Array.isArray(args) ||
    Buffer.byteLength(JSON.stringify(args)) > 1_048_576
  )
    return { ok: false, code: 'INVALID_TOOL_ARGUMENTS' };
  return { ok: true, name, args };
}
export async function runTask({
  task,
  chat,
  callTool,
  tools,
  maxToolRounds = 3,
}) {
  const user = buildTaskMessage(task);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  const toolCalls = [];
  let inputTokens = 0,
    outputTokens = 0,
    usageAvailable = true;
  let sawUsage = false;
  let lastOutput = '',
    finishReason = null;
  try {
    for (let round = 0; round <= maxToolRounds; round++) {
      const response = await chat(messages, tools);
      if (
        typeof response.prompt_eval_count === 'number' &&
        typeof response.eval_count === 'number'
      ) {
        sawUsage = true;
        inputTokens += response.prompt_eval_count;
        outputTokens += response.eval_count;
      } else {
        usageAvailable = false;
      }
      finishReason = response.done_reason ?? null;
      const message = response.message;
      if (!message || typeof message !== 'object')
        throw new Error('INVALID_MODEL_RESPONSE');
      lastOutput = typeof message.content === 'string' ? message.content : '';
      const calls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
      if (!calls.length)
        return {
          ...parseModelOutput(lastOutput),
          rawOutput: lastOutput,
          promptHash: hash(system + '\n' + user),
          toolCalls,
          usage:
            usageAvailable && sawUsage ? { inputTokens, outputTokens } : null,
          finishReason,
        };
      if (round === maxToolRounds) throw new Error('TOOL_ROUND_LIMIT');
      if (calls.length > 4) throw new Error('TOOL_CALL_LIMIT');
      messages.push(message);
      for (const call of calls) {
        const checked = validateToolCall(call);
        let result;
        if (checked.ok) result = await callTool(checked.name, checked.args);
        else result = { isError: true, code: checked.code };
        const diagnostics = Array.isArray(result.structuredContent?.diagnostics)
          ? result.structuredContent.diagnostics
              .map((item) => item.code)
              .filter((code) => typeof code === 'string')
              .slice(0, 12)
          : [];
        toolCalls.push({
          name: checked.ok ? checked.name : 'rejected',
          ok: !result.isError,
          ...(diagnostics.length ? { diagnostics } : {}),
        });
        messages.push({ role: 'tool', content: JSON.stringify(result) });
      }
    }
    throw new Error('TOOL_ROUND_LIMIT');
  } catch (error) {
    if (error instanceof Error)
      error.pilotTrace = {
        rawOutput: lastOutput.slice(0, 1_048_576),
        promptHash: hash(system + '\n' + user),
        toolCalls,
        usage:
          usageAvailable && sawUsage ? { inputTokens, outputTokens } : null,
        finishReason,
      };
    throw error;
  }
}
export async function renderCandidate(client, candidate) {
  const validated = compileChart(candidate);
  if (!validated.ok) return { status: 'skipped-invalid' };
  try {
    const result = await client.callTool({
      name: 'render_chart',
      arguments: { document: candidate },
    });
    if (result.isError)
      return { status: 'failed', reason: 'RENDER_TOOL_ERROR' };
    const link = result.content?.find((item) => item.type === 'resource_link');
    const metadata = result.structuredContent?.value;
    if (
      !link ||
      typeof link.uri !== 'string' ||
      !link.uri.startsWith('chartnexus://artifacts/') ||
      typeof metadata?.sha256 !== 'string'
    )
      return { status: 'failed', reason: 'INVALID_ARTIFACT_METADATA' };
    const resource = await client.readResource({ uri: link.uri });
    const content = resource.contents?.[0];
    if (
      !content ||
      typeof content.text !== 'string' ||
      !content.text.includes('<svg') ||
      hash(content.text) !== metadata.sha256
    )
      return { status: 'failed', reason: 'ARTIFACT_CHECK_FAILED' };
    return {
      status: 'verified',
      sha256: metadata.sha256,
      bytes: Buffer.byteLength(content.text, 'utf8'),
    };
  } catch {
    return { status: 'failed', reason: 'ARTIFACT_READ_FAILED' };
  }
}
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i],
      value = args[i + 1];
    if (
      !['--model', '--tasks', '--output'].includes(key) ||
      !value ||
      Object.hasOwn(options, key)
    )
      throw new Error(
        'Usage: node scripts/eval-ollama.mjs --model MODEL --tasks ID,ID --output NAME.json',
      );
    options[key] = value;
  }
  const model = options['--model'],
    output = options['--output'];
  if (
    !model ||
    !/^[a-zA-Z0-9._:/-]{1,128}$/.test(model) ||
    !output ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}\.json$/.test(output) ||
    !options['--tasks']
  )
    throw new Error('Provide valid --model, --tasks, and --output filename.');
  const ids = options['--tasks'].split(',');
  if (!ids.length || ids.length > 20 || new Set(ids).size !== ids.length)
    throw new Error('Choose 1–20 distinct task IDs.');
  const tasks = ids.map((id) => {
    const task = corpus.tasks.find((item) => item.id === id);
    if (!task) throw new Error(`Unknown task ID: ${id}`);
    return task;
  });
  await mkdir(resolve('outputs'), { recursive: true });
  const path = resolve('outputs', output);
  try {
    await lstat(path);
    throw new Error('OUTPUT_EXISTS');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const chat = async (messages, tools) => {
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        tools,
        stream: false,
        think: false,
        options: { temperature: 0, seed: 42, num_predict: 2048 },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}`);
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > 2_097_152) throw new Error('OLLAMA_RESPONSE_LIMIT');
    const body = await response.text();
    if (Buffer.byteLength(body, 'utf8') > 2_097_152)
      throw new Error('OLLAMA_RESPONSE_LIMIT');
    return JSON.parse(body);
  };
  let modelDigest = null;
  let ollamaVersion = null;
  try {
    const [tagsResponse, versionResponse] = await Promise.all([
      fetch('http://127.0.0.1:11434/api/tags', {
        signal: AbortSignal.timeout(5000),
      }),
      fetch('http://127.0.0.1:11434/api/version', {
        signal: AbortSignal.timeout(5000),
      }),
    ]);
    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      const found = tags.models?.find(
        (item) => item.name === model || item.model === model,
      );
      if (typeof found?.digest === 'string') modelDigest = found.digest;
    }
    if (versionResponse.ok) {
      const info = await versionResponse.json();
      if (typeof info.version === 'string') ollamaVersion = info.version;
    }
  } catch {
    /* The inference call reports service failures per task. */
  }
  const client = new Client({
    name: 'chartnexus-model-eval',
    version: '0.1.0',
  });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve('packages/mcp/bin/chartnexus-mcp.mjs')],
    stderr: 'pipe',
  });
  const candidates = {},
    runs = [];
  let discovered = [];
  let serverVersion = null;
  let toolSchemasSha256 = null;
  const startedAt = new Date().toISOString();
  try {
    await client.connect(transport);
    serverVersion = client.getServerVersion() ?? null;
    const listed = await client.listTools();
    discovered = listed.tools
      .filter((tool) => allowed.has(tool.name))
      .map((tool) => tool.name);
    if (discovered.length !== allowed.size)
      throw new Error('MCP_TOOLS_UNAVAILABLE');
    const tools = listed.tools
      .filter((tool) => allowed.has(tool.name))
      .map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
    toolSchemasSha256 = hash(JSON.stringify(tools));
    for (const task of tasks) {
      const start = performance.now();
      try {
        const result = await runTask({
          task,
          chat,
          tools,
          callTool: (name, args) => client.callTool({ name, arguments: args }),
        });
        candidates[task.id] = result.candidate;
        const render =
          task.expected.result === 'compile'
            ? await renderCandidate(client, result.candidate)
            : { status: 'not-applicable' };
        runs.push({
          id: task.id,
          status: 'model-returned',
          durationMs: Math.round(performance.now() - start),
          render,
          ...result,
        });
      } catch (error) {
        runs.push({
          id: task.id,
          status: 'error',
          durationMs: Math.round(performance.now() - start),
          ...(error && typeof error === 'object' && 'pilotTrace' in error
            ? { trace: error.pilotTrace }
            : {}),
          error:
            error instanceof SyntaxError
              ? 'INVALID_JSON'
              : String(error.message ?? 'MODEL_ERROR').slice(0, 120),
        });
      }
      process.stderr.write(
        `Completed ${runs.length}/${tasks.length}: ${task.id}\n`,
      );
    }
  } finally {
    await client.close();
  }
  const score = evaluate(candidates);
  const selected = score.results.filter((item) => ids.includes(item.id));
  const record = {
    version: '0.1',
    kind: 'local-model-pilot',
    startedAt,
    provider: 'ollama-localhost',
    model,
    modelDigest,
    ollamaVersion,
    nodeVersion: process.version,
    options: {
      temperature: 0,
      seed: 42,
      num_predict: 2048,
      maxToolRounds: 3,
      timeoutMs: 120000,
      formatRepair: 'one-whole-markdown-json-fence',
    },
    taskIds: ids,
    corpusVersion: corpus.version,
    corpusSha256: hash(corpusText),
    schemaSha256: hash(schemaText),
    capabilitiesSha256: hash(capabilitiesText),
    modelSystemPromptSha256: hash(system),
    mcp: { transport: 'stdio', discovered, serverVersion, toolSchemasSha256 },
    results: runs,
    score: {
      passed: selected.filter((item) => item.passed).length,
      total: selected.length,
      results: selected,
    },
    limitations: [
      'public synthetic development tasks',
      'not a held-out benchmark',
      'no desktop MCP client',
      'single run per task',
    ],
  };
  await writeFile(path, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  process.stdout.write(
    JSON.stringify({
      output: path,
      model,
      score: record.score,
      mcp: record.mcp,
      taskCount: runs.length,
    }) + '\n',
  );
  if (
    record.score.passed !== record.score.total ||
    runs.some((item) => item.render?.status === 'failed')
  )
    process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    process.stderr.write(
      `Pilot error: ${String(error.message ?? 'unknown').slice(0, 120)}\n`,
    );
    process.exitCode = 2;
  });
