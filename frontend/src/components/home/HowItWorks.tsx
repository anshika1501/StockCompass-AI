"use client";

import { motion } from "framer-motion";
import { UserPlus, Briefcase, Sparkles, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Onboard in minutes",
    desc: "Create your account and align the app to how you actually trade—no jargon-heavy setup wizards.",
    accent: "text-indigo-400",
  },
  {
    icon: Briefcase,
    title: "Model your book",
    desc: "Import holdings or build sleeves manually. Templates mirror how Indian investors segment large caps, mid caps, and themes.",
    accent: "text-sky-400",
  },
  {
    icon: Sparkles,
    title: "Let AI interpret",
    desc: "Technical structure, flows, and news sentiment compress into clear stances you can accept, edit, or ignore.",
    accent: "text-violet-400",
  },
  {
    icon: CheckCircle2,
    title: "Act with context",
    desc: "Alerts and dashboards stay synchronized so execution matches the story you signed off on—not yesterday’s chart.",
    accent: "text-emerald-400",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-y border-white/[0.06] bg-[#0a0e18] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center lg:mb-20">
          <p className="section-label mb-3">Workflow</p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
          >
            From first login to a calm routine
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="mt-4 text-base text-slate-400 sm:text-lg"
          >
            We obsess over reducing noise. Each step exists so the next one feels obvious.
          </motion.p>
        </div>

        <div className="relative mt-8 lg:mt-12">
          <div className="pointer-events-none absolute left-0 top-[4.5rem] hidden h-px w-full bg-gradient-to-r from-indigo-500/25 via-violet-500/20 to-emerald-500/25 lg:block" />

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 mb-6 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0c101c] shadow-lg shadow-black/20 transition-transform duration-300 hover:-translate-y-1">
                  <step.icon className={`h-7 w-7 ${step.accent}`} strokeWidth={1.75} />
                  <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#0a0e18] bg-indigo-600 text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-slate-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
