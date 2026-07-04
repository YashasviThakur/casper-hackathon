# DEMO — submission video script (~2 minutes)

Everything below runs in **mock mode** (no wallet/keys/network). Narrate the one
line that sells it: *"one env var flips this to real Casper testnet — same code."*

### 0. Setup (off camera)
```bash
npm install && cp .env.example .env
npm run demo reset          # start from an empty store (avoids duplicate rows on a re-take)
```

> **Filming tips:** for the recording only, install a real embedder so recall scores
> look strong (~0.7 vs 0.4): `npm i @huggingface/transformers` then set
> `EMBEDDER=local` (offline MiniLM). Keep `EMBEDDER=mock` as the zero-dep repo default.
> If you re-take, run `npm run demo reset` **and restart** `npm run http` first.

### 1. Show it's payment-gated (10s)
Terminal 1:
```bash
npm run http
# → Imprint HTTP on :4021, mode=mock, embedder=hash-256, dim=256, memories=0
```
Terminal 2 — hit it with no payment:
```bash
curl -i -X POST http://localhost:4021/memories -H "content-type: application/json" -d '{"text":"remember this"}'
```
> "The service returns HTTP **402 Payment Required** with x402 payment
> requirements. It refuses to store anything until it's paid."

### 2. An agent pays to store (30s)
```bash
npm run demo save "The user chose Groq over Bedrock for lower latency"
# [STORE ] paid 1000000 → stored id=…  tx=mock-…
```
> "The client hit the 402, **signed an x402 payment**, retried with the
> `X-PAYMENT` header, the facilitator verified + settled, and the memory was
> stored. That `tx` is the settlement hash."

Store one more:
```bash
npm run demo save "The project deadline is July 5, 2026"
```
Point at `data/memories.jsonl`: *"memory + embedding + payment receipt, persisted."*

### 3. Cross-session paid recall (30s) — the headline
Restart the server to prove persistence survives a process restart:
```bash
# Ctrl-C terminal 1, then:
npm run http
# → … memories=2   ← reloaded from disk
```
```bash
npm run demo recall "Which gives lower latency, Groq or Bedrock?"
# [RECALL] paid → tx=mock-…
#    0.429  The user chose Groq over Bedrock for lower latency
#    0.000  The project deadline is July 5, 2026
```
> "A **brand-new session paid again and recalled a memory stored before the
> restart**, correctly ranked. That's cross-session paid recall."

### 4. From inside Claude (30s)
With the [config snippet](./claude_desktop_config.snippet.json) installed and
`npm run http` running, in Claude:
> *"Remember that I prefer TypeScript for backend work."* → `save_memory` runs.
> (new chat) *"What language do I prefer for backend?"* → `search_memories` recalls it.

> "The agent just used a tool. Underneath, it **paid CSPR via x402** to store and
> to recall — autonomous machine-to-machine commerce for memory."

### 5. Close (10s)
Show `.env`, change `IMPRINT_MODE=mock` → `real` (per SETUP.md).
> "Same code, one env var: mock to money. Now every memory op settles a real
> CEP-18 transfer on Casper testnet."

---

**One-line pitch:** *Imprint is the paid memory economy for AI agents — pay-per-remember, settled on Casper via x402.*
