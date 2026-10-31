import { compileChart } from '@chartnexus/core';
import {
  mountChart,
  readOllamaStream,
  type ChartRuntime,
} from '@chartnexus/runtime';
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
let documentRevision = 0;

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
  documentRevision++;
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
  const baseRevision = documentRevision;
  const requestSignal = AbortSignal.any([
    controller.signal,
    AbortSignal.timeout(120000),
  ]);
  const attempts: { attempt: number; valid: boolean; diagnostics?: unknown }[] =
    [];
  let repair: string | undefined;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      raw.textContent = '';
      const response = await fetch('/api/local-ollama/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: requestSignal,
        body: JSON.stringify({
          model: model.value,
          prompt: prompt.value,
          ...(continueEdit.checked && lastDocument
            ? { previous: lastDocument }
            : {}),
          ...(repair ? { repair } : {}),
        }),
      });
      if (!response.ok || !response.body) {
        setStatus('本地模型请求失败。', 'error');
        return;
      }
      const result = await readOllamaStream(response.body, {
        operationId: `generation-${sequence}-${attempt}`,
        baseRevision,
        signal: requestSignal,
        onFragment(text) {
          if (sequence === generation && !controller.signal.aborted)
            raw.textContent += text;
        },
      });
      if (sequence !== generation || controller.signal.aborted) return;
      if (documentRevision !== baseRevision) {
        setStatus(
          '图表已被修改，本次旧结果未应用（REVISION_CONFLICT）。',
          'error',
        );
        return;
      }
      if (!result.ok) {
        if (result.diagnostics[0]?.code === 'INVALID_JSON') {
          attempts.push({
            attempt,
            valid: false,
            diagnostics: result.diagnostics,
          });
          event.textContent = JSON.stringify({
            generation: sequence,
            attempts,
          });
          repair = JSON.stringify({
            invalidText: raw.textContent,
            diagnostics: result.diagnostics,
          });
          if (attempt < 2 && repair.length <= 30000) {
            setStatus(
              `JSON 未通过，正在进行第 ${attempt + 1} 次修复…`,
              'working',
            );
            continue;
          }
        }
        setStatus(
          `流式生成失败：${result.diagnostics[0]?.code}，保留上次图表。`,
          'error',
        );
        return;
      }
      const candidate = result.value.document;
      const checked = compileChart(candidate);
      attempts.push({
        attempt,
        valid: checked.ok,
        ...(!checked.ok ? { diagnostics: checked.diagnostics } : {}),
      });
      event.textContent = JSON.stringify({ generation: sequence, attempts });
      if (checked.ok) {
        renderDocument(candidate);
        event.textContent = JSON.stringify({ generation: sequence, attempts });
        return;
      }
      if (attempt === 2) {
        setStatus(
          `校验失败：${checked.diagnostics[0]?.code}；两次修复后仍未通过，保留上次图表。`,
          'error',
        );
        return;
      }
      repair = JSON.stringify({
        invalidDocument: candidate,
        diagnostics: checked.diagnostics,
      });
      if (repair.length > 30000) {
        setStatus('待修复输入过大，保留上次图表。', 'error');
        return;
      }
      setStatus(`校验未通过，正在进行第 ${attempt + 1} 次修复…`, 'working');
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
