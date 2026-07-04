import express from 'express';
import { config } from '../config.js';
import { makeFacilitator } from '../casper/index.js';
import { makeEmbedder } from '../memory/embedder.js';
import { MemoryStore } from '../memory/memory-store.js';
import { paymentGate } from '../x402/server-middleware.js';

/**
 * Express 4 does NOT catch rejected promises from async handlers/middleware, so
 * an uncaught throw would hang the request forever. Wrap every async handler so
 * a rejection becomes next(err) → the terminal error handler → a clean 500.
 */
const asyncHandler =
  (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => unknown): express.RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Layer 1: the PAID HTTP memory service (the x402 resource server).
 * POST /memories, POST /memories/search and GET /memory/:id are gated behind a
 * 402 paywall; /healthz is free.
 */
async function main(): Promise<void> {
  const facilitator = makeFacilitator(config);
  const embedder = await makeEmbedder();
  const store = new MemoryStore(config.dataFile, embedder.id, embedder.dim);

  const app = express();
  app.use(express.json());

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, mode: config.mode, embedder: embedder.id, dim: embedder.dim, count: store.count() });
  });

  app.post(
    '/memories',
    asyncHandler(paymentGate({ price: config.priceSave, description: 'Store one memory', facilitator, config })),
    asyncHandler(async (req, res) => {
      const { text, topic } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'text is required' });
        return;
      }
      const vec = await embedder.embed(text);
      const rec = store.save(text, vec, {
        topic,
        payer: res.locals.payment.payer,
        tx: res.locals.payment.tx,
        ts: Date.now(),
      });
      res.json({ id: rec.id, receipt: res.locals.payment });
    }),
  );

  app.post(
    '/memories/search',
    asyncHandler(paymentGate({ price: config.priceSearch, description: 'Semantic memory search', facilitator, config })),
    asyncHandler(async (req, res) => {
      const { query, topK } = req.body ?? {};
      if (typeof query !== 'string' || !query.trim()) {
        res.status(400).json({ error: 'query is required' });
        return;
      }
      const qv = await embedder.embed(query);
      const hits = store.search(qv, typeof topK === 'number' ? topK : 5);
      res.json({
        results: hits.map((h) => ({ id: h.id, text: h.text, score: h.score, meta: h.meta })),
        receipt: res.locals.payment,
      });
    }),
  );

  app.get(
    '/memory/:id',
    asyncHandler(paymentGate({ price: config.priceSearch, description: 'Fetch one memory by id', facilitator, config })),
    asyncHandler((req, res) => {
      const rec = store.get(req.params.id);
      if (!rec) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      res.json({ id: rec.id, text: rec.text, meta: rec.meta, receipt: res.locals.payment });
    }),
  );

  // Terminal error handler — turns any async throw into a clean 500 (never a hang).
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return;
    res.status(500).json({ error: err instanceof Error ? err.message : 'internal error' });
  });

  const server = app.listen(config.port, () => {
    console.log(
      `Imprint HTTP on :${config.port}, mode=${config.mode}, embedder=${embedder.id}, dim=${embedder.dim}, memories=${store.count()}`,
    );
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} is already in use. Set PORT in .env to a free port (note: .env overrides shell env vars).`);
      process.exit(1);
    }
    throw err;
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
