import { compileChart } from '@chartnexus/core';
import { mountChart, type ChartRuntime } from '@chartnexus/runtime';
import './ollama.css';

const model = document.querySelector<HTMLSelectElement>('#model')!;
const prompt = document.querySelector<HTMLTextAreaElement>('#prompt')!;
const connection = document.querySelector<HTMLElement>('#connection')!;
const status = document.querySelector<HTMLElement>('#status')!;
const badge = document.querySelector<HTMLElement>('#badge')!;
const jsonEditor = document.querySelector<HTMLTextAreaElement>('#document')!;
const raw = document.querySelector<HTMLElement>('#raw')!;
const generate = document.querySelector<HTMLButtonElement>('#generate')!;
const cancel = document.querySelector<HTMLButtonElement>('#cancel')!;
const continueEdit = document.querySelector<HTMLInputElement>('#continue')!;
const layer = document.querySelector<HTMLElement>('#chart-layer')!;
const empty = document.querySelector<HTMLElement>('#empty')!;
const event = document.querySelector<HTMLElement>('#event')!;
let runtime: ChartRuntime | undefined;
let renderedNode: HTMLElement | undefined;
let lastDocument: unknown;
let current: AbortController | undefined;
let generation = 0;

const examples: Record<string, string> = {
  bar: '画一个柱状图：1 月销售额 120，2 月 180，3 月 150。标题为月度销售额。',
  line: '画一个折线图：周一气温 18 度，周二 21 度，周三 19 度，周四 23 度。标题为本周气温。',
  pie: '画一个饼图：产品 A 销量 45，产品 B 销量 30，产品 C 销量 25。标题为产品销量占比。',
};
function setStatus(
  message: string,
  kind: 'ready' | 'error' | 'working' = 'ready',
) {
  status.textContent = message;
  badge.textContent =
    kind === 'working' ? '生成中' : kind === 'error' ? '需要处理' : '已就绪';
  badge.dataset.kind = kind;
}
function errorMessage(code: string): string {
  if (code === 'OLLAMA_UNAVAILABLE')
    return '无法连接 Ollama。请确认本机 Ollama 服务已启动。';
  if (code === 'OLLAMA_HTTP_404')
    return '模型不可用，请刷新列表并选择已安装的模型。';
  if (code === 'OLLAMA_TIMEOUT')
    return '模型响应超时，请稍后重试或更换较小的模型。';
  if (code === 'RESPONSE_TOO_LARGE') return '模型响应过大，请简化请求。';
  if (code === 'INVALID_UPSTREAM_JSON')
    return 'Ollama 接口返回了无效数据，请检查服务。';
  if (code === 'REQUEST_TOO_LARGE') return '请求数据过大，请缩减输入内容。';
  return `请求未完成（${code}），请检查 Ollama 状态或更换模型。`;
}
async function refreshModels() {
  connection.textContent = '正在连接本地 Ollama…';
  try {
    const response = await fetch('/api/local-ollama/models');
    const payload: unknown = await response.json();
    if (
      !response.ok ||
      !payload ||
      typeof payload !== 'object' ||
      !('models' in payload) ||
      !Array.isArray(payload.models)
    )
      throw new Error('OLLAMA_UNAVAILABLE');
    const names = payload.models.filter(
      (name): name is string => typeof name === 'string',
    );
    const previous = model.value;
    model.replaceChildren();
    if (!names.length) {
      model.add(new Option('没有已安装的模型', ''));
      connection.textContent = 'Ollama 已连接，但没有发现已安装的模型。';
      generate.disabled = true;
      return;
    }
    for (const name of names) model.add(new Option(name, name));
    model.value = names.includes(previous)
      ? previous
      : (names.find((name) => name.startsWith('qwen3.5:9b')) ?? names[0]!);
    connection.textContent = `已连接 · ${names.length} 个本地模型`;
    generate.disabled = false;
  } catch {
    model.replaceChildren(new Option('无法连接 Ollama', ''));
    connection.textContent = '未连接。请启动 Ollama 后刷新。';
    generate.disabled = true;
  }
}
function parseDocument(text: string): unknown {
  const trimmed = text.trim();
  const match = /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i.exec(trimmed);
  return JSON.parse(match?.[1] ?? trimmed);
}
function renderDocument(input: unknown): boolean {
  if (
    input &&
    typeof input === 'object' &&
    !Array.isArray(input) &&
    Object.keys(input).length === 0
  ) {
    setStatus(
      '模型没有提供可用的图表数据。当前页面不会自动联网查询，请补充各项名称和数值后重试。',
      'error',
    );
    return false;
  }
  const checked = compileChart(input);
  if (!checked.ok) {
    setStatus(
      `校验失败：${checked.diagnostics.map((item) => `${item.code} ${item.message}`).join('；')}`,
      'error',
    );
    return false;
  }
  const node = document.createElement('div');
  node.className = 'chart-instance';
  node.style.visibility = 'hidden';
  layer.append(node);
  const mounted = mountChart(node, (selection) => {
    event.textContent = `已选中数据 #${selection.dataIndex + 1}`;
  });
  if (!mounted.ok) {
    node.remove();
    setStatus(
      `无法挂载图表：${mounted.diagnostics[0]?.message ?? '未知错误'}`,
      'error',
    );
    return false;
  }
  const result = mounted.value.update(input);
  if (!result.ok) {
    mounted.value.dispose();
    node.remove();
    setStatus(
      `渲染失败：${result.diagnostics[0]?.message ?? '未知错误'}`,
      'error',
    );
    return false;
  }
  runtime?.dispose();
  renderedNode?.remove();
  runtime = mounted.value;
  renderedNode = node;
  lastDocument = input;
  node.style.visibility = 'visible';
  empty.hidden = true;
  event.textContent = '';
  jsonEditor.value = JSON.stringify(input, null, 2);
  setStatus('图表已通过校验并渲染');
  return true;
}
async function generateChart() {
  if (!model.value || !prompt.value.trim() || current) {
    if (!prompt.value.trim()) setStatus('请先输入图表需求和数据。', 'error');
    return;
  }
  const controller = new AbortController();
  current = controller;
  const sequence = ++generation;
  generate.disabled = true;
  cancel.hidden = false;
  setStatus('正在请求本地模型，首次加载可能较慢…', 'working');
  try {
    const response = await fetch('/api/local-ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: model.value,
        prompt: prompt.value,
        ...(continueEdit.checked && lastDocument
          ? { previous: lastDocument }
          : {}),
      }),
    });
    const payload: unknown = await response.json();
    if (sequence !== generation) return;
    if (
      !response.ok ||
      !payload ||
      typeof payload !== 'object' ||
      !('content' in payload) ||
      typeof payload.content !== 'string'
    ) {
      const code =
        payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        typeof payload.error === 'string'
          ? payload.error
          : 'INVALID_MODEL_RESPONSE';
      setStatus(errorMessage(code), 'error');
      return;
    }
    raw.textContent = payload.content;
    jsonEditor.value = payload.content;
    try {
      renderDocument(parseDocument(payload.content));
    } catch {
      setStatus(
        '模型没有返回有效 JSON。请查看原始响应，或换一个模型重试。',
        'error',
      );
    }
  } catch (error) {
    if (sequence !== generation) return;
    if (error instanceof DOMException && error.name === 'AbortError')
      setStatus('已取消，本次结果未应用。');
    else setStatus('连接中断，请检查本地服务后重试。', 'error');
  } finally {
    if (sequence === generation) {
      current = undefined;
      generate.disabled = !model.value;
      cancel.hidden = true;
    }
  }
}
document.querySelector('#refresh')!.addEventListener('click', () => {
  void refreshModels();
});
generate.addEventListener('click', () => {
  void generateChart();
});
cancel.addEventListener('click', () => {
  current?.abort();
  generation++;
  current = undefined;
  generate.disabled = !model.value;
  cancel.hidden = true;
  setStatus('已取消，本次结果未应用。');
});
document.querySelector('#render-json')!.addEventListener('click', () => {
  try {
    renderDocument(parseDocument(jsonEditor.value));
  } catch {
    setStatus('JSON 格式无效，请检查后重试。', 'error');
  }
});
document
  .querySelectorAll<HTMLButtonElement>('[data-example]')
  .forEach((button) =>
    button.addEventListener('click', () => {
      prompt.value = examples[button.dataset.example ?? ''] ?? '';
      prompt.focus();
    }),
  );
window.addEventListener('beforeunload', () => {
  current?.abort();
  runtime?.dispose();
});
void refreshModels();
