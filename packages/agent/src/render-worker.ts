import { parentPort } from 'node:worker_threads';
import { renderSvg } from '@chartnexus/render';
import type { ChatPresentationSettings } from '@chartnexus/core';
import type { DataRegistry, MapRegistry } from '@chartnexus/schema';
interface Request {
  document: unknown;
  width: number;
  height: number;
  registry: DataRegistry;
  maps?: MapRegistry;
  chatPresentation?: ChatPresentationSettings;
}
parentPort?.once('message', (request: Request) => {
  const result = renderSvg(request.document, {
    width: request.width,
    height: request.height,
    registry: request.registry,
    ...(request.maps ? { maps: request.maps } : {}),
    ...(request.chatPresentation !== undefined
      ? { chatPresentation: request.chatPresentation }
      : {}),
  });
  parentPort?.postMessage(result);
  parentPort?.close();
});
