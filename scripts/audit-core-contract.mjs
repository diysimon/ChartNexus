import { compileChart } from '@chartnexus/core';

// Fixed probes for the 0.1 contract review. Acceptance is not visual validation.
const base = {
  schemaVersion: '0.1',
  id: 'audit',
  mode: 'intent',
  data: { kind: 'inline', fields: ['x', 'y'], rows: [{ x: 'A', y: 1 }] },
  chart: {
    type: 'bar',
    encoding: {
      x: { field: 'x', type: 'ordinal' },
      y: { field: 'y', type: 'quantitative' },
    },
  },
};
const native = (series) => ({
  schemaVersion: '0.1',
  id: 'audit',
  mode: 'echarts',
  option: { series: [series] },
});
const probes = [
  ['intent bar', base, true],
  [
    'intent horizontal',
    { ...base, chart: { ...base.chart, orientation: 'horizontal' } },
    false,
  ],
  ['intent theme', { ...base, theme: 'dark' }, false],
  [
    'intent temporal',
    {
      ...base,
      chart: {
        ...base.chart,
        encoding: {
          ...base.chart.encoding,
          x: { field: 'x', type: 'temporal' },
        },
      },
    },
    false,
  ],
  ['intent unit', { ...base, chart: { ...base.chart, unit: 'USD' } }, false],
  [
    'intent sort',
    { ...base, chart: { ...base.chart, sort: 'descending' } },
    false,
  ],
  [
    'native unknown nested key',
    native({ type: 'bar', data: [1], notARealOption: 123 }),
    true,
  ],
  [
    'native area style',
    native({ type: 'line', data: [1], areaStyle: {} }),
    true,
  ],
  [
    'native donut radius',
    native({
      type: 'pie',
      data: [{ name: 'A', value: 1 }],
      radius: ['40%', '70%'],
    }),
    true,
  ],
  ['unknown 0.3 version', { ...base, schemaVersion: '0.3' }, false],
];
let failed = false;
for (const [name, input, expected] of probes) {
  const result = compileChart(input);
  const passed = result.ok === expected;
  failed ||= !passed;
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${name}: ${result.ok ? 'accepted' : result.diagnostics[0]?.code}`,
  );
}
if (failed) process.exitCode = 1;
