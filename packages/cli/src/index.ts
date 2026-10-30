import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import type { Readable, Writable } from 'node:stream';
import { createAgentService } from '@chartnexus/agent';
import { failure } from '@chartnexus/schema';

const commands: Record<string, string> = {
  capabilities: 'list_capabilities',
  schema: 'get_chart_schema',
  validate: 'validate_chart',
  compile: 'compile_chart',
  render: 'render_chart',
};
class CliError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
async function readJson(stream: Readable): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    bytes += buffer.length;
    if (bytes > 1_048_576)
      throw new CliError('RESOURCE_LIMIT', 1, 'CLI input exceeds 1 MiB.');
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new CliError(
      'INVALID_JSON',
      1,
      'Expected one complete JSON document.',
    );
  }
}
export async function runCli(
  argv: string[],
  io: { stdin: Readable; stdout: Writable; stderr: Writable },
): Promise<number> {
  const send = (value: unknown) => {
    io.stdout.write(`${JSON.stringify(value)}\n`);
  };
  try {
    if (argv.length === 1 && argv[0] === '--help') {
      send({
        commands: Object.keys(commands),
        usage:
          'chartnexus <command> [file|-] [--mode intent|echarts] [--width N --height N] [--output path]',
        exitCodes: { success: 0, invalidInput: 1, usageOrIo: 2 },
      });
      return 0;
    }
    const command = argv[0];
    const tool =
      command && Object.hasOwn(commands, command)
        ? commands[command]
        : undefined;
    if (!tool)
      throw new CliError(
        'USAGE',
        2,
        'Expected capabilities, schema, validate, compile, or render.',
      );
    const args: Record<string, unknown> = {};
    let inputPath: string | undefined;
    let outputPath: string | undefined;
    const seen = new Set<string>();
    for (let i = 1; i < argv.length; i++) {
      const flag = argv[i];
      if (!flag) continue;
      if (flag.startsWith('--')) {
        if (
          !['--mode', '--width', '--height', '--output'].includes(flag) ||
          seen.has(flag)
        )
          throw new CliError('USAGE', 2, 'Unknown or repeated option.');
        seen.add(flag);
        const value = argv[++i];
        if (!value || value.startsWith('--'))
          throw new CliError('USAGE', 2, 'Option requires a value.');
        if (flag === '--mode') {
          if (command !== 'schema' || !['intent', 'echarts'].includes(value))
            throw new CliError(
              'USAGE',
              2,
              '--mode applies to schema and must be intent or echarts.',
            );
          args.mode = value;
        } else {
          if (command !== 'render')
            throw new CliError(
              'USAGE',
              2,
              'Render options apply only to render.',
            );
          if (flag === '--output') outputPath = value;
          else {
            const number = Number(value);
            if (!Number.isInteger(number))
              throw new CliError('USAGE', 2, 'Dimensions must be integers.');
            args[flag.slice(2)] = number;
          }
        }
      } else {
        if (
          (flag.startsWith('-') && flag !== '-') ||
          inputPath !== undefined ||
          command === 'capabilities' ||
          command === 'schema'
        )
          throw new CliError('USAGE', 2, 'Unexpected positional argument.');
        inputPath = flag;
      }
    }
    if (command !== 'capabilities' && command !== 'schema')
      args.document = await readJson(
        inputPath && inputPath !== '-' ? createReadStream(inputPath) : io.stdin,
      );
    const result = await createAgentService().execute(tool, args);
    if (!result.ok) {
      send(result);
      return 1;
    }
    if (outputPath) {
      const value = result.value;
      if (
        typeof value !== 'object' ||
        value === null ||
        !('svg' in value) ||
        typeof value.svg !== 'string'
      )
        throw new CliError('INTERNAL_ERROR', 2, 'Renderer did not return SVG.');
      await writeFile(outputPath, value.svg, { flag: 'wx', encoding: 'utf8' });
      send({
        ok: true,
        value: {
          output: outputPath,
          mimeType: 'image/svg+xml',
          bytes: Buffer.byteLength(value.svg),
        },
      });
    } else send(result);
    return 0;
  } catch (error) {
    const known = error instanceof CliError;
    const code = known ? error.code : 'IO_ERROR';
    send(
      failure(
        code,
        '',
        known
          ? error.message
          : 'Could not read input or exclusively create output.',
      ),
    );
    io.stderr.write(`${code}\n`);
    return known ? error.status : 2;
  }
}
