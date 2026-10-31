import { type ChartDocument02, type JsonValue } from '@chartnexus/schema';
import { record } from './guard.js';
export function applyLegacyPresentation(
  doc: ChartDocument02,
  option: Record<string, JsonValue>,
): void {
  const theme = doc.presentation?.theme;
  if (theme) {
    const dark = theme.id === 'dark';
    const foreground = dark ? '#f3f4f6' : '#172033';
    option.backgroundColor = dark ? '#111827' : '#ffffff';
    option.color = dark
      ? ['#60a5fa', '#fbbf24', '#34d399', '#f472b6']
      : ['#2563eb', '#b45309', '#047857', '#be185d'];
    option.textStyle = { color: foreground };
    if (record(option.title))
      option.title = {
        ...option.title,
        textStyle: { color: foreground },
        subtextStyle: { color: foreground },
      };
    if (record(option.legend))
      option.legend = { ...option.legend, textStyle: { color: foreground } };
    for (const axis of ['xAxis', 'yAxis']) {
      const value = option[axis];
      if (record(value))
        option[axis] = {
          ...value,
          nameTextStyle: { color: foreground },
          axisLabel: { color: foreground },
        };
    }
  }
  const labels = doc.presentation?.dataLabels;
  if (labels && Array.isArray(option.series)) {
    const color =
      labels.show && theme
        ? theme.id === 'dark'
          ? '#f3f4f6'
          : '#172033'
        : undefined;
    option.series = option.series.map((series) =>
      record(series)
        ? {
            ...series,
            label: { show: labels.show, ...(color ? { color } : {}) },
          }
        : series,
    );
  }
  const legend = doc.presentation?.legend;
  if (legend && record(option.legend)) {
    const current = option.legend;
    if (legend.position) {
      const { top: _top, bottom: _bottom, ...rest } = current;
      // Remove previous placement to avoid conflicting ECharts layout values.
      void _top;
      void _bottom;
      option.legend = {
        ...rest,
        show: legend.show,
        ...(legend.position === 'top'
          ? { top: doc.chart.title ? 36 : 4 }
          : { bottom: 4 }),
      };
    } else option.legend = { ...current, show: legend.show };
    if (legend.show && legend.position === 'top' && record(option.grid))
      option.grid = { ...option.grid, top: 80 };
  }
}
