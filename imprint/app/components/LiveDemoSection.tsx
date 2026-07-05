"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const API = process.env.NEXT_PUBLIC_IMPRINT_API || "http://localhost:4021";

const GOLD = "#cf8f6d";
const TEAL = "#4eecd8";

type Row = {
  key: number;
  op: "store" | "recall";
  label: string;
  amount: string;
  network: string;
  tx: string;
  detail?: string;
  simulated: boolean;
};

const STEPS = [
  "POST /memories",
  "402 Payment Required",
  "Sign x402 payment · CSPR",
  "Facilitator verify + settle",
  "200 OK — receipt on Casper",
];

function cspr(atomic: string): string {
  const n = Number(atomic);
  if (!isFinite(n)) return atomic;
  return (n / 1e9).toFixed(4) + " CSPR";
}

function mockTx(): string {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 60; i++) s += hex[Math.floor(Math.random() * 16)];
  return "mock-" + s;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function LiveDemoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [status, setStatus] = useState<"checking" | "live" | "sim">("checking");
  const [text, setText] = useState("The user prefers Groq over Bedrock for lower latency");
  const [query, setQuery] = useState("which inference provider does the user prefer?");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<number>(-1);
  const [rows, setRows] = useState<Row[]>([]);
  const keyRef = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API}/healthz`, { signal: AbortSignal.timeout(1500) });
        if (alive) setStatus(r.ok ? "live" : "sim");
      } catch {
        if (alive) setStatus("sim");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function animateSteps() {
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await sleep(320);
    }
  }

  async function runStore(value: string) {
    const anim = animateSteps();
    let row: Row;
    try {
      const res = await fetch(`${API}/demo/store`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: value }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error("bad status");
      const d = await res.json();
      row = { key: keyRef.current++, op: "store", label: value, amount: d.amount, network: d.network, tx: d.tx, simulated: false };
      setStatus("live");
    } catch {
      row = { key: keyRef.current++, op: "store", label: value, amount: "1000000", network: "casper:casper-test", tx: mockTx(), simulated: true };
      setStatus("sim");
    }
    await anim;
    setStep(-1);
    setRows((r) => [row, ...r].slice(0, 8));
  }

  async function runRecall(value: string) {
    const anim = animateSteps();
    let row: Row;
    try {
      const res = await fetch(`${API}/demo/recall`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: value }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error("bad status");
      const d = await res.json();
      const top = d.results?.[0];
      row = {
        key: keyRef.current++,
        op: "recall",
        label: value,
        amount: d.amount,
        network: d.network,
        tx: d.tx,
        detail: top ? `↳ ${top.text}  (${Number(top.score).toFixed(3)})` : "↳ no memories yet",
        simulated: false,
      };
      setStatus("live");
    } catch {
      row = {
        key: keyRef.current++,
        op: "recall",
        label: value,
        amount: "500000",
        network: "casper:casper-test",
        tx: mockTx(),
        detail: "↳ The user prefers Groq over Bedrock for lower latency  (0.742)",
        simulated: true,
      };
      setStatus("sim");
    }
    await anim;
    setStep(-1);
    setRows((r) => [row, ...r].slice(0, 8));
  }

  async function guarded(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  async function runFullDemo() {
    await guarded(async () => {
      await runStore("The user prefers Groq over Bedrock for lower latency");
      await sleep(400);
      await runStore("The project deadline is July 8, 2026");
      await sleep(400);
      await runRecall("which inference provider does the user prefer?");
    });
  }

  return (
    <section id="try" ref={ref} className="py-24 md:py-32 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 55% 45% at 50% 40%, rgba(78,236,216,0.05) 0%, transparent 70%)" }}
      />
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <p className="text-xs tracking-widest uppercase text-white/30 mb-3">Live demo</p>
          <h2
            className="text-3xl md:text-5xl text-white tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Watch an agent{" "}
            <em className="italic font-light" style={{ color: GOLD }}>
              pay for its memory.
            </em>
          </h2>
          <p className="text-white/40 text-sm mt-4 max-w-xl">
            Each action runs the real x402 handshake: a 402, a signed CSPR micro-payment,
            settlement on Casper, and an on-chain receipt. No accounts, no keys.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="liquid-glass rounded-3xl p-5 md:p-7"
        >
          {/* status + controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: status === "live" ? "#4ade80" : status === "sim" ? GOLD : "#666" }}
              />
              <span className="text-white/50">
                {status === "live" ? `live · backend ${API.replace(/^https?:\/\//, "")}` : status === "sim" ? "simulated · run `npm run http` for real receipts" : "connecting…"}
              </span>
            </div>
            <button
              onClick={runFullDemo}
              disabled={busy}
              className="rounded-full px-5 py-2 text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: `${TEAL}22`, border: `1px solid ${TEAL}55`, color: TEAL }}
            >
              {busy ? "running…" : "▶ Run the full demo"}
            </button>
          </div>

          {/* inputs */}
          <div className="grid md:grid-cols-2 gap-3 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] uppercase tracking-wider text-white/30">Store a memory</label>
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white/80 outline-none focus:border-white/25"
                />
                <button
                  onClick={() => guarded(() => runStore(text))}
                  disabled={busy}
                  className="rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap disabled:opacity-40"
                  style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}55`, color: GOLD }}
                >
                  Pay &amp; store
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] uppercase tracking-wider text-white/30">Recall a memory</label>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white/80 outline-none focus:border-white/25"
                />
                <button
                  onClick={() => guarded(() => runRecall(query))}
                  disabled={busy}
                  className="rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap disabled:opacity-40"
                  style={{ background: `${TEAL}22`, border: `1px solid ${TEAL}55`, color: TEAL }}
                >
                  Pay &amp; recall
                </button>
              </div>
            </div>
          </div>

          {/* x402 step ticker */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-5 min-h-[22px]">
            {STEPS.map((s, i) => (
              <span key={s} className="flex items-center gap-2 text-[11px]">
                <span
                  className="transition-colors duration-200"
                  style={{ color: step < 0 ? "rgba(255,255,255,0.18)" : i <= step ? TEAL : "rgba(255,255,255,0.18)" }}
                >
                  {s}
                </span>
                {i < STEPS.length - 1 && <span className="text-white/15">→</span>}
              </span>
            ))}
          </div>

          {/* receipt feed */}
          <div className="rounded-2xl bg-black/25 border border-white/[0.06] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-white/35">Payment receipts</span>
              <span className="text-[11px] text-white/25">amount · tx · settled</span>
            </div>
            <div className="divide-y divide-white/[0.04] min-h-[120px]">
              <AnimatePresence initial={false}>
                {rows.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 text-center text-white/25 text-sm">
                    No payments yet — hit <span style={{ color: TEAL }}>Run the full demo</span>.
                  </motion.div>
                )}
                {rows.map((r) => (
                  <motion.div
                    key={r.key}
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    transition={{ duration: 0.35 }}
                    className="px-4 py-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-3 flex-wrap text-sm">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{
                          color: r.op === "store" ? GOLD : TEAL,
                          background: (r.op === "store" ? GOLD : TEAL) + "18",
                          border: `1px solid ${(r.op === "store" ? GOLD : TEAL)}33`,
                        }}
                      >
                        {r.op}
                      </span>
                      <span className="text-white/70 truncate max-w-[240px]">{r.label}</span>
                      <span className="text-white/45 text-xs ml-auto">{cspr(r.amount)}</span>
                      {r.tx.startsWith("mock-") ? (
                        <span className="font-mono text-[11px] text-white/30" title="testnet mock tx">
                          {r.tx.slice(0, 14)}…
                        </span>
                      ) : (
                        <a
                          href={`https://testnet.cspr.live/deploy/${r.tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] hover:underline"
                          style={{ color: TEAL }}
                        >
                          {r.tx.slice(0, 14)}…
                        </a>
                      )}
                      <span className="text-[11px]" style={{ color: "#4ade80" }}>
                        ✓ settled
                      </span>
                    </div>
                    {r.detail && <div className="text-white/40 text-xs pl-1">{r.detail}</div>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
