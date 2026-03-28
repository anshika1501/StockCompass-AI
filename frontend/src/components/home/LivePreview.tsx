"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { ArrowUpRight, BarChart2, TrendingUp, AlertTriangle } from "lucide-react";

const mockData = [
  { day: '1', value: 10000.00 },
  { day: '2', value: 10125.40 },
  { day: '3', value: 10050.20 },
  { day: '4', value: 10210.85 },
  { day: '5', value: 10180.15 },
  { day: '6', value: 10350.60 },
  { day: '7', value: 10290.30 },
  { day: '8', value: 10500.90 },
  { day: '9', value: 10450.40 },
  { day: '10', value: 10620.10 },
  { day: '11', value: 10580.75 },
  { day: '12', value: 10740.20 },
  { day: '13', value: 10690.80 },
  { day: '14', value: 10810.30 },
  { day: '15', value: 10760.50 },
  { day: '16', value: 10920.90 },
  { day: '17', value: 10850.40 },
  { day: '18', value: 11050.20 },
  { day: '19', value: 10980.60 },
  { day: '20', value: 11150.30 },
  { day: '21', value: 11110.80 },
  { day: '22', value: 11280.40 },
  { day: '23', value: 11235.10 },
  { day: '24', value: 11420.70 },
  { day: '25', value: 11380.20 },
  { day: '26', value: 11550.60 },
  { day: '27', value: 11510.90 },
  { day: '28', value: 11680.10 },
  { day: '29', value: 11620.40 },
  { day: '30', value: 11800.50 },
];

export default function LivePreview() {
  const [activeTab, setActiveTab] = useState("1M");

  return (
    <section id="demo" className="relative scroll-mt-24 overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,640px)] w-[min(90vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.06] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <p className="section-label mb-3">Console</p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            One chart. Full book context.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="mt-4 text-base text-slate-400 sm:text-lg"
          >
            Equity curve, sleeve risk, and flow—all tied to the same INR marks you&apos;ll see once you connect your
            portfolio.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="rounded-3xl border border-white/[0.08] bg-[#0c101c]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10"
        >
          <div className="mb-8 flex flex-col justify-between gap-6 lg:mb-10 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total equity (INR)</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl lg:text-5xl">
                  ₹1,00,45,009
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-sm font-semibold tabular-nums text-emerald-400">
                  <TrendingUp className="mr-1 h-4 w-4" /> +14.2%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-[#070a12]/80 p-1">
              {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                    activeTab === tab
                      ? "bg-indigo-600/25 text-indigo-200 shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            <div className="relative h-[280px] w-full min-h-[280px] lg:col-span-3 lg:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="liveValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0c101c",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "13px",
                    }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#f8fafc" }}
                    formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Mark"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#liveValue)"
                    animationDuration={1800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-[#070a12]/80 p-4 transition-colors hover:border-emerald-500/30">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">24h P&L</span>
                </div>
                <p className="font-display text-xl font-bold tabular-nums text-white">+₹1,24,500</p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-[#070a12]/80 p-4 transition-colors hover:border-rose-500/30">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15">
                    <AlertTriangle className="h-4 w-4 text-rose-400" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Book risk</span>
                </div>
                <p className="font-display text-xl font-bold text-white">Balanced</p>
                <p className="mt-1 text-xs text-slate-500">VaR-aware view</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "42%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-[#070a12]/80 p-4 transition-colors hover:border-blue-500/30">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
                    <BarChart2 className="h-4 w-4 text-blue-400" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Hit rate (30d)</span>
                </div>
                <p className="font-display text-xl font-bold tabular-nums text-white">68.4%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
