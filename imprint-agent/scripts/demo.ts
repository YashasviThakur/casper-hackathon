import { existsSync, writeFileSync } from 'node:fs';
import { config } from '../src/config.js';
import { makeFacilitator } from '../src/casper/index.js';
import { payAndFetch } from '../src/x402/client.js';

/**
 * Layer 5: a standalone agent simulation. It is a pure x402 CLIENT of the HTTP
 * memory service (it never touches the store directly). Persistence lives in
 * the HTTP server; the true cross-session proof is restarting that server and
 * seeing memories survive (see DEMO.md). Honors mock/real automatically.
 *
 *   npm run demo save "The user chose Groq over Bedrock"
 *   npm run demo recall "which inference provider did I pick"
 *   npm run demo auto      # store two, then recall — each call pays via x402
 */
const facilitator = makeFacilitator(config);
const apiBase = config.apiBase;

async function save(text: string): Promise<string> {
  const { data, settlement } = await payAndFetch<{ id: string; receipt: any }>({
    method: 'POST',
    url: `${apiBase}/memories`,
    body: { text, topic: 'demo' },
    facilitator,
  });
  console.log(`[STORE ] paid ${data.receipt.amount} → stored id=${data.id}  tx=${settlement?.transaction}`);
  return data.id;
}

async function recall(query: string): Promise<void> {
  const { data, settlement } = await payAndFetch<{ results: Array<{ text: string; score: number }> }>({
    method: 'POST',
    url: `${apiBase}/memories/search`,
    body: { query, topK: 3 },
    facilitator,
  });
  console.log(`[RECALL] paid → tx=${settlement?.transaction}`);
  if (data.results.length === 0) console.log('   (no memories found)');
  for (const r of data.results) console.log(`   ${r.score.toFixed(3)}  ${r.text}`);
}

async function main(): Promise<void> {
  const cmd = process.argv[2] ?? 'auto';
  const rest = process.argv.slice(3).join(' ');

  if (cmd === 'reset') {
    if (existsSync(config.dataFile)) writeFileSync(config.dataFile, '');
    console.log(`[RESET ] cleared ${config.dataFile}. Restart \`npm run http\` so the server reloads empty.`);
    return;
  }
  if (cmd === 'save') {
    await save(rest || 'The user chose Groq over Bedrock for lower latency');
    return;
  }
  if (cmd === 'recall') {
    await recall(rest || 'which inference provider did I pick');
    return;
  }

  // auto: the full arc — every store and recall is a separate paid x402 call.
  console.log(`\n=== Imprint demo (mode=${config.mode}) — every call pays via x402 ===\n`);
  console.log('— SESSION A: storing memories —');
  await save('The user chose Groq over Bedrock for lower latency');
  await save('The project deadline is July 5, 2026');
  console.log('\n— SESSION B: recalling (pays again, reads from the persisted store) —');
  await recall('Which gives lower latency, Groq or Bedrock?');
  console.log('\nTip: stop & restart `npm run http`, then `npm run demo recall "..."`');
  console.log('     — the memories survive because they persisted to disk. That is cross-session paid recall.');
  console.log('Note: the default EMBEDDER=mock is lexical (matches shared words). For true semantic');
  console.log('      recall, `npm i @huggingface/transformers` and set EMBEDDER=local (offline MiniLM).\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
