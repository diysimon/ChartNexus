import { mountChart } from '@chartnexus/runtime';
import example from '../../resources/recipes/chat-bar-03.json';

const container = document.querySelector<HTMLElement>('#chart')!;
const source = document.querySelector<HTMLTextAreaElement>('#source')!;
const status = document.querySelector<HTMLElement>('#status')!;

// The host chooses the policy and must give the chart a measurable container.
const mounted = mountChart(container, undefined, {
  chatPresentation: {
    theme: 'light',
    background: 'transparent',
    detailLevel: 'standard',
  },
});
if (!mounted.ok) throw new Error(JSON.stringify(mounted.diagnostics));
const chart = mounted.value;

function update(input: unknown) {
  const result = chart.update(input);
  status.textContent = result.ok
    ? `VALID · revision ${result.value.revision}`
    : JSON.stringify(result.diagnostics, null, 2);
}

source.value = JSON.stringify(example, null, 2);
update(example);
document.querySelector('#update')!.addEventListener('click', () => {
  let input: unknown;
  try {
    // The host must buffer streaming fragments before calling update.
    input = JSON.parse(source.value);
  } catch {
    status.textContent = 'INVALID_JSON: provide one complete JSON document';
    return;
  }
  update(input);
});
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) chart.dispose();
});
