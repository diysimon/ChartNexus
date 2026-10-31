import example03 from './input-example-03.json' with { type: 'json' };
import {
  chartDocument02Schema,
  chartDocument03Schema,
} from '@chartnexus/schema';
import example from './input-example.json' with { type: 'json' };

export interface ChartInputProfile {
  chatPresentation?: boolean;
  schemaVersion?: '0.2' | '0.3';
  orderedUpdates?: boolean;
}

/** Model guidance for the host's enabled profile; never enables new capabilities. */
export function getChartInputContract(profile: ChartInputProfile = {}) {
  const version = profile.schemaVersion ?? '0.2';
  const documentExample = structuredClone(
    version === '0.3' ? example03 : example,
  );
  const inputExample = profile.orderedUpdates
    ? {
        operationId: 'host-example-1',
        baseRevision: 0,
        complete: true,
        document: documentExample,
      }
    : documentExample;
  const description = [
    `Render a ChartNexus chart. Recommend schemaVersion ${version} and mode intent. Keep the chart id stable during updates. 0.3 implements eleven bounded chart types; map requires a trusted host MapRegistry. Use 0.3 for radar, tree, sankey and map.`,
    profile.chatPresentation
      ? 'This chat host accepts only intent with schemaVersion 0.2 or 0.3.'
      : 'This non-chat host also accepts schemaVersion 0.1 with mode intent or echarts.',
    profile.orderedUpdates
      ? 'Pass a JSON-encoded operation envelope. The host supplies operationId and baseRevision from its current runtime; never invent or reuse the illustrative values. complete:true requires a complete document; complete:false must omit document.'
      : 'Pass the complete ChartDocument as a JSON string, never JavaScript or partial JSON.',
    `Illustrative complete input: ${JSON.stringify(inputExample)}`,
  ].join(' ');
  return {
    recommendedSchemaVersion: version,
    schemaUri: `chartnexus://schema/chart-document/${version}`,
    recipeUri: `chartnexus://recipes/chat-bar/${version}`,
    // Describes the document, including when it is nested inside an operation.
    documentSchema: structuredClone(
      version === '0.3' ? chartDocument03Schema : chartDocument02Schema,
    ),
    acceptedProfiles: profile.chatPresentation
      ? [
          { schemaVersion: '0.3', mode: 'intent' },
          { schemaVersion: '0.2', mode: 'intent' },
        ]
      : [
          { schemaVersion: '0.3', mode: 'intent' },
          { schemaVersion: '0.2', mode: 'intent' },
          { schemaVersion: '0.1', mode: 'intent' },
          { schemaVersion: '0.1', mode: 'echarts' },
        ],
    hostOwnedFields: profile.orderedUpdates
      ? ['operationId', 'baseRevision']
      : [],
    documentExample,
    inputExample,
    description,
  };
}
