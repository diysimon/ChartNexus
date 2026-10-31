import {
  failure,
  type ChartDocument,
  type ChartDocument02,
  type Result,
} from '@chartnexus/schema';
import { inspectJson, record } from './guard.js';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ErrorObject } from 'ajv';
import {
  chartDocumentSchema,
  chartDocument02Schema,
  chartDocument03Schema,
  projectChartSchema03,
  type ChartDocument03,
  type Diagnostic,
} from '@chartnexus/schema';
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile<ChartDocument>(chartDocumentSchema);
export const validate02 = ajv.compile<ChartDocument02>(chartDocument02Schema);

/** Include schema-owned constant/enum values to make model repair actionable. */
export function schema02Diagnostic(error: ErrorObject): Diagnostic {
  let message = error.message ?? 'Invalid document.';
  if (error.keyword === 'const' && Object.hasOwn(error.params, 'allowedValue'))
    message = `Expected ${JSON.stringify(error.params.allowedValue)}.`;
  if (error.keyword === 'enum' && Array.isArray(error.params.allowedValues))
    message = `Expected one of ${JSON.stringify(error.params.allowedValues)}.`;
  return {
    code: 'INVALID_SCHEMA',
    severity: 'error',
    path: error.instancePath,
    message,
    recoverable: true,
  };
}

export function validateChart01(input: unknown): Result<ChartDocument> {
  const json = inspectJson(input);
  if (!json.ok) return json;
  if (!validate(json.value))
    return {
      ok: false,
      diagnostics: (validate.errors ?? []).slice(0, 12).map((e) => ({
        code: 'INVALID_SCHEMA',
        severity: 'error',
        path: e.instancePath,
        message: e.message ?? 'Invalid document.',
        recoverable: true,
      })),
    };
  return { ok: true, value: json.value };
}

export function validateChart(
  input: unknown,
): Result<ChartDocument | ChartDocument02 | ChartDocument03> {
  const safe = inspectJson(input);
  if (!safe.ok) return safe;
  if (record(safe.value) && safe.value.schemaVersion === '0.3')
    return validateChart03(safe.value);
  if (!record(safe.value) || safe.value.schemaVersion !== '0.2')
    return validateChart01(safe.value);
  if (!validate02(safe.value))
    return {
      ok: false,
      diagnostics: (validate02.errors ?? [])
        .slice(0, 12)
        .map(schema02Diagnostic),
    };
  return { ok: true, value: safe.value };
}

/** Explicit, lossless conversion of 0.1 intent documents. Native option migration is not supported. */
export function migrateIntent01To02(input: unknown): Result<ChartDocument02> {
  const result = validateChart01(input);
  if (!result.ok) return result;
  if (result.value.mode !== 'intent')
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/mode',
      'Only 0.1 intent documents can be migrated.',
    );
  return { ok: true, value: { ...result.value, schemaVersion: '0.2' } };
}

const validate03 = ajv.compile<ChartDocument03>(chartDocument03Schema);
const projected03 = new Map(
  chartDocument03Schema.oneOf.map((branch) => {
    const type = branch.properties.chart.properties.type.const;
    return [type, ajv.compile<ChartDocument03>(projectChartSchema03(type)!)];
  }),
);
export function validateChart03(
  input: unknown,
  chartType?: string,
): Result<ChartDocument03> {
  const safe = inspectJson(input);
  if (!safe.ok) return safe;
  const check =
    chartType === undefined ? validate03 : projected03.get(chartType);
  if (!check)
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart/type',
      'Unknown chart branch.',
    );
  if (!check(safe.value)) {
    const selected =
      record(safe.value) &&
      record(safe.value.chart) &&
      typeof safe.value.chart.type === 'string'
        ? projected03.get(safe.value.chart.type)
        : undefined;
    if (selected && chartType === undefined) selected(safe.value);
    return {
      ok: false,
      diagnostics: (
        (chartType === undefined && selected
          ? selected.errors
          : check.errors) ?? []
      )
        .slice(0, 12)
        .map((error) => {
          const diagnostic = schema02Diagnostic(error);
          const field =
            error.params.additionalProperty ?? error.params.missingProperty;
          if (typeof field === 'string')
            diagnostic.path +=
              '/' + field.replaceAll('~', '~0').replaceAll('/', '~1');
          return diagnostic;
        }),
    };
  }
  return { ok: true, value: safe.value };
}
