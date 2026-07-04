"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const VIDEO_CARDS = [
  {
    videoUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4",
    tag: "Pay-per-memory (x402)",
    title: "402 Payment Required, Answered",
    description:
      "The agent calls an endpoint, gets a 402 with a price, signs an x402 micro-payment in CSPR, and receives the write — machine-to-machine, no accounts or API keys.",
  },
  {
    videoUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4",
    tag: "On-chain receipts",
    title: "Settled on Casper",
    description:
      "Every store and recall settles as a CSPR transaction on the Casper network, producing an on-chain receipt you can verify on testnet.cspr.live. Pay-per-use, never a subscription.",
  },
];

const ICON_CARDS = [
  {
    glyph: "◈",
    anim: "sync",
    color: "#4EECD8",
    tag: "MCP-native tools",
    title: "save_memory · search_memories",
    description:
      "Agents plug in over the Model Context Protocol. Calling save_memory or search_memories signs and settles the payment under the hood — the agent just calls a tool, wherever it runs: Claude Code, Cursor, Codex, or Antigravity.",
  },
  {
    glyph: "◎",
    anim: "semantic",
    color: "#4285F4",
    tag: "Semantic recall",
    title: "Embeddings + Cosine Similarity",
    description:
      "Every memory is embedded and recalled by cosine similarity, so each session pulls the context relevant to the query — not just the most recent. Replay-protected payments keep writes persistent across sessions.",
  },
];

/* Cross-IDE sync: outer IDE nodes stream memory writes into one central hub. */
function SyncAnim({ color }: { color: string }) {
  const nodes = [ { x: 28, y: 28 }, { x: 172, y: 32 }, { x: 34, y: 96 }, { x: 168, y: 92 } ];
  return (
    <svg viewBox="0 0 200 124" width="62%" style={{ maxWidth: 300, overflow: "visible" }} aria-hidden>
      {nodes.map((n, i) => (
        <line key={`l${i}`} x1={n.x} y1={n.y} x2="100" y2="62" stroke={color} strokeOpacity="0.2" strokeWidth="1" />
      ))}
      {[0, 1].map(k => (
        <circle key={`p${k}`} cx="100" cy="62" r="8" fill="none" stroke={color} strokeWidth="1.2">
          <animate attributeName="r" values="8;36" dur="2.8s" begin={`${k * 1.4}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0" dur="2.8s" begin={`${k * 1.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {nodes.map((n, i) => (
        <circle key={`n${i}`} cx={n.x} cy={n.y} r="5" fill="none" stroke={color} strokeWidth="1.4" strokeOpacity="0.6">
          <animate attributeName="opacity" values="0.35;1;0.35" dur="2.4s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {nodes.map((n, i) => (
        <circle key={`d${i}`} r="2.6" fill={color}>
          <animateMotion dur="2.2s" begin={`${i * 0.55}s`} repeatCount="indefinite" path={`M${n.x},${n.y} L100,62`} />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.2s" begin={`${i * 0.55}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <circle cx="100" cy="62" r="7" fill={color} fillOpacity="0.9" />
    </svg>
  );
}

/* Semantic retrieval: query rings radiate out, lighting up the relevant memory points. */
function SemanticAnim({ color }: { color: string }) {
  const pts = [ { x: 48, y: 34 }, { x: 158, y: 40 }, { x: 40, y: 92 }, { x: 166, y: 86 }, { x: 122, y: 24 }, { x: 78, y: 102 } ];
  return (
    <svg viewBox="0 0 200 124" width="62%" style={{ maxWidth: 300, overflow: "visible" }} aria-hidden>
      {[0, 1, 2].map(k => (
        <circle key={`r${k}`} cx="100" cy="62" r="6" fill="none" stroke={color} strokeWidth="1.1">
          <animate attributeName="r" values="6;56" dur="3s" begin={`${k}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.55;0" dur="3s" begin={`${k}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {pts.map((p, i) => (
        <circle key={`pt${i}`} cx={p.x} cy={p.y} r="2.6" fill={color}>
          <animate attributeName="opacity" values="0.18;0.95;0.18" dur="2.6s" begin={`${(i % 3) * 0.6}s`} repeatCount="indefinite" />
          <animate attributeName="r" values="2;3.4;2" dur="2.6s" begin={`${(i % 3) * 0.6}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <circle cx="100" cy="62" r="8" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.8" />
      <circle cx="100" cy="62" r="3.4" fill={color} />
    </svg>
  );
}

export default function ServicesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-28 md:py-40 px-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)]" />
      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        <div className="flex justify-between items-baseline mb-12">
          <h2
            className="text-3xl md:text-5xl text-white tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Core Pipeline
          </h2>
          <span className="hidden md:block text-white/40 text-sm">x402 · Casper · MCP</span>
        </div>

        {/* Video cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
          {VIDEO_CARDS.map((card, i) => (
            <motion.div
              key={card.tag}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="liquid-glass rounded-3xl overflow-hidden group"
            >
              <div className="aspect-video overflow-hidden">
                <video
                  src={card.videoUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="auto"
                />
              </div>
              <div className="p-6 md:p-8">
                <span className="text-white/40 text-xs tracking-widest uppercase mb-3 block">
                  {card.tag}
                </span>
                <h3
                  className="text-white text-xl md:text-2xl mb-3 tracking-tight"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {card.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Icon cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {ICON_CARDS.map((card, i) => (
            <motion.div
              key={card.tag}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.7, delay: (i + 2) * 0.15 }}
              className="liquid-glass rounded-3xl overflow-hidden group"
            >
              <div className="aspect-video overflow-hidden flex items-center justify-center relative"
                style={{ background: `radial-gradient(ellipse at 50% 60%, ${card.color}12 0%, transparent 70%)` }}>
                {card.anim === "sync"
                  ? <SyncAnim color={card.color} />
                  : <SemanticAnim color={card.color} />}
                <span style={{ position: "absolute", bottom: 20, left: 24, fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: `${card.color}60`, fontWeight: 600 }}>
                  {card.tag}
                </span>
              </div>
              <div className="p-6 md:p-8">
                <span className="text-xs tracking-widest uppercase mb-3 block" style={{ color: `${card.color}60` }}>
                  {card.tag}
                </span>
                <h3
                  className="text-white text-xl md:text-2xl mb-3 tracking-tight"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {card.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
