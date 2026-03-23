"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Alex M.",
    role: "Day Trader",
    text: "The real-time insights alone paid for the platform in a single day. AI sentiment analysis caught the NVDA breakout before the rest of the market.",
  },
  {
    name: "Sarah L.",
    role: "Portfolio Manager",
    text: "StockCompass has completely replaced our legacy risk models. The stress-testing engine is intuitive yet incredibly powerful for volatile tech equities.",
  },
  {
    name: "James T.",
    role: "Retail Investor",
    text: "I was skeptical about AI trading, but this isn't just a black box. It explains the 'why' behind every signal. Absolutely game-changing transparency.",
  },
  {
    name: "Elena R.",
    role: "Swing Trader",
    text: "Telegram alerts are perfectly timed. I no longer stare at charts all day. StockCompass does the heavy lifting while I focus on execution.",
  },
  {
    name: "Marcus K.",
    role: "Crypto & Stock Algo",
    text: "The NLP scanning of financial news is unmatched. It filters out the noise and gives me conviction on high-probability setups.",
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0B0F19]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16 text-center">
        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
          Trusted by Top Traders
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Join thousands of investors generating alpha with StockCompass AI.
        </p>
      </div>

      <div className="relative flex overflow-x-hidden w-full group">
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#0B0F19] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#0B0F19] to-transparent z-10 pointer-events-none" />
        
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 40, repeat: Infinity }}
          className="flex gap-6 w-max py-4 group-hover:[animation-play-state:paused]"
        >
          {/* Duplicate for infinite loop effect */}
          {[...testimonials, ...testimonials, ...testimonials].map((t, idx) => (
            <div 
              key={idx}
              className="w-[350px] lg:w-[400px] bg-[#0F1423]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-8 flex-shrink-0"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 overflow-hidden">
                   <div className="w-full h-full bg-[#121827] flex items-center justify-center text-lg font-bold text-white">
                      {t.name[0]}
                   </div>
                </div>
                <div>
                  <h4 className="text-white font-medium">{t.name}</h4>
                  <p className="text-slate-500 text-sm font-medium">{t.role}</p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed text-[15px]">
                "{t.text}"
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
