"use client";

import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  LineChart, 
  ActivitySquare, 
  ShieldAlert, 
  Newspaper, 
  Send 
} from "lucide-react";

const features = [
  {
    title: "AI Portfolio Insights",
    description: "Deep learning models analyze your holdings to uncover hidden correlations and optimize returns.",
    icon: <BrainCircuit className="w-6 h-6 text-indigo-400" />,
    color: "from-indigo-500/20 to-blue-500/20",
    borderHover: "group-hover:border-indigo-500/50"
  },
  {
    title: "Smart Buy/Sell Signals",
    description: "Get predictive entry and exit points powered by historical data and real-time market sentiment.",
    icon: <LineChart className="w-6 h-6 text-emerald-400" />,
    color: "from-emerald-500/20 to-teal-500/20",
    borderHover: "group-hover:border-emerald-500/50"
  },
  {
    title: "Real-Time Tracking",
    description: "Sub-second latency updates on global equities, ensuring you never miss a market movement.",
    icon: <ActivitySquare className="w-6 h-6 text-blue-400" />,
    color: "from-blue-500/20 to-cyan-500/20",
    borderHover: "group-hover:border-blue-500/50"
  },
  {
    title: "Risk Analysis Engine",
    description: "Advanced stress-testing for your portfolio against macro-economic shocks and volatility.",
    icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
    color: "from-rose-500/20 to-orange-500/20",
    borderHover: "group-hover:border-rose-500/50"
  },
  {
    title: "Sentiment Analysis",
    description: "NLP algorithms scan thousands of news articles and social feeds to gauge market mood instantly.",
    icon: <Newspaper className="w-6 h-6 text-purple-400" />,
    color: "from-purple-500/20 to-pink-500/20",
    borderHover: "group-hover:border-purple-500/50"
  },
  {
    title: "Telegram Alerts",
    description: "Receive critical actionable alerts directly to your devices via intelligent push notifications.",
    icon: <Send className="w-6 h-6 text-sky-400" />,
    color: "from-sky-500/20 to-cyan-500/20",
    borderHover: "group-hover:border-sky-500/50"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-5xl font-bold text-white mb-6"
          >
            Intelligence over intuition
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            A full suite of institutional-grade tools built to give retail investors the ultimate edge in active markets.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`group relative bg-[#0F1423]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 transition-all duration-300 ${feature.borderHover} hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]`}
            >
              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl pointer-events-none" />
              
              <div className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-br ${feature.color} border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
                {feature.title}
              </h3>
              
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
