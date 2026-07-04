"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function PhilosophySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl text-white tracking-tight mb-16 md:mb-24"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Autonomy{" "}
          <em className="italic text-white/40 font-light">x</em>{" "}
          Economy.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-3xl overflow-hidden aspect-[4/3]"
          >
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col justify-center gap-8"
          >
            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-4">
                Memory As A Paid Primitive
              </p>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                Memory becomes something an agent buys, not something a human
                provisions. With Imprint, an agent stores and recalls its own context by
                signing an x402 micro-payment in CSPR — no account, no API key, and no
                human standing between the agent and what it remembers.
              </p>
            </div>

            <div className="w-full h-px bg-white/10" />

            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-4">
                Settled On Casper
              </p>
              <p className="text-white/70 text-sm md:text-base leading-relaxed">
                Every store and recall is a machine-to-machine transaction: the agent
                calls an MCP tool, pays per use, and each write settles on Casper as an
                on-chain receipt. When agents can pay for their own memory, they become
                truly autonomous economic actors.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
