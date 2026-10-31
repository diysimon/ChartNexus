import {
  compileChatChart,
  type ChatPresentationSettings,
} from '@chartnexus/core';
import { mountChart } from '@chartnexus/runtime';
import bar from '../../resources/recipes/bar.json';
import combo from '../../resources/recipes/combo.json';
import funnel from '../../resources/recipes/funnel.json';
import heatmap from '../../resources/recipes/heatmap.json';

const select = (id: string) => document.querySelector<HTMLSelectElement>(id)!;
const theme = select('#theme'),
  level = select('#level'),
  background = select('#background'),
  width = select('#width'),
  chartType = select('#chart-type');
const chart = document.querySelector<HTMLElement>('#chat-chart')!,
  status = document.querySelector<HTMLElement>('#chart-status')!,
  summary = document.querySelector<HTMLElement>('#chart-summary')!,
  adjustments = document.querySelector<HTMLElement>('#adjustments')!;
const samples = {
  bar: {
    document: { ...bar, schemaVersion: '0.2', id: 'chat' },
    summary: '柱状图：Jan 120，Feb 180，Mar 150。',
  },
  combo: {
    document: { ...combo, id: 'chat' },
    summary:
      '柱线图：Jan 销售额 120、成本 90；Feb 销售额 180、成本 130；Mar 销售额 150、成本 110。单位 USD。',
  },
  funnel: {
    document: { ...funnel, id: 'chat' },
    summary: '漏斗图：Visit 1000，Sign up 350，Purchase 90。',
  },
  heatmap: {
    document: { ...heatmap, id: 'chat' },
    summary:
      '热力图：Mon East 4，Tue East 0，Mon West 10；Tue West 缺失。色阶范围 0–10。',
  },
};
const settings: ChatPresentationSettings = {
  theme: 'light',
  detailLevel: 'standard',
  background: 'transparent',
};
const mounted = mountChart(chart, undefined, { chatPresentation: settings });
if (!mounted.ok) throw new Error('Cannot mount chart');
const runtime = mounted.value;
function update() {
  settings.theme = theme.value as NonNullable<
    ChatPresentationSettings['theme']
  >;
  settings.detailLevel = level.value as NonNullable<
    ChatPresentationSettings['detailLevel']
  >;
  settings.background = background.value as NonNullable<
    ChatPresentationSettings['background']
  >;
  document.querySelector<HTMLElement>('#conversation')!.dataset.theme =
    theme.value;
  document
    .querySelector<HTMLElement>('#answer')!
    .classList.toggle('narrow', width.value === 'narrow');
  const sample =
    samples[chartType.value as keyof typeof samples] ?? samples.bar;
  const result = runtime.update(sample.document);
  status.textContent = result.ok
    ? `VALID ${result.value.revision}`
    : JSON.stringify(result.diagnostics);
  summary.textContent = sample.summary;
  const report = compileChatChart(sample.document, settings);
  adjustments.textContent =
    report.ok && report.value.adjustments.includes('REQUIRED_LEGEND')
      ? '为便于区分类别或系列，图例保持显示。'
      : report.ok && report.value.adjustments.includes('LABEL_DENSITY_LIMIT')
        ? '数据较多，已减少标签以保持可读。'
        : '';
}
for (const control of [theme, level, background, width, chartType])
  control.addEventListener('change', update);
document
  .querySelector<HTMLButtonElement>('#download')!
  .addEventListener('click', () => {
    const svg = chart.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chartnexus-chat.svg';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
update();
