import * as echarts from 'echarts';
import {
  mountChart,
  type ChartRuntime,
  type ChatPresentationSettings,
} from '@chartnexus/runtime';
import { createMapAsset, mapRegistrationStats } from '@chartnexus/echarts';
import radar from '../../resources/recipes/radar-03.json';
import tree from '../../resources/recipes/tree-03.json';
import sankey from '../../resources/recipes/sankey-03.json';
import map from '../../resources/recipes/map-03.json';
import assetInput from '../maps/two-regions.json';
const recipes = { radar, tree, sankey, map };
const container = document.querySelector<HTMLElement>('#chart')!;
const source = document.querySelector<HTMLTextAreaElement>('#source')!;
const prepared = createMapAsset(assetInput);
if (!prepared.ok) throw new Error('Invalid authored map');
const maps = { [prepared.value.id]: prepared.value };
let runtime: ChartRuntime | undefined;
const read = (id: string) =>
  document.querySelector<HTMLSelectElement>('#' + id)!.value;
function mount() {
  runtime?.dispose();
  const theme = read('theme') === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('dark', theme === 'dark');
  const detailLevel = read('level') as NonNullable<
    ChatPresentationSettings['detailLevel']
  >;
  const result = mountChart(
    container,
    (event) => {
      document.querySelector('#event')!.textContent = JSON.stringify(
        event,
        null,
        2,
      );
    },
    { maps, chatPresentation: { theme, detailLevel } },
  );
  if (!result.ok) throw new Error('Cannot mount');
  runtime = result.value;
}
function update(input: unknown) {
  const result = runtime!.update(input);
  document.querySelector('#status')!.textContent = result.ok
    ? `VALID · revision ${result.value.revision}`
    : JSON.stringify(result.diagnostics);
  return result;
}
function choose() {
  const type = read('type') as keyof typeof recipes;
  source.value = JSON.stringify({ ...recipes[type], id: 'expansion' }, null, 2);
  document.querySelector('#event')!.textContent = '尚未选择图形';
  update(JSON.parse(source.value));
}
mount();
choose();
document.querySelector('#type')!.addEventListener('change', choose);
for (const id of ['theme', 'level'])
  document.querySelector('#' + id)!.addEventListener('change', () => {
    mount();
    update(JSON.parse(source.value));
  });
document.querySelector('#width')!.addEventListener('change', () => {
  document.querySelector<HTMLElement>('#host')!.style.width =
    read('width') + 'px';
  runtime!.resize();
});
document.querySelector('#apply')!.addEventListener('click', () => {
  try {
    update(JSON.parse(source.value));
  } catch {
    document.querySelector('#status')!.textContent = 'INVALID_JSON';
  }
});
const api = {
  recipes,
  update,
  revision: () => runtime!.getRevision(),
  resize: () => runtime!.resize(),
  option: () => echarts.getInstanceByDom(container)!.getOption(),
  action: (payload: Parameters<echarts.ECharts['dispatchAction']>[0]) =>
    echarts.getInstanceByDom(container)!.dispatchAction(payload),
  stats: mapRegistrationStats,
  dispose: () => runtime!.dispose(),
};
declare global {
  interface Window {
    chartExpansion: typeof api;
  }
}
window.chartExpansion = api;
window.addEventListener('beforeunload', () => runtime?.dispose());
