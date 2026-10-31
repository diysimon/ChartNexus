import type { IncomingMessage, ServerResponse } from 'node:http';
export function createOllamaHandler(
  fetcher?: typeof fetch,
): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => Promise<void>;
export function ollamaProxy(): unknown;
