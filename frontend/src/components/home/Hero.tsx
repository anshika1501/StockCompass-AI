"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 -m-32 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 left-0 -m-32 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000" />
        <div 
          className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-start text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            StockCompass AI is now live 1.0
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6 font-inter">
             Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">AI-Powered</span><br />
             Stock Intelligence<br />
             Platform
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
            Track, analyze, and grow your portfolio with real-time insights, predictive models, and intelligent automation built for the modern investor.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/register"
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium rounded-full shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all duration-300"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#demo"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
              View Demo
            </Link>
          </div>
        </motion.div>

        {/* Right Side Dashboard Preview Preview */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative hidden lg:block perspective-[1000px]"
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="w-full h-full relative z-20"
          >
            <div className="glass-panel border border-white/10 bg-[#0F1423]/80 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl flex flex-col gap-6 rotate-y-[-5deg] rotate-x-[5deg] transform-gpu">
              {/* Header Mock */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-white font-semibold">Total Portfolio Value</h3>
                  <div className="text-3xl font-bold text-white mt-1 flex items-baseline gap-2">
                    $124,560.89 
                    <span className="text-emerald-400 text-sm font-medium flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> +12.4%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              {/* Chart Mock */}
              <div className="h-48 w-full bg-gradient-to-t from-indigo-500/10 to-transparent rounded-xl relative overflow-hidden flex items-end border border-white/5">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute inset-0">
                  <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                    d="M0,80 C10,70 20,90 30,60 C40,30 50,60 60,40 C70,20 80,40 100,10"
                    fill="none" 
                    stroke="url(#gradient)" 
                    strokeWidth="3"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Simulated Chart Bars */}
                <div className="w-full flex justify-between items-end px-4 h-full py-4 opacity-50 absolute inset-0 z-[-1]">
                  {[40, 60, 30, 80, 50, 90, 70, 100].map((v, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${v}%` }}
                      transition={{ duration: 1, delay: 0.5 + (i*0.1) }}
                      className="w-[8%] bg-indigo-500/10 rounded-t-sm"
                    />
                  ))}
                </div>
              </div>

              {/* Stats Mock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-slate-400 text-sm mb-1">AI Recommendation</div>
                  <div className="text-emerald-400 font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" /> 
                    STRONG BUY
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-slate-400 text-sm mb-1">Risk Score</div>
                  <div className="text-amber-400 font-semibold">Low (2.4/10)</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Element 1 */}
          <motion.div 
            animate={{ y: [-15, 15, -15], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 bg-[#0F1423] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl z-30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">TSLA Sell Target</div>
                <div className="text-sm font-bold text-white">$250.00</div>
              </div>
            </div>
          </motion.div>

          {/* Floating Element 2 */}
           <motion.div 
            animate={{ y: [15, -15, 15], rotate: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-8 -left-8 bg-[#0F1423] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl z-30"
          >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                 <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 15 12 7 21 15"></polygon></svg>
               </div>
               <div>
                 <div className="text-xs text-slate-400">NVDA Breakout</div>
                 <div className="text-sm font-bold text-emerald-400">+1.2M Vol</div>
               </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
