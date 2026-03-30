"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ActivitySquare, Layers, BotMessageSquare, LineChart,
  Scale, GitCompareArrows, Newspaper, ArrowUpRight,
  TrendingUp, Activity, CheckCircle2,
} from "lucide-react";

const steps = [
  { num: "01", title: "Connect Portfolio", desc: "Sync holdings instantly." },
  { num: "02", title: "Run AI Analysis", desc: "Trigger neural engines." },
  { num: "03", title: "Get Alpha Signals", desc: "Actionable buy/sell tags." },
  { num: "04", title: "Telegram Alerts", desc: "Real-time risk drift." },
];

const features = [
  {
    title: "Portfolio Intelligence",
    desc: "Real-time P&L, sector allocation, and live equity analytics.",
    icon: ActivitySquare,
    accent: "indigo",
  },
  {
    title: "PCA Clustering",
    desc: "ML grouping using Principal Component Analysis & K-Means.",
    icon: Layers,
    accent: "emerald",
  },
  {
    title: "NLP Sentiment",
    desc: "VADER-scored news with bullish/bearish classification.",
    icon: Newspaper,
    accent: "violet",
  },
  {
    title: "Ask Stock AI",
    desc: "Gemini RAG-powered chatbot with live financial context.",
    icon: BotMessageSquare,
    accent: "violet",
  },
  {
    title: "Metal Analytics",
    desc: "SHAP/LIME metal trajectories and LSTM forecasts.",
    icon: Scale,
    accent: "amber",
  },
  {
    title: "Asset Forecaster",
    desc: "Deep learning time-series predictions on commodities.",
    icon: LineChart,
    accent: "rose",
  },
  {
    title: "Market Correlation",
    desc: "Linear regression matrices across global tickers.",
    icon: GitCompareArrows,
    accent: "indigo",
  },
];

const accentMap: Record<string, any> = {
  indigo: { icon: "text-indigo-400", border: "hover:border-indigo-500/30", bg: "bg-indigo-500/10" },
  emerald: { icon: "text-emerald-400", border: "hover:border-emerald-500/30", bg: "bg-emerald-500/10" },
  violet: { icon: "text-violet-400", border: "hover:border-violet-500/30", bg: "bg-violet-500/10" },
  amber: { icon: "text-amber-400", border: "hover:border-amber-500/30", bg: "bg-amber-500/10" },
  rose: { icon: "text-rose-400", border: "hover:border-rose-500/30", bg: "bg-rose-500/10" },
};

export default function PlatformSystem() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-24">
      
      {/* ─── SECTION HEADER ──────────────────────────── */}
      <div className="mb-16 flex flex-col items-start justify-between gap-6 overflow-hidden lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/[0.07] px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            PLATFORM CAPABILITIES
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Every tool you need.
            <span className="text-slate-600 block sm:inline sm:ml-3">Nothing you don't.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500">
            Seven professional-grade AI modules — from deep learning LSTM forecasters 
            to VADER NLP sentiment engines — unified in one mission-critical dashboard.
          </p>
        </div>
        
        {/* Compact Account CTA */}
        <Link
          href="/register"
          className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] py-4 px-6 transition hover:border-indigo-500/30 hover:bg-white/[0.05]"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Create your free account</span>
          <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </Link>
      </div>

      {/* ─── THE HOW-IT-WORKS STRIP ───────────────────── */}
      <div className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] lg:grid-cols-4 lg:mb-16">
        {steps.map((step, idx) => (
          <div key={step.num} className="group relative flex flex-col bg-[#070a12]/60 p-5 transition-colors hover:bg-indigo-500/[0.02]">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-600 group-hover:text-indigo-400">{step.num}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-800 transition group-hover:text-indigo-500/40" />
            </div>
            <h3 className="mb-1 text-[13px] font-bold text-slate-200">{step.title}</h3>
            <p className="text-[11px] leading-tight text-slate-600 group-hover:text-slate-500">{step.desc}</p>
            {/* Divider line */}
            <div className={`absolute right-0 top-1/4 bottom-1/4 w-px bg-white/[0.03] ${idx === 3 ? 'hidden' : 'hidden lg:block'}`} />
          </div>
        ))}
      </div>

      {/* ─── THE CAPABILITIES GRID ───────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        
        {/* Spanning Feature Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="sm:col-span-2 lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c101c]/80 p-8 backdrop-blur-md transition-all duration-500 hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(79,70,229,0.15)] group"
        >
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <ActivitySquare className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">Portfolio Intelligence</h3>
            <p className="mb-8 max-w-sm text-sm text-slate-400/90 leading-relaxed">
              Full-stack exposure management with real-time P&L, sector dynamic allocation, 
              and equity-weighted analytics for your entire holdings universe.
            </p>
            <div className="mt-auto flex items-center justify-between border-t border-white/[0.05] pt-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-400/70 uppercase">Explore Module</span>
              <TrendingUp className="h-4 w-4 text-emerald-400 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
            </div>
          </div>
          {/* Ambient Glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl transition-colors duration-500 group-hover:bg-indigo-600/20" />
        </motion.div>

        {/* Regular Feature Cards */}
        {features.slice(1).map((f, idx) => {
          const a = accentMap[f.accent] || accentMap.indigo;
          const Icon = f.icon;
          return (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: (idx + 1) * 0.1 }}
              className={`group flex flex-col rounded-2xl border border-white/[0.07] bg-[#0c101c]/80 p-6 transition-all duration-500 hover:bg-[#070a12] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] ${a.border}`}
            >
              <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] ${a.bg} transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
                <Icon className={`h-5 w-5 ${a.icon}`} />
              </div>
              <h3 className="mb-2 text-[15px] font-bold text-white tracking-tight">{f.title}</h3>
              <p className="flex-grow text-[13px] leading-[1.7] text-slate-400/90">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>

    </section>
  );
}
