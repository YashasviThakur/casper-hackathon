import { config } from '../config.js';
import { HashingEmbedder } from './hashing-embedder.js';

export interface Embedder {
  readonly id: string;
  readonly dim: number;
  embed(text: string): Promise<number[]>;
}

function l2normalize(v: number[]): number[] {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return v.map((x) => x / norm);
}

/**
 * Pick an embedding backend by EMBEDDER env. The default ('mock') is the
 * zero-dependency HashingEmbedder — no model, no network, no key. The others
 * are dynamically imported so the app installs & runs with ONLY the mock path;
 * `npm i` the optional package to unlock them.
 */
export async function makeEmbedder(kind: string = config.embedder): Promise<Embedder> {
  switch (kind) {
    case 'mock':
      return new HashingEmbedder();

    case 'local': {
      // npm i @huggingface/transformers  (offline MiniLM, 384-dim)
      const spec: string = '@huggingface/transformers';
      const mod: any = await import(spec);
      const extractor: any = await mod.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      return {
        id: 'minilm-384',
        dim: 384,
        async embed(text: string) {
          const out: any = await extractor(text, { pooling: 'mean', normalize: true });
          return Array.from(out.data as Float32Array);
        },
      };
    }

    case 'gemini': {
      // npm i @google/genai  + GEMINI_API_KEY
      const spec: string = '@google/genai';
      const mod: any = await import(spec);
      const ai: any = new mod.GoogleGenAI({ apiKey: config.geminiApiKey });
      return {
        id: 'gemini-emb-768',
        dim: 768,
        async embed(text: string) {
          const r: any = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: text,
            config: { taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: 768 },
          });
          const values: number[] = r.embeddings?.[0]?.values ?? r.embedding?.values ?? [];
          return l2normalize(values); // <3072 dims are not returned unit-normalized
        },
      };
    }

    case 'openai': {
      // npm i openai  + OPENAI_API_KEY
      const spec: string = 'openai';
      const mod: any = await import(spec);
      const client: any = new mod.default({ apiKey: config.openaiApiKey });
      return {
        id: 'openai-3-small',
        dim: 1536,
        async embed(text: string) {
          const r: any = await client.embeddings.create({ model: 'text-embedding-3-small', input: text });
          return r.data[0].embedding as number[];
        },
      };
    }

    case 'auto':
      if (config.openaiApiKey) return makeEmbedder('openai');
      if (config.geminiApiKey) return makeEmbedder('gemini');
      return new HashingEmbedder();

    default:
      throw new Error(`unknown EMBEDDER '${kind}' (use mock|local|gemini|openai|auto)`);
  }
}
