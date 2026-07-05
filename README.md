# 🧠 Imprint — paid, persistent memory for AI agents

> An AI agent pays a micro-amount of **CSPR** — over the HTTP-native **x402** protocol,
> settled on **Casper** — to **store** and **recall** long-term memory across sessions.

**Casper Agentic Buildathon 2026** submission · Agentic AI / x402 track.

🌐 **Live site:** https://imprint-x402.vercel.app

Most x402 demos sell API calls or data. **Imprint sells the one thing an autonomous
agent can't function without and can't currently buy: memory.** An agent that can't
remember can't act coherently over time — so Imprint turns memory into a metered,
pay-per-use service the agent buys *for itself*: no accounts, no API keys, no human
in the loop. Every `save` and every `recall` is a signed, on-chain micro-payment.

---

## 📦 What's in this repo

| Folder | What it is | Run |
|--------|------------|-----|
| **[`imprint-agent/`](./imprint-agent)** | The **x402 paid-memory backend + MCP server** — the technical core. | `npm install && npm run http` (:4021) |
| **[`imprint/`](./imprint)** | The **marketing site** (Next.js) telling the story. | `npm install && npm run dev` (:4319) |

New here? Start with **[`imprint-agent/README.md`](./imprint-agent/README.md)** — that's the working demo.

---

## 🚀 60-second demo (no wallet, no keys, no network)

```bash
cd imprint-agent
npm install
cp .env.example .env          # defaults = mock mode
npm run http                  # terminal 1 — the paid memory service on :4021
npm run demo auto             # terminal 2 — agent pays to store, then pays to recall
```

You'll watch an agent hit a **402 Payment Required**, sign an x402 payment in CSPR,
store a memory, then — in a fresh session — pay again and recall it, correctly ranked.
Prove the paywall is real:

```bash
curl -i -X POST http://localhost:4021/memories \
  -H "content-type: application/json" -d '{"text":"hi"}'
# → HTTP/1.1 402 Payment Required   { accepts: [ PaymentRequirements ] }
```

Run the test suite: `npm test` · Typecheck: `npm run typecheck`

---

## 🧰 Real Casper toolkit usage (not decoration)

- **x402** — hand-rolled `402 → sign → verify → settle` wire protocol (`imprint-agent/src/x402/`), v2 body for the real facilitator.
- **Casper x402 Facilitator** — `/verify` + `/settle` on `x402-facilitator.cspr.cloud` settle a CEP-18 transfer.
- **`@casper-ecosystem/casper-eip-712`** — **real EIP-712 `TransferWithAuthorization`** typed-data digest, Ed25519-signed (`imprint-agent/src/casper/casper-facilitator.ts`).
- **`casper-js-sdk` v5** — Ed25519 keypair + signing.
- **Model Context Protocol** — `save_memory` / `search_memories` / `get_memory` tools so *any* MCP agent (Claude Code, Cursor, Codex, …) pays-per-memory.

**Mock-mode-first:** the default `IMPRINT_MODE=mock` exercises the *real* x402 wire
path offline (verified end-to-end, incl. cross-session recall). One env var flips it
to real Casper testnet — the code path is identical. See
[`imprint-agent/SETUP.md`](./imprint-agent/SETUP.md).

---

## 🔗 Links

- Backend deep-dive: [`imprint-agent/README.md`](./imprint-agent/README.md)
- Mock → real Casper: [`imprint-agent/SETUP.md`](./imprint-agent/SETUP.md)
- Submission summary: [`SUBMISSION.md`](./SUBMISSION.md)
- Demo video script (word-for-word): [`VIDEO-SCRIPT.md`](./VIDEO-SCRIPT.md)
- Deploy to Vercel: [`DEPLOY.md`](./DEPLOY.md)

## License

MIT — see [LICENSE](./LICENSE).
