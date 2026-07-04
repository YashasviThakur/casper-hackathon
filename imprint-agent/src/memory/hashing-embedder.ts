import { createHash } from 'node:crypto';
import type { Embedder } from './embedder.js';

/**
 * Zero-dependency deterministic embedder. Buckets tokens into a fixed-size
 * signed bag-of-words vector and L2-normalizes it (so cosine == dot product).
 * Semantics are weak, but it needs no model/network/key and is stable across
 * processes — enough to demo the full save/search/persist pipeline offline.
 */
export class HashingEmbedder implements Embedder {
  readonly id = 'hash-256';
  readonly dim = 256;

  async embed(text: string): Promise<number[]> {
    const v = new Array<number>(256).fill(0);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const tok of tokens) {
      const h = createHash('md5').update(tok).digest();
      const bucket = h.readUInt32LE(0) % 256;
      const sign = (h[4] & 1) === 1 ? 1 : -1;
      v[bucket] += sign;
    }
    let norm = 0;
    for (const x of v) norm += x * x;
    norm = Math.sqrt(norm) || 1;
    return v.map((x) => x / norm);
  }
}
