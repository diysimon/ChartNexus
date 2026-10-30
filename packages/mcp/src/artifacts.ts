import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
export interface Artifact {
  uri: string;
  name: string;
  mimeType: 'image/svg+xml';
  text: string;
  bytes: number;
  sha256: string;
  expiresAt: number;
}
/** Bounded, session-local cache. Resource URIs never resolve filesystem paths. */
export class ArtifactStore {
  private entries = new Map<string, Artifact>();
  constructor(
    private settings: {
      maxEntries?: number;
      maxBytes?: number;
      ttlMs?: number;
      now?: () => number;
    } = {},
  ) {
    for (const value of [
      settings.maxEntries ?? 8,
      settings.maxBytes ?? 16_777_216,
      settings.ttlMs ?? 600_000,
    ])
      if (!Number.isInteger(value) || value < 1)
        throw new Error('Invalid artifact limits.');
  }
  private now() {
    return this.settings.now?.() ?? Date.now();
  }
  list(): Artifact[] {
    const now = this.now();
    for (const [uri, value] of this.entries)
      if (value.expiresAt <= now) this.entries.delete(uri);
    return [...this.entries.values()];
  }
  get(uri: string): Artifact | undefined {
    this.list();
    return this.entries.get(uri);
  }
  put(text: string): Artifact {
    const bytes = Buffer.byteLength(text);
    const maxBytes = this.settings.maxBytes ?? 16_777_216;
    if (bytes > Math.min(maxBytes, 8_388_608))
      throw new Error('Artifact exceeds cache budget.');
    let entries = this.list();
    while (
      entries.length >= (this.settings.maxEntries ?? 8) ||
      entries.reduce((sum, item) => sum + item.bytes, 0) + bytes > maxBytes
    ) {
      const first = entries[0];
      if (!first) break;
      this.entries.delete(first.uri);
      entries = this.list();
    }
    const name = `${randomUUID()}.svg`;
    const value: Artifact = {
      uri: `chartnexus://artifacts/${name}`,
      name,
      mimeType: 'image/svg+xml',
      text,
      bytes,
      sha256: createHash('sha256').update(text).digest('hex'),
      expiresAt: this.now() + (this.settings.ttlMs ?? 600_000),
    };
    this.entries.set(value.uri, value);
    return value;
  }
  clear(): void {
    this.entries.clear();
  }
}
