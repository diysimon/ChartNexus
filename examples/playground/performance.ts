import { mountChart } from '@chartnexus/runtime';
import { echarts } from '@chartnexus/echarts';
import recipe from '../../resources/recipes/chat-bar-03.json';
const element = document.querySelector<HTMLElement>('#chart')!;
const sample = async (rows: number) => {
  const document = {
    ...recipe,
    data: {
      kind: 'inline',
      fields: ['month', 'revenue'],
      keyField: 'month',
      rows: Array.from({ length: rows }, (_, i) => ({
        month: `row-${i}`,
        revenue: i % 101,
      })),
    },
  };
  const first: number[] = [],
    update: number[] = [],
    dispose: number[] = [];
  for (let i = 0; i < 12; i++) {
    let start = performance.now();
    const mounted = mountChart(element);
    if (!mounted.ok) throw new Error('Mount failed');
    if (!mounted.value.update(document).ok) throw new Error('Render failed');
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    if (i >= 2) first.push(performance.now() - start);
    start = performance.now();
    if (
      !mounted.value.update({ ...document, presentation: { theme: 'dark' } }).ok
    )
      throw new Error('Update failed');
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    if (i >= 2) update.push(performance.now() - start);
    start = performance.now();
    mounted.value.dispose();
    if (i >= 2) dispose.push(performance.now() - start);
    if (
      echarts.getInstanceByDom(element) ||
      element.querySelector('svg') ||
      element.querySelector('[data-chartnexus-accessible]')
    )
      throw new Error('Disposal retained chart');
  }
  return { rows, first, update, dispose };
};
declare global {
  interface Window {
    runPerformanceProbe: typeof sample;
  }
}
window.runPerformanceProbe = sample;
