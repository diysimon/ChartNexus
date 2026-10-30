import { capabilities } from '@chartnexus/core';
import { chartDocumentSchema } from '@chartnexus/schema';
import recipe from './recipes/bar.json' with { type: 'json' };
import invalidRecipe from './recipes/unknown-field.json' with { type: 'json' };
import diagnostics from './diagnostics.json' with { type: 'json' };

export const resources = [
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
    ? { uri, mimeType: resource.mimeType, text: JSON.stringify(resource.value) }
    : undefined;
}
