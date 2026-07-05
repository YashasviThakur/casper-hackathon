# Imprint — DoraHacks submission

Copy-paste ready for the Casper Agentic Buildathon 2026 submission form.

---

## Name
**Imprint — the paid memory layer for AI agents**

## Tagline (one line)
An AI agent pays a CSPR micro-amount via x402, settled on Casper, to store and recall long-term memory — no accounts, no API keys.

## Tracks
Agentic AI · DeFi & Payments (x402)

## Elevator pitch
Most x402 demos sell API calls or data. **Imprint sells the one thing an autonomous
agent can't function without and can't currently buy: memory.** An agent that can't
remember can't act coherently over time — so Imprint turns memory into a metered,
pay-per-use service the agent buys *for itself*. Every `save` and every `recall` is a
signed, on-chain micro-payment settled on Casper via the HTTP-native x402 protocol.

## The problem
AI agents are becoming autonomous economic actors — they trade, call APIs, and
transact without a human. But they have **no persistent memory**, and no way to pay
for one without a human account, an API key, or a subscription. Memory is the missing
primitive for real agent autonomy.

## What it does
- An agent calls a tool (`save_memory` / `search_memories`) over **MCP**.
- Under the hood it hits a **402 Payment Required**, signs an **x402** payment in
  **CSPR**, the **Casper x402 facilitator** verifies + settles a CEP-18 transfer, and
  the memory is stored — with an **on-chain receipt**.
- Later, in a fresh session, the agent pays again and its memory comes back, ranked by
  semantic similarity. Cross-session paid recall.
- The website has a **live widget** that runs this exact flow in the browser so you can
  watch an agent pay for its memory in real time.

## Casper toolkit used (real, not decoration)
- **x402** — a hand-rolled `402 → sign → verify → settle` wire protocol (v2 body for the real facilitator).
- **Casper x402 Facilitator** — `/verify` + `/settle` on `x402-facilitator.cspr.cloud` settle a CEP-18 transfer.
- **`@casper-ecosystem/casper-eip-712`** — real **EIP-712 `TransferWithAuthorization`** typed-data digest, Ed25519-signed.
- **`casper-js-sdk` v5** — Ed25519 keypair + signing.
- **Model Context Protocol** — `save_memory` / `search_memories` / `get_memory` tools, so any MCP agent (Claude Code, Cursor, Codex, Antigravity) pays-per-memory.

## How to test it in 60 seconds
```bash
git clone https://github.com/YashasviThakur/casper-hackathon
cd casper-hackathon/imprint-agent && npm install
cp .env.example .env
npm run http          # the paid memory service on :4021
npm run demo auto     # (another terminal) agent pays to store, then pays to recall
npm test              # payment invariants + cross-session recall, all green
```
Or open the website (`cd ../imprint && npm run dev`) and click **"Run the full demo"** —
receipts stream in with tx hashes and "settled" pills.

## What's live vs. next
- ✅ **Mock mode** (default) runs the *real* x402 wire path end-to-end offline — verified,
  including cross-session recall and MCP tool calls. This is what the demo shows.
- ✅ **Real EIP-712 signing** + Casper v2 facilitator body are **implemented**.
- ⏳ **Real on-chain settlement** flips on with one env var (`IMPRINT_MODE=real`) once the
  hackathon facilitator token + accepted CEP-18 asset are in hand — the code path is identical.

## Live site
**https://imprint-x402.vercel.app** — the landing page + the interactive x402 demo widget
("Run the full demo"). On the hosted site the widget runs in simulated mode; run the
backend locally (or host it, see DEPLOY.md) for real receipts.

## Repo
https://github.com/YashasviThakur/casper-hackathon

## Demo video
_(link)_
