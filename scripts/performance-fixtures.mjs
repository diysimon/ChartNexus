import { readFile } from 'node:fs/promises';
import { createMapAsset } from '@chartnexus/echarts';
export async function boundaryFixtures() {
  const load = async (name) =>
    JSON.parse(await readFile(`resources/recipes/${name}.json`, 'utf8'));
  const radar = await load('radar-03');
  radar.chart.indicators = Array.from({ length: 8 }, (_, i) => ({
    field: `m${i}`,
    label: `M${i}`,
    min: 0,
    max: 100,
  }));
  radar.data = {
    kind: 'inline',
    fields: ['team', ...radar.chart.indicators.map((x) => x.field)],
    rows: Array.from({ length: 6 }, (_, i) => ({
      team: `team${i}`,
      ...Object.fromEntries(
        radar.chart.indicators.map((x, j) => [x.field, i + j]),
      ),
    })),
  };
  const tree = await load('tree-03');
  tree.chart.initialDepth = 0;
  tree.data.rows = Array.from({ length: 1000 }, (_, i) => ({
    id: `n${i}`,
    parent: i ? `n${Math.floor((i - 1) / 8)}` : null,
    label: `Node ${i}`,
  }));
  const sankey = await load('sankey-03');
  sankey.data.nodes.rows = Array.from({ length: 200 }, (_, i) => ({
    id: `n${i}`,
    label: `Node ${i}`,
  }));
  sankey.data.links.rows = [];
  for (let gap = 1; gap < 200 && sankey.data.links.rows.length < 1000; gap++)
    for (let i = 0; i + gap < 200 && sankey.data.links.rows.length < 1000; i++)
      sankey.data.links.rows.push({
        from: `n${i}`,
        to: `n${i + gap}`,
        weight: 1,
      });
  const map = await load('map-03');
  const features = Array.from({ length: 1000 }, (_, i) => {
    const x = -100 + (i % 50) * 0.1,
      y = 10 + Math.floor(i / 50) * 0.1;
    return {
      type: 'Feature',
      properties: { name: `R${i}` },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [x, y],
            [x + 0.05, y],
            [x + 0.05, y + 0.05],
            [x, y + 0.05],
            [x, y],
          ],
        ],
      },
    };
  });
  const asset = createMapAsset({
    id: 'performance-regions',
    revision: '1',
    license: 'Apache-2.0',
    provenance: 'Project authored synthetic squares; not real boundaries',
    coordinateSystem: 'WGS84',
    geoJSON: { type: 'FeatureCollection', features },
  });
  if (!asset.ok) throw new Error(JSON.stringify(asset));
  map.chart.mapRef = { id: asset.value.id, revision: '1' };
  map.data.rows = Array.from({ length: 1000 }, (_, i) => ({
    region: `R${i}`,
    value: i % 101,
  }));
  const native = {
    schemaVersion: '0.1',
    id: 'max-points',
    mode: 'echarts',
    option: {
      animation: false,
      xAxis: {
        type: 'category',
        data: Array.from({ length: 1000 }, (_, i) => String(i)),
      },
      yAxis: { type: 'value' },
      series: Array.from({ length: 50 }, () => ({
        type: 'line',
        data: Array.from({ length: 1000 }, (_, i) => i % 10),
      })),
    },
  };
  return [
    { name: 'radar-6-items-8-indicators', document: radar },
    { name: 'tree-1000-nodes', document: tree },
    { name: 'sankey-200-nodes-1000-links', document: sankey },
    {
      name: 'map-1000-regions',
      document: map,
      maps: { [asset.value.id]: asset.value },
    },
    { name: 'native-50-series-50000-points', document: native },
  ];
}
