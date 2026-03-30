"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, Activity, Target, Zap } from "lucide-react";

const periods = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;

const sideWidgets = [
  {
    label: "Volatility Score",
    value: "3.1 / 10",
    sub: "Low regime",
    icon: Activity,
    color: "text-emerald-400",
    bar: 31,
    barColor: "from-emerald-500 to-teal-500",
  },
  {
    label: "Hit Rate (30d)",
    value: "68.4%",
    sub: "above benchmark",
    icon: Target,
    color: "text-indigo-400",
    bar: 68,
    barColor: "from-indigo-500 to-blue-500",
  },
  {
    label: "Correlation Index",
    value: "0.74",
    sub: "high coherence",
    icon: Zap,
    color: "text-amber-400",
    bar: 74,
    barColor: "from-amber-500 to-orange-500",
  },
];

export default function LivePreview() {
  const [activePeriod, setActivePeriod] = useState("1M");

  return (
    <section id="demo" className="relative scroll-mt-24 overflow-hidden py-24 lg:py-32">
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.05] blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-10">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3.5 py-1.5 text-xs font-semibold tracking-widest text-emerald-300"
          >
            LIVE TERMINAL
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            One chart. Full context.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 text-base text-slate-500 sm:text-lg"
          >
            Equity curve, volatility, and flow — tied to live INR marks.
          </motion.p>
        </div>

        {/* Terminal container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c101c]/90 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          {/* Terminal titlebar */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#070a12]/60 px-6 py-3.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="ml-3 font-mono text-xs text-slate-500">
              stockcompass — portfolio terminal — [live]
            </span>
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
              LIVE
            </span>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {/* Top row */}
            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Total equity (INR)
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-4">
                  <span className="font-display text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
                    ₹1,00,45,009
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1 text-sm font-bold text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +14.2% YTD
                  </span>
                </div>
              </div>

              {/* Period tabs */}
              <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-[#070a12]/80 p-1">
                {periods.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePeriod(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      activePeriod === p
                        ? "bg-indigo-600/20 text-indigo-300 shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Full-width widget row */}
            <div className="grid gap-4 sm:grid-cols-3">
              {sideWidgets.map((w, i) => {
                const Icon = w.icon;
                return (
                  <motion.div
                    key={w.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="group rounded-xl border border-white/[0.06] bg-[#070a12]/80 p-5 transition-colors hover:border-white/[0.12]"
                  >
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <Icon className={`h-4 w-4 ${w.color}`} strokeWidth={1.75} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {w.label}
                      </span>
                    </div>
                    <p className={`font-display text-3xl font-bold tabular-nums ${w.color}`}>
                      {w.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{w.sub}</p>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${w.bar}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, delay: 0.4 + i * 0.1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${w.barColor}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
