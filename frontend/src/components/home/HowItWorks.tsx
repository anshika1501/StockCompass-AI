"use client";

import { motion } from "framer-motion";
import { UserPlus, Briefcase, Sparkles, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: <UserPlus className="w-6 h-6 text-indigo-400" />,
    title: "Create Account",
    desc: "Sign up in seconds and connect your brokerage securely with bank-grade encryption."
  },
  {
    icon: <Briefcase className="w-6 h-6 text-blue-400" />,
    title: "Build Portfolio",
    desc: "Import existing assets or build from scratch using our curated industry templates."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
    title: "Get AI Insights",
    desc: "Our engine scans technicals and sentiment to generate actionable daily recommendations."
  },
  {
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
    title: "Execute Smart",
    desc: "Place optimized trades based on probabilistic models and predictive price actions."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0F1423]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-5xl font-bold text-white mb-4"
          >
            From Start to Scale
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 max-w-xl mx-auto text-lg"
          >
            A frictionless flow designed to get you from onboarding to optimized investing in minutes.
          </motion.p>
        </div>

        <div className="relative mt-20">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20" />
          
          <div className="grid lg:grid-cols-4 gap-12 lg:gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Number indicator */}
                <div className="w-24 h-24 rounded-2xl bg-[#121827] border border-white/10 flex items-center justify-center mb-8 relative z-10 group-hover:-translate-y-2 transition-transform duration-300 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-2xl" />
                  {step.icon}
                  
                  {/* Step badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold border-4 border-[#0F1423] shadow-lg">
                    {idx + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm max-w-[250px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
