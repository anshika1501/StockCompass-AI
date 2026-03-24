"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  LineChart,
  ActivitySquare,
  ShieldAlert,
  Newspaper,
  Send,
} from "lucide-react";

const features = [
  {
    title: "AI portfolio insights",
    description:
      "Surface drivers behind your holdings—correlations, concentration, and scenario context—in language you can act on.",
    icon: BrainCircuit,
    accent: "text-indigo-400",
    tint: "from-indigo-500/15 to-blue-500/10",
    borderHover: "hover:border-indigo-500/35",
  },
  {
    title: "Signal layer",
    description:
      "Structured buy/sell discipline from price action, liquidity, and sentiment—not a single noisy headline.",
    icon: LineChart,
    accent: "text-emerald-400",
    tint: "from-emerald-500/15 to-teal-500/10",
    borderHover: "hover:border-emerald-500/35",
  },
  {
    title: "Live market sync",
    description:
      "Quotes and marks that keep pace with the session so your dashboard matches the tape you care about.",
    icon: ActivitySquare,
    accent: "text-sky-400",
    tint: "from-sky-500/15 to-cyan-500/10",
    borderHover: "hover:border-sky-500/35",
  },
  {
    title: "Risk & stress views",
    description:
      "Stress-style lenses on volatility and drawdowns so you know when to size up—or step aside.",
    icon: ShieldAlert,
    accent: "text-rose-400",
    tint: "from-rose-500/15 to-orange-500/10",
    borderHover: "hover:border-rose-500/35",
  },
  {
    title: "Sentiment intelligence",
    description:
      "NLP across news and social streams, scored and summarized so you see regime shifts early.",
    icon: Newspaper,
    accent: "text-violet-400",
    tint: "from-violet-500/15 to-fuchsia-500/10",
    borderHover: "hover:border-violet-500/35",
  },
  {
    title: "Alerts that ship",
    description:
      "Telegram and in-app nudges for the events that matter—levels, risk flags, and portfolio drift.",
    icon: Send,
    accent: "text-cyan-400",
    tint: "from-cyan-500/15 to-blue-500/10",
    borderHover: "hover:border-cyan-500/35",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative z-10 scroll-mt-24 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center lg:mb-20">
          <p className="section-label mb-3">Platform</p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
          >
            Everything in one disciplined stack
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            The same primitives institutional desks use—research, risk, and execution context—presented for
            individuals who treat investing as a process.
          </motion.p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {features.map((feature, idx) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(idx * 0.06, 0.36) }}
              whileHover={{ y: -3 }}
              className={`group relative rounded-2xl border border-white/[0.06] bg-[#0c101c]/60 p-7 backdrop-blur-sm transition-colors duration-300 ${feature.borderHover}`}
            >
              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br ${feature.tint}`}
              >
                <feature.icon className={`h-6 w-6 ${feature.accent}`} strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
