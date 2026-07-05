# 🎬 Demo video script (~2 minutes, word-for-word)

## Pre-flight (before you hit record)
```bash
# terminal 1 — the paid memory service
cd imprint-agent && npm run demo reset && npm run http

# terminal 2 — the website
cd imprint && npm run dev            # http://localhost:4319
```
- Open `localhost:4319`. On the live-demo widget, confirm the status pill reads
  **🟢 live · backend localhost:4021** (not simulated). If it's amber, the backend isn't running.
- Tip: `npm i @huggingface/transformers` + `EMBEDDER=local` in `imprint-agent/.env` gives
  stronger recall scores on camera. Reset + restart the backend after.

---

## Scene 1 — The hook (0:00–0:20)
**On screen:** the hero — "Leave an imprint your agent pays for."

> "AI agents can trade, call APIs, and transact on their own — but they forget
> everything the moment a session ends. Most x402 demos sell API calls or data.
> Imprint sells the one thing an autonomous agent can't function without, and can't
> currently buy — **memory**."

## Scene 2 — The money shot: watch it pay (0:20–1:05)
**On screen:** scroll to the "Watch an agent pay for its memory" widget. Click **▶ Run the full demo.**

> "Here's a live agent doing exactly that. Watch the flow: it hits the endpoint,
> gets a **402 Payment Required**, signs an **x402 payment in CSPR**, the **Casper
> facilitator** verifies and settles it on-chain, and the memory is stored — with a
> receipt."

**On screen:** receipts stream in — STORE · 0.0010 CSPR · tx hash · ✓ settled.

> "No account. No API key. No human clicking approve. The agent just paid for its own
> memory. It stores two facts… and then **recalls** one —"

**On screen:** the RECALL row appears with the retrieved memory + score.

> "— pays again, and its memory comes back, ranked by meaning. That's **cross-session,
> pay-per-use memory**, settled on Casper."

## Scene 3 — It's real engineering (1:05–1:35)
**On screen:** cut to terminal 1 running `npm run demo auto` (or scroll the site's "The stack" section).

> "This isn't a mock-up. The same flow runs from any MCP agent — Claude Code, Cursor,
> Codex — through real tools. Under the hood it's a hand-rolled x402 wire protocol,
> **casper-js-sdk** for Ed25519 signing, and **real EIP-712 TransferWithAuthorization**
> typed-data signing via casper-eip-712 — the exact scheme the Casper facilitator
> verifies."

**On screen:** briefly show `npm test` — 4 green checks.

> "Payment invariants and cross-session recall are covered by tests. Green."

## Scene 4 — Close (1:35–2:00)
**On screen:** the `.env` file — change `IMPRINT_MODE=mock` → `real`.

> "Everything you just saw runs the real x402 wire path offline. Flip one env var, and
> the identical code settles real CEP-18 transfers on Casper testnet — every receipt a
> live transaction on cspr.live. Memory is the missing primitive for agent autonomy.
> **Imprint** is the paid memory economy that fills it. Thanks for watching."

---

### Timing cheatsheet
| Scene | Time | Beat |
|-------|------|------|
| 1 | 0:20 | the gap + the one-liner |
| 2 | 0:45 | **the live payment** (the win) |
| 3 | 0:30 | real toolkit + tests |
| 4 | 0:25 | one env var → real Casper |

Keep it under 2:00. Scene 2 is the one that wins — don't rush it.
