import * as echarts from 'echarts';
import { observeChartMount, type ChartRuntime } from '@chartnexus/runtime';
import {
  createMarklangCharts,
  marklangDataSource,
} from '@chartnexus/adapter-cosui/marklang';
import recipe from '../../resources/recipes/chat-bar.json';
const container = document.querySelector<HTMLElement>('#quality-chart')!;
let runtime: ChartRuntime | undefined;
const base = {
  ...recipe,
  schemaVersion: '0.3',
  data: { ...recipe.data, keyField: 'month' },
};
const coordinator = observeChartMount(
  container,
  (value) => {
    runtime = value;
    value.update(base);
  },
  () => {},
  (event) => {
    document.querySelector('#quality-event')!.textContent =
      JSON.stringify(event);
  },
  { chatPresentation: {} },
);
const markdown = createMarklangCharts(
  document.querySelector<HTMLElement>('#markdown')!,
  { chatPresentation: { theme: 'dark' } },
);
const source = (count: number) =>
  Array.from(
    { length: count },
    (_, i) =>
      marklangDataSource(`data${i}`, { ...recipe, id: `markdown-${i}` }) +
      `\n\n::ml-chartnexus{data="data${i}"}\n`,
  ).join('\n');
export const quality = {
  base,
  update: (input: unknown) => runtime?.update(input),
  revision: () => runtime?.getRevision(),
  dispose: () => coordinator.dispose(),
  state: () => coordinator.getState(),
  markdown: (count: number) => markdown.update(source(count), true),
  markdownFailure() {
    const instance = echarts.getInstanceByDom(container)!;
    const prototype = Object.getPrototypeOf(instance) as echarts.ECharts;
    const original = prototype.setOption;
    let calls = 0;
    prototype.setOption = function (
      this: echarts.ECharts,
      option: echarts.EChartsCoreOption,
      opts?: boolean | echarts.SetOptionOpts,
      lazy?: boolean,
    ) {
      if (this.getDom().closest('[data-chartnexus-staging]') && ++calls === 2)
        throw new Error('Injected second-chart render failure');
      return original.apply(this, [
        option,
        typeof opts === 'boolean'
          ? { notMerge: opts, lazyUpdate: lazy ?? false }
          : opts,
      ]);
    };
    try {
      return markdown.update(source(2), true);
    } finally {
      prototype.setOption = original;
    }
  },
  failResize() {
    const instance = echarts.getInstanceByDom(container)!;
    const original = instance.resize;
    instance.resize = () => {
      throw new Error('Injected resize failure');
    };
    try {
      return runtime?.resize();
    } finally {
      instance.resize = original;
    }
  },
};
declare global {
  interface Window {
    chartQuality: typeof quality;
  }
}
window.chartQuality = quality;
window.addEventListener('beforeunload', () => {
  coordinator.dispose();
  markdown.dispose();
});
