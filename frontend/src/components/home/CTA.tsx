"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-32 relative overflow-hidden bg-[#0F1423] z-10">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-20">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl lg:text-6xl font-black text-white mb-8 leading-tight tracking-tight font-inter"
        >
          Start building your intelligent portfolio today
        </motion.h2>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <div className="relative group w-full sm:w-auto">
            {/* Button Glow shadow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500 group-hover:duration-200" />
            
            <Link 
              href="/register"
              className="relative flex items-center justify-center w-full px-10 py-5 bg-black text-white rounded-full leading-none font-bold text-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
            >
               <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-blue-600 opacity-90 transition-opacity duration-300 pointer-events-none group-hover:opacity-100" />
               <span className="relative flex items-center gap-3">
                 Get Started
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </span>
            </Link>
          </div>
          <span className="text-slate-500 font-medium">Free 14-day trial. No credit card required.</span>
        </motion.div>
      </div>
    </section>
  );
}
