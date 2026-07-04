import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encodeHeader, decodeHeader } from '../src/x402/codec.js';
import { MockFacilitator } from '../src/casper/mock-facilitator.js';
import { HashingEmbedder } from '../src/memory/hashing-embedder.js';
import { MemoryStore } from '../src/memory/memory-store.js';
import type { AppConfig } from '../src/config.js';
import type { PaymentRequirements } from '../src/x402/types.js';

const cfg = { network: 'casper:casper-test' } as AppConfig;
const reqs: PaymentRequirements = {
  scheme: 'exact',
  network: 'casper:casper-test',
  maxAmountRequired: '1000000',
  asset: '0'.repeat(64),
  payTo: '01' + 'ab'.repeat(31) + 'ab',
  resource: '/memories',
  description: 'store one memory',
  mimeType: 'application/json',
  maxTimeoutSeconds: 60,
  extra: {},
};

test('x402 codec round-trips a header payload', () => {
  const obj = { x402Version: 1, scheme: 'exact', nested: { a: '1' } };
  assert.deepEqual(decodeHeader(encodeHeader(obj)), obj);
});

test('mock facilitator: sign -> verify -> settle succeeds, and a replayed nonce is rejected', async () => {
  const f = new MockFacilitator(cfg);
  const payload = await f.signPayment(reqs);
  assert.equal((await f.verify(payload, reqs)).isValid, true);

  const s1 = await f.settle(payload, reqs);
  assert.equal(s1.success, true);
  assert.match(s1.transaction, /^mock-/);

  const s2 = await f.settle(payload, reqs); // same nonce again → replay
  assert.equal(s2.success, false);
  assert.equal(s2.errorReason, 'nonce_replayed');
});

test('mock facilitator: a tampered payment amount is rejected', async () => {
  const f = new MockFacilitator(cfg);
  const payload = await f.signPayment(reqs);
  payload.payload.authorization.value = '999'; // underpay
  const v = await f.verify(payload, reqs);
  assert.equal(v.isValid, false);
  assert.equal(v.invalidReason, 'invalid_amount');
});

test('memory store persists to disk and a fresh instance reloads + ranks correctly (cross-session recall)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'imprint-test-'));
  const file = join(dir, 'mem.jsonl');
  const emb = new HashingEmbedder();
  try {
    const store = new MemoryStore(file, emb.id, emb.dim);
    store.save('the user chose Groq over Bedrock', await emb.embed('the user chose Groq over Bedrock'));
    store.save('the deadline is July 5', await emb.embed('the deadline is July 5'));
    assert.equal(store.count(), 2);

    // A brand-new instance over the same file = the cross-session recall proof.
    const reloaded = new MemoryStore(file, emb.id, emb.dim);
    assert.equal(reloaded.count(), 2);

    const hits = reloaded.search(await emb.embed('Groq Bedrock'), 2);
    assert.match(hits[0].text, /Groq/);
    assert.ok(hits[0].score > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
