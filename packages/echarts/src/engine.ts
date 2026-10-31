/** One explicit renderer/module profile shared by DOM, SVG and workers. */
import * as engine from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  FunnelChart,
  HeatmapChart,
  RadarChart,
  TreeChart,
  SankeyChart,
  MapChart,
} from 'echarts/charts';
import {
  AriaComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  RadarComponent,
  GeoComponent,
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { SVGRenderer } from 'echarts/renderers';
engine.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  FunnelChart,
  HeatmapChart,
  RadarChart,
  TreeChart,
  SankeyChart,
  MapChart,
  AriaComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  RadarComponent,
  GeoComponent,
  LabelLayout,
  SVGRenderer,
]);
export { engine as echarts };
