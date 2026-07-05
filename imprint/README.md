# Imprint — website

The landing site for **Imprint**, the paid, persistent memory layer for AI agents,
built for the **Casper Agentic Buildathon 2026**.

> **Leave an _imprint_ your agent pays for.** — an AI agent pays a micro-amount of
> CSPR via the **x402** protocol (settled on **Casper**) to store and recall
> long-term memory across sessions.

This is the marketing / story site. The actual x402 paid-memory service + MCP server
lives in **[`../imprint-agent`](../imprint-agent)** — that's the working demo.

## Run it

```bash
npm install
npm run dev        # → http://localhost:4319
```

## What the site presents

- **Hero** — _"Leave an imprint your agent pays for"_ + the one-line pitch.
- **Quick start** — connect your agent (MCP) → it pays as it remembers (x402) → context that settles (on Casper).
- **The agent memory gap** — agents can transact autonomously, yet forget everything between sessions.
- **One paid memory layer, every agent** — pay-per-memory, priced per call, settled via x402.
- **Why we built this** — memory is the one primitive an autonomous agent can't buy… until now.
- **The stack** — Casper Network · x402 · CSPR · Model Context Protocol · casper-js-sdk · semantic embeddings.
- **Install** — copy-paste MCP setup for Claude Code, Cursor, Codex, Antigravity, and any MCP-capable IDE.

## Tech

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · framer-motion · Instrument Serif.
Dark theme with gold + teal gradient accents. Marketing-only — there is no backend or
auth here; the pre-pivot product routes redirect home, and all x402 / Casper logic
lives in [`../imprint-agent`](../imprint-agent).
