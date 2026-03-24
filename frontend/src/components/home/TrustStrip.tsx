"use client";

import { motion } from "framer-motion";
import { Building2, ShieldCheck, Zap } from "lucide-react";

const stats = [
  {
    icon: ShieldCheck,
    label: "Bank-grade posture",
    value: "Encrypted sessions & secure API",
  },
  {
    icon: Zap,
    label: "Low-latency quotes",
    value: "Refreshed as markets move",
  },
  {
    icon: Building2,
    label: "Built for serious portfolios",
    value: "From first trade to scale",
  },
];

export default function TrustStrip() {
  return (
    <section className="relative z-10 border-y border-white/[0.06] bg-[#0c101c]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-8">
        {stats.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: idx * 0.08 }}
            className="flex gap-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <item.icon className="h-5 w-5 text-indigo-400" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-0.5 text-sm text-slate-500">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
