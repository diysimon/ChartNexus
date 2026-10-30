import { Worker } from 'node:worker_threads';
import { failure, type DataRegistry, type Result } from '@chartnexus/schema';

export function createRenderer(
  settings: { timeoutMs?: number; concurrency?: number } = {},
) {
  const timeoutMs = settings.timeoutMs ?? 5000;
  const concurrency = settings.concurrency ?? 2;
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 30000 ||
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 4
  )
    throw new Error('Invalid host renderer limits.');
  let active = 0;
  return async function render(
    document: unknown,
    width: number,
    height: number,
    registry: DataRegistry,
    signal?: AbortSignal,
  ): Promise<Result<string>> {
    if (signal?.aborted)
      return failure('CANCELLED', '', 'Rendering was cancelled.');
    if (active >= concurrency)
      return failure('BUSY', '', 'Render capacity is full; retry later.');
    active++;
    let worker: Worker | undefined;
    try {
      worker = new Worker(new URL('./render-worker.js', import.meta.url), {
        stdout: true,
        stderr: true,
        resourceLimits: { maxOldGenerationSizeMb: 128, stackSizeMb: 4 },
      });
      worker.stdout.resume();
      worker.stderr.resume();
      const current = worker;
      return await new Promise<Result<string>>((resolve) => {
        let settled = false;
        const finish = (result: Result<string>) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', cancel);
          resolve(result);
        };
        const cancel = () =>
          finish(failure('CANCELLED', '', 'Rendering was cancelled.'));
        const timer = setTimeout(
          () =>
            finish(
              failure(
                'RENDER_TIMEOUT',
                '',
                'Rendering exceeded the host deadline.',
              ),
            ),
          timeoutMs,
        );
        signal?.addEventListener('abort', cancel, { once: true });
        current.once('message', (result: Result<string>) => finish(result));
        current.once('error', () =>
          finish(failure('RENDER_FAILED', '', 'Render worker failed.')),
        );
        current.once('exit', () =>
          finish(
            failure(
              'RENDER_FAILED',
              '',
              'Render worker exited before returning a result.',
            ),
          ),
        );
        if (signal?.aborted) {
          cancel();
          return;
        }
        try {
          current.postMessage({ document, width, height, registry });
        } catch {
          finish(
            failure(
              'RENDER_FAILED',
              '',
              'Host data could not be transferred to the worker.',
            ),
          );
        }
      });
    } catch {
      return failure('RENDER_FAILED', '', 'Could not start the render worker.');
    } finally {
      if (worker) await worker.terminate();
      active--;
    }
  };
}
