import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface MemoryRecord {
  id: string;
  text: string;
  vector: number[];
  meta?: Record<string, unknown>;
}

interface StoredRecord extends MemoryRecord {
  _emb: string;
}

/**
 * Persistent JSONL vector store with brute-force cosine top-K.
 * One line per memory (append-only, crash-safe: torn last lines are skipped
 * on load). Loaded into memory on boot, which is what makes cross-session
 * recall work — a memory saved before a restart is still returned after it.
 */
export class MemoryStore {
  private items: MemoryRecord[] = [];

  constructor(
    private file: string,
    private embedderId: string,
    private dim: number,
  ) {
    if (existsSync(file)) {
      const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() !== '');
      for (const line of lines) {
        let rec: StoredRecord;
        try {
          rec = JSON.parse(line) as StoredRecord;
        } catch {
          continue; // skip a torn/partial line
        }
        if (rec._emb && rec._emb !== embedderId) {
          throw new Error(
            `Store '${file}' was built with embedder '${rec._emb}' but the current embedder is ` +
              `'${embedderId}' (vector dims differ). Use a fresh IMPRINT_DATA_FILE per embedder.`,
          );
        }
        const { _emb, ...m } = rec;
        void _emb;
        this.items.push(m);
      }
    } else {
      mkdirSync(dirname(file), { recursive: true });
    }
  }

  save(text: string, vector: number[], meta?: Record<string, unknown>): MemoryRecord {
    if (vector.length !== this.dim) {
      throw new Error(`vector dim ${vector.length} !== expected ${this.dim}`);
    }
    const m: MemoryRecord = { id: randomUUID(), text, vector, meta };
    this.items.push(m);
    appendFileSync(this.file, JSON.stringify({ ...m, _emb: this.embedderId }) + '\n');
    return m;
  }

  get(id: string): MemoryRecord | undefined {
    return this.items.find((m) => m.id === id);
  }

  search(qvec: number[], topK = 5): Array<MemoryRecord & { score: number }> {
    return this.items
      .map((m) => ({ ...m, score: dot(qvec, m.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  count(): number {
    return this.items.length;
  }
}

/** Dot product; with unit-normalized vectors this equals cosine similarity. */
function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
