import { Buffer } from 'node:buffer';
import { Ajv2020 } from 'ajv/dist/2020.js';
import {
  capabilities,
  capabilities02,
  nativeStrictCapabilities,
  validateNativeStrict,
  compileChart,
  inspectJson,
} from '@chartnexus/core';
import {
  chartDocumentSchema,
  failure,
  type DataRegistry,
  type Result,
} from '@chartnexus/schema';
import definitions from './tools.json' with { type: 'json' };
import { createRenderer } from './renderer.js';
export { createRenderer } from './renderer.js';
export { resources, readStaticResource } from './resources.js';

export const tools = definitions.map((definition) => ({
  ...definition,
  inputSchema: { ...definition.inputSchema, type: 'object' as const },
}));
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validators = new Map(
  tools.map((tool) => [tool.name, ajv.compile(tool.inputSchema)]),
);
export function getChartSchema(mode?: 'intent' | 'echarts') {
  const schema = structuredClone(chartDocumentSchema);
  if (mode) {
    schema.oneOf = schema.oneOf.filter(
      (variant) => variant.properties.mode.const === mode,
    );
    schema.$id = `${schema.$id}/${mode}`;
  }
  return schema;
}
export interface AgentService {
  execute(
    name: string,
    args?: unknown,
    signal?: AbortSignal,
  ): Promise<Result<unknown>>;
}
/** Node-only orchestration: no model credentials, file paths or outbound requests. */
export function createAgentService(
  settings: {
    registry?: DataRegistry;
    timeoutMs?: number;
    concurrency?: number;
  } = {},
): AgentService {
  const render = createRenderer(settings);
  const registry = settings.registry ?? {};
  return {
    async execute(name, args = {}, signal) {
      const validate = validators.get(name);
      if (!validate)
        return failure('UNKNOWN_TOOL', '', 'Unknown ChartNexus tool.');
      const json = inspectJson(args);
      if (!json.ok) return json;
      if (
        !validate(json.value) ||
        json.value === null ||
        typeof json.value !== 'object' ||
        Array.isArray(json.value)
      )
        return failure(
          'INVALID_ARGUMENTS',
          '',
          'Arguments do not match the tool input schema.',
        );
      if (signal?.aborted)
        return failure('CANCELLED', '', 'Request was cancelled.');
      const input = json.value;
      if (name === 'list_capabilities')
        return {
          ok: true,
          value: {
            ...capabilities,
            additionalProfiles: [capabilities02, nativeStrictCapabilities],
            agent: {
              transport: 'stdio',
              staticSvg: true,
              interactiveDisplay: false,
              toolInputBytes: 1048576,
              renderTimeoutMs: settings.timeoutMs ?? 5000,
              renderConcurrency: settings.concurrency ?? 2,
            },
          },
        };
      if (name === 'get_chart_schema')
        return {
          ok: true,
          value: getChartSchema(
            input.mode === 'intent' || input.mode === 'echarts'
              ? input.mode
              : undefined,
          ),
        };
      if (name === 'render_chart') {
        const width = typeof input.width === 'number' ? input.width : 800;
        const height = typeof input.height === 'number' ? input.height : 480;
        const result = await render(
          input.document,
          width,
          height,
          registry,
          signal,
        );
        return result.ok
          ? {
              ok: true,
              value: {
                mimeType: 'image/svg+xml',
                width,
                height,
                svg: result.value,
              },
            }
          : result;
      }
      if (
        name === 'validate_chart' &&
        input.nativeValidation === 'strict-basic-0.1'
      ) {
        const strict = validateNativeStrict(input.document);
        if (!strict.ok) return strict;
      }
      const result = compileChart(input.document, registry);
      if (!result.ok) return result;
      if (name === 'validate_chart')
        return {
          ok: true,
          value: {
            valid: true,
            chartId: result.value.chartId,
            profile: result.value.profile,
            dataRevision: result.value.dataRevision,
            validation:
              input.nativeValidation === 'strict-basic-0.1'
                ? 'native-strict-basic-0.1'
                : input.document !== null &&
                    typeof input.document === 'object' &&
                    !Array.isArray(input.document) &&
                    input.document.mode === 'echarts'
                  ? 'guarded-native-partial'
                  : 'structure-and-semantics',
          },
        };
      if (Buffer.byteLength(JSON.stringify(result.value), 'utf8') > 4_194_304)
        return failure(
          'RESOURCE_LIMIT',
          '',
          'Compiled output exceeds the 4 MiB budget.',
        );
      return result;
    },
  };
}
