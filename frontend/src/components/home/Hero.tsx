"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, TrendingUp, IndianRupee } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pb-16 pt-28 md:pt-32 lg:pb-24 lg:pt-36">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -right-40 top-0 h-[min(100vw,520px)] w-[min(100vw,520px)] rounded-full bg-indigo-600/15 blur-[100px]" />
        <div className="absolute -left-32 bottom-0 h-[min(90vw,420px)] w-[min(90vw,420px)] rounded-full bg-blue-600/10 blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:url('https://grainy-gradients.vercel.app/noise.svg')]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col text-left"
        >
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-medium text-slate-400">
              Portfolio intelligence · INR-first workflows
            </span>
          </div>

          <h1 className="font-display text-[2.5rem] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem] xl:text-6xl">
            Clarity for every{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-white to-blue-300 bg-clip-text text-transparent">
              position you hold
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            One workspace for Indian portfolios: live quotes, AI context, sentiment, and risk
            signals—so decisions feel considered, not improvised.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              See the console
            </Link>
          </div>

          <p className="mt-6 text-xs text-slate-600">
            Educational tooling only—not investment advice. Markets involve risk.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden perspective-[1200px] lg:block"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            className="relative z-20"
          >
            <div className="glass-panel flex rotate-y-[-6deg] rotate-x-[4deg] transform-gpu flex-col gap-6 rounded-2xl border border-white/10 bg-[#0c101c]/90 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Total portfolio (INR)
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-white">
                      ₹1,03,45,092
                    </span>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-400">
                      <TrendingUp className="mr-0.5 h-3 w-3" /> +12.4%
                    </span>
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-indigo-500/10">
                  <BarChart3 className="h-5 w-5 text-indigo-400" strokeWidth={2} />
                </div>
              </div>

              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-t from-indigo-500/[0.08] to-transparent">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden
                >
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.8, ease: "easeInOut", delay: 0.35 }}
                    d="M0,80 C10,70 20,90 30,60 C40,30 50,60 60,40 C70,20 80,40 100,10"
                    fill="none"
                    stroke="url(#heroGradient)"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <defs>
                    <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a5b4fc" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="pointer-events-none absolute inset-0 flex items-end justify-between px-3 pb-3 opacity-40">
                  {[38, 58, 32, 72, 48, 88, 62, 95].map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${v}%` }}
                      transition={{ duration: 0.9, delay: 0.35 + i * 0.06 }}
                      className="w-[7%] rounded-t-sm bg-indigo-500/15"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs text-slate-500">AI stance</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    Overweight quality
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs text-slate-500">Risk score</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-amber-300/90">
                    Moderate · 3.1 / 10
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [-12, 12, -12] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
            className="absolute -right-4 -top-8 z-30 rounded-xl border border-white/10 bg-[#0c101c]/95 p-4 shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15">
                <IndianRupee className="h-4 w-4 text-rose-300" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Alert · INFY
                </p>
                <p className="text-sm font-semibold tabular-nums text-white">₹1,482 target zone</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [12, -12, 12] }}
            transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut", delay: 0.8 }}
            className="absolute -bottom-6 -left-4 z-30 rounded-xl border border-white/10 bg-[#0c101c]/95 p-4 shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
                <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Momentum
                </p>
                <p className="text-sm font-semibold text-emerald-400">Strong bid flow</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
