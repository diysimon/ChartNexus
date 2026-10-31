import {
  capabilities,
  capabilities02,
  nativeStrictCapabilities,
} from '@chartnexus/core';
import {
  chartDocumentSchema,
  chartDocument02Schema,
  nativeStrictBasicSchema,
} from '@chartnexus/schema';
import recipe from './recipes/bar.json' with { type: 'json' };
import invalidRecipe from './recipes/unknown-field.json' with { type: 'json' };
import diagnostics from './diagnostics.json' with { type: 'json' };
import modelIndex from './model-index.json' with { type: 'json' };
import retrieval from './model-retrieval.json' with { type: 'json' };
import evaluationTasks from './evaluation/tasks.json' with { type: 'json' };
import modelEntryEn from './model-entry-en.json' with { type: 'json' };
import modelEntryZh from './model-entry-zh-CN.json' with { type: 'json' };

export const resources = [
  {
    uri: 'chartnexus://capabilities/native-strict-basic-0.1',
    name: 'Strict native subset capabilities',
    mimeType: 'application/json',
    value: nativeStrictCapabilities,
  },
  {
    uri: 'chartnexus://schema/native-strict-basic/0.1',
    name: 'Strict native option subset schema',
    mimeType: 'application/json',
    value: nativeStrictBasicSchema,
  },
  {
    uri: 'chartnexus://capabilities/basic-0.2',
    name: 'Experimental 0.2 intent capabilities',
    mimeType: 'application/json',
    value: capabilities02,
  },
  {
    uri: 'chartnexus://schema/chart-document/0.2',
    name: 'Experimental ChartDocument 0.2 intent schema',
    mimeType: 'application/json',
    value: chartDocument02Schema,
  },
  {
    uri: 'chartnexus://resources/retrieval/0.1',
    name: 'Model retrieval corpus JSONL',
    mimeType: 'application/x-ndjson',
    value: retrieval.text,
  },
  {
    uri: 'chartnexus://evaluation/tasks/0.1',
    name: 'Public synthetic development tasks',
    mimeType: 'application/json',
    value: evaluationTasks,
  },
  {
    uri: 'chartnexus://resources/index/0.1',
    name: 'Model resources index',
    mimeType: 'application/json',
    value: modelIndex,
  },
  {
    uri: 'chartnexus://resources/model-entry/en/0.1',
    name: 'Model entry (English)',
    mimeType: 'text/markdown',
    value: modelEntryEn.text,
  },
  {
    uri: 'chartnexus://resources/model-entry/zh-CN/0.1',
    name: 'Model entry (中文)',
    mimeType: 'text/markdown',
    value: modelEntryZh.text,
  },
  {
    uri: 'chartnexus://capabilities/basic-0.1',
    name: 'Capabilities',
    mimeType: 'application/json',
    value: capabilities,
  },
  {
    uri: 'chartnexus://schema/chart-document/0.1',
    name: 'ChartDocument 0.1',
    mimeType: 'application/json',
    value: chartDocumentSchema,
  },
  {
    uri: 'chartnexus://recipes/bar',
    name: 'Synthetic sales bar chart',
    mimeType: 'application/json',
    value: recipe,
  },
  {
    uri: 'chartnexus://recipes/unknown-field',
    name: 'Unknown field repair example',
    mimeType: 'application/json',
    value: {
      document: invalidRecipe,
      expectedCode: 'UNKNOWN_FIELD',
      repair: { path: '/chart/encoding/y/field', value: 'revenue' },
    },
  },
  {
    uri: 'chartnexus://diagnostics/basic-0.1',
    name: 'Diagnostics and repairs / 诊断与修复',
    mimeType: 'application/json',
    value: diagnostics,
  },
];
export function readStaticResource(
  uri: string,
): { uri: string; mimeType: string; text: string } | undefined {
  const resource = resources.find((item) => item.uri === uri);
  return resource
    ? {
        uri,
        mimeType: resource.mimeType,
        text:
          typeof resource.value === 'string'
            ? resource.value
            : JSON.stringify(resource.value),
      }
    : undefined;
}
