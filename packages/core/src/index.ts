import capabilityManifest from './capabilities.json' with { type: 'json' };
import capability02Manifest from './capabilities-0.2.json' with { type: 'json' };
import nativeStrictManifest from './native-strict-capabilities.json' with { type: 'json' };
import {
  type DataRegistry,
  type MapCatalog,
  type RenderPlan,
  type Result,
} from '@chartnexus/schema';
import { record, inspectJson } from './guard.js';
import { compileChart02 } from './compile-02.js';
import { compileChart03 } from './compile-03.js';
export { limits, inspectJson } from './guard.js';
export { validateChart, migrateIntent01To02 } from './validation.js';
export const capabilities = Object.freeze(capabilityManifest);
export const capabilities02 = Object.freeze(capability02Manifest);
export const nativeStrictCapabilities = Object.freeze(nativeStrictManifest);
export function compileChart(
  input: unknown,
  registry: DataRegistry = {},
  maps: MapCatalog = {},
): Result<RenderPlan> {
  const safe = inspectJson(input);
  if (!safe.ok) return safe;
  return record(safe.value) && safe.value.schemaVersion === '0.3'
    ? compileChart03(safe.value, registry, maps)
    : compileChart02(safe.value, registry);
}
export { validateNativeStrict } from './native-strict.js';
export { compileChatChart } from './chat-presentation.js';
export type {
  ChatPresentationSettings,
  ChatRenderPlan,
} from './chat-presentation.js';

export { migrateIntentTo03 } from './compile-03.js';
export { validateChart03 } from './validation.js';
import capability03Manifest from './capabilities-0.3.json' with { type: 'json' };
export const capabilities03 = Object.freeze(capability03Manifest);

export {
  resolvePresentation,
  describeChart,
  themeTokens,
  type PresentationContext,
} from './presentation.js';
