# 🧠 Imprint — paid, persistent memory for AI agents

> An AI agent pays a micro-amount of CSPR — over the HTTP-native **x402** protocol,
> settled on **Casper** — to **store** and **recall** long-term memory across sessions.

Built for the **Casper Agentic Buildathon 2026** (Agentic AI / x402 track).

Memory is the missing primitive for autonomous agents: an agent that can't
remember can't act coherently over time. Imprint turns memory into a metered,
pay-per-use service an agent buys for itself — no accounts, no API keys, no human
in the loop. Every `save` and every `recall` is a signed on-chain micro-payment.

---

## ✨ Why this is different

- **It runs offline, right now.** The default `IMPRINT_MODE=mock` exercises the
  *real* x402 wire protocol (402 → signed payment header → verify → settle →
  settlement receipt) with **zero wallet, zero keys, zero network**. One env var
  flips it to real Casper testnet — **the code path is identical.**
- **Real toolkit, real story.** Uses the actual Casper x402 facilitator
  (`x402-facilitator.cspr.cloud`), `casper-js-sdk` v5, and the Model Context
  Protocol so any agent (e.g. Claude) can use it as a tool.
- **Agent-native.** The agent just calls `save_memory` / `search_memories`; the
  CSPR micro-payment happens invisibly underneath.

---

## 🧰 Casper toolkit used (real, not decoration)

| Piece | Where | What it does |
|-------|-------|--------------|
| **x402 protocol** | `src/x402/` | Hand-rolled 402 → sign → verify → settle wire format (v1 for the internal flow, **v2** body for the real facilitator) |
| **Casper x402 Facilitator** | `src/casper/casper-facilitator.ts` | Calls `x402-facilitator.cspr.cloud` `/verify` + `/settle` to settle a CEP-18 transfer |
| **`@casper-ecosystem/casper-eip-712`** | `casper-facilitator.ts` → `signPayment()` | **Real EIP-712 `TransferWithAuthorization`** typed-data digest, Ed25519-signed (`buildDomain` → `hashTypedData` → `[0x01]+sig`) |
| **`casper-js-sdk` v5** | `casper-facilitator.ts` | Ed25519 keypair load + signing |
| **Model Context Protocol** | `src/mcp/server.ts` | Exposes `save_memory` / `search_memories` / `get_memory` so any MCP agent pays-per-memory |

The EIP-712 signing is the genuine article — verified against the reference facilitator
[`make-software/casper-x402`](https://github.com/make-software/casper-x402) + `docs.cspr.cloud`.

---

## 🏗️ Architecture (5 layers, dependencies flow downward)

```
   ┌─────────────────────────────────────────────────────────────┐
   │  AI agent (Claude, etc.)                                      │
   └───────────────┬──────────────────────────────────────────────┘
                   │ MCP tool call: save_memory / search_memories
   ┌───────────────▼─────────────┐   (4) MCP stdio server
   │  src/mcp/server.ts          │       = an x402 CLIENT
   └───────────────┬─────────────┘
                   │ payAndFetch(): 402 → sign → retry with X-PAYMENT
   ┌───────────────▼─────────────┐   (1) Paid HTTP memory service
   │  src/http/server.ts         │       = the x402 RESOURCE SERVER
   │   paymentGate() middleware  │◄──(3) Facilitator adapter
   └───────────────┬─────────────┘        mock ↔ real (one seam)
                   │ embed + store
   ┌───────────────▼─────────────┐   (2) Persistent semantic store
   │  src/memory/*  (JSONL+cosine)│       survives restarts → recall
   └─────────────────────────────┘
```

| Layer | Files | Role |
|------|-------|------|
| 1 · Paid HTTP service | `src/http/server.ts`, `src/x402/server-middleware.ts` | Gates `/memories`, `/memories/search`, `/memory/:id` behind a 402 paywall |
| 2 · Memory store | `src/memory/*` | Embed text, persist to JSONL, brute-force cosine top-K |
| 3 · Facilitator adapter | `src/casper/*` | `Facilitator` interface + `MockFacilitator` (offline) / `CasperFacilitator` (real) |
| 4 · MCP server | `src/mcp/server.ts`, `src/x402/client.ts` | Agent tools that pay-and-fetch via x402 |
| 5 · Demo | `scripts/demo.ts` | Standalone agent: pay→store→(restart)→pay→recall |

The x402 wire format is **hand-rolled** (`src/x402/`) rather than pulled from an
x402 SDK — so one code path works in both mock and real mode and is never blocked
by the x402 v1/v2 SDK split.

---

## 🚀 60-second quickstart (mock mode — no wallet, no keys)

```bash
npm install
cp .env.example .env          # defaults = mock mode
npm run http                  # terminal 1: the paid memory service on :4021
npm run demo auto             # terminal 2: agent pays to store, then pays to recall
```

You'll see each store/recall print a settlement `tx=…`. Prove the paywall is real:

```bash
curl -i -X POST http://localhost:4021/memories \
  -H "content-type: application/json" -d '{"text":"hi"}'
# → HTTP/1.1 402 Payment Required  { ...accepts: [PaymentRequirements] }
```

Prove **cross-session** recall: stop `npm run http`, start it again — it boots with
`memories=N` reloaded from disk — then `npm run demo recall "..."` still finds them.

---

## 🔌 Use it from Claude (MCP)

1. Keep `npm run http` running.
2. Add [`claude_desktop_config.snippet.json`](./claude_desktop_config.snippet.json)
   to your Claude Desktop / Claude Code MCP config (edit the absolute path), restart Claude.
3. Ask Claude to *"remember that I prefer TypeScript"*, then in a later chat
   *"what language do I prefer?"*. The `save_memory` / `search_memories` tools run
   the x402 handshake invisibly — the agent used a tool that cost CSPR.

---

## 🔁 Mock → real Casper

Everything above runs in **mock mode**. To settle real CEP-18 transfers on Casper
testnet, follow **[SETUP.md](./SETUP.md)** (get a testnet wallet + faucet CSPR + a
CSPR.cloud/hackathon facilitator token), then set `IMPRINT_MODE=real` and re-run
the **same** commands. Same UX, real on-chain tx hashes viewable on
[testnet.cspr.live](https://testnet.cspr.live).

See **[DEMO.md](./DEMO.md)** for the submission-video script.

## 📁 Layout

```
src/config.ts            all env parsing (the only reader of process.env)
src/x402/                wire types, base64 codec, 402 middleware, pay-and-fetch client
src/casper/              Facilitator interface + mock/real implementations
src/memory/              embedder (mock/local/gemini/openai) + JSONL vector store
src/http/server.ts       the paid HTTP memory service
src/mcp/server.ts        the MCP stdio server (agent tools)
scripts/demo.ts          standalone agent simulation
```
