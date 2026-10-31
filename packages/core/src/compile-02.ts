import {
  failure,
  type DataRegistry,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { inspectJson, record } from './guard.js';
import { validate02, schema02Diagnostic } from './validation.js';
import { compileChart01 } from './legacy.js';
import { compileHeatmap } from './chart-heatmap.js';
import { compileFunnel } from './chart-funnel.js';
import { compileCombo } from './chart-combo.js';
import { compileTransformed } from './transforms.js';
/** Dispatch by version; 0.1 retains its established behavior. */
export function compileChart02(
  input: unknown,
  registry: DataRegistry = {},
): Result<RenderPlan> {
  const safe = inspectJson(input);
  if (!safe.ok) return safe;
  if (!record(safe.value) || safe.value.schemaVersion !== '0.2')
    return compileChart01(safe.value, registry);
  if (!validate02(safe.value))
    return {
      ok: false,
      diagnostics: (validate02.errors ?? [])
        .slice(0, 12)
        .map(schema02Diagnostic),
    };
  const doc = safe.value;
  if (doc.chart.type === 'heatmap')
    return compileHeatmap(doc, registry, compileChart02);
  if (doc.chart.heatmap !== undefined)
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart/heatmap',
      'Heatmap settings require a heatmap chart.',
    );
  if (doc.chart.type === 'funnel')
    return compileFunnel(doc, registry, compileChart02);
  if (doc.chart.type === 'combo')
    return compileCombo(doc, registry, compileChart02);
  if (doc.chart.secondary !== undefined)
    return failure(
      'UNSUPPORTED_CAPABILITY',
      '/chart/secondary',
      'Secondary measures are available only for combo charts.',
    );
  return compileTransformed(doc, registry);
}
