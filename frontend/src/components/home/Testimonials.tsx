"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex M.",
    role: "Active trader",
    text: "The sentiment stack called out rotation before my watchlist did. It’s the first retail tool that feels like a desk, not a toy.",
  },
  {
    name: "Sarah L.",
    role: "Portfolio lead",
    text: "We replaced a patchwork of spreadsheets. Stress views and concentration are finally in the same currency as our research notes.",
  },
  {
    name: "James T.",
    role: "Long-only investor",
    text: "Signals come with reasoning. I can disagree with the model and still trust the process—that’s rare in consumer fintech.",
  },
  {
    name: "Elena R.",
    role: "Swing trader",
    text: "Alerts respect my quiet hours. I trade less, but with better timing—exactly what I wanted from automation.",
  },
  {
    name: "Marcus K.",
    role: "Quant hobbyist",
    text: "News NLP is filtered, not firehosed. I get directional conviction without drowning in headlines.",
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[#070a12] py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 mx-auto mb-12 max-w-2xl px-5 text-center lg:mb-16 lg:px-8">
        <p className="section-label mb-3">Proof</p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
          Teams that treat markets as a craft
        </h2>
        <p className="mt-4 text-base text-slate-400 sm:text-lg">
          Operators, founders, and serious individuals use StockCompass to keep narratives honest.
        </p>
      </div>

      <div className="group relative flex w-full overflow-x-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#070a12] to-transparent md:w-32" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#070a12] to-transparent md:w-32" />

        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 48, repeat: Infinity }}
          className="flex w-max gap-5 py-2 group-hover:[animation-play-state:paused]"
        >
          {[...testimonials, ...testimonials, ...testimonials].map((t, idx) => (
            <article
              key={`${t.name}-${idx}`}
              className="flex w-[min(100vw-2.5rem,22rem)] shrink-0 flex-col rounded-2xl border border-white/[0.07] bg-[#0c101c]/80 p-6 shadow-xl backdrop-blur-sm sm:w-[380px] md:p-8"
            >
              <Quote className="mb-4 h-6 w-6 text-indigo-500/40" strokeWidth={1.25} />
              <p className="flex-1 text-[15px] leading-relaxed text-slate-300">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#070a12] font-display text-sm font-semibold text-white">
                  {t.name[0]}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs font-medium capitalize text-slate-500">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
