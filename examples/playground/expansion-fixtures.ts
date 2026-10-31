import { createMapAsset } from '@chartnexus/echarts';
import radar from '../../resources/recipes/radar-03.json';
import tree from '../../resources/recipes/tree-03.json';
import sankey from '../../resources/recipes/sankey-03.json';
import map from '../../resources/recipes/map-03.json';
import input from '../maps/two-regions.json';
const recipes = { radar, tree, sankey, map };
const type = new URLSearchParams(location.search).get('m3');
export const newChartFixture =
  type && Object.hasOwn(recipes, type)
    ? { ...recipes[type as keyof typeof recipes], id: 'sales' }
    : undefined;
const asset = createMapAsset(input);
if (!asset.ok) throw new Error('Invalid authored map fixture');
export const newChartHostOptions = newChartFixture
  ? {
      maps: { [asset.value.id]: asset.value },
      chatPresentation: { theme: 'light' as const },
    }
  : {};
