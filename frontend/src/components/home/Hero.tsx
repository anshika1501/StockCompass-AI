"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { TrendingUp, TrendingDown, BarChart3, Activity, Zap, Brain, AlertTriangle } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import dynamic from "next/dynamic";
import { useRef } from "react";

const CinematicBackground = dynamic(() => import("./CinematicBackground"), { ssr: false });

const sparkData = [
  { v: 78 }, { v: 82 }, { v: 79 }, { v: 88 }, { v: 84 },
  { v: 91 }, { v: 86 }, { v: 97 }, { v: 90 }, { v: 103 },
  { v: 96 }, { v: 108 }, { v: 100 }, { v: 112 }, { v: 118 },
];

// ────────────────────────────────────────────────────────────────────────
// 🌍 INNOVATIVE 3D HOLOGRAPHIC EARTH & COMPASS RADAR
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// 🌍 INNOVATIVE 3D GLOBE & ORBITING STOCK RADAR
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// 🌍 TRANSLUCENT HOLOGRAPHIC GLOBE & STARLIGHT STOCK RADAR
// ────────────────────────────────────────────────────────────────────────

// Moving Stock Values orbiting the earth like celestial bodies
const orbitingStocks = [
  { symbol: "RELIANCE", price: "2847.50", change: "+1.24%", color: "text-green-400", duration: 40, spread: 0, radius: 250 },
  { symbol: "INFY", price: "1482.10", change: "-0.54%", color: "text-red-400", duration: 55, spread: 72, radius: 310 },
  { symbol: "HDFCBANK", price: "1645.00", change: "+0.85%", color: "text-green-400", duration: 45, spread: 144, radius: 280 },
  { symbol: "TCS", price: "3890.25", change: "+2.12%", color: "text-green-400", duration: 60, spread: 216, radius: 350 },
  { symbol: "TATAMOTORS", price: "924.15", change: "-1.27%", color: "text-red-400", duration: 50, spread: 288, radius: 320 },
];

// Fixed star coordinates to prevent hydration mismatch
const constellationStars = [
  { top: "15%", left: "20%", size: 2, delay: 0 }, { top: "10%", left: "80%", size: 3, delay: 1 },
  { top: "45%", left: "10%", size: 1.5, delay: 2 }, { top: "75%", left: "85%", size: 2.5, delay: 0.5 },
  { top: "85%", left: "25%", size: 2, delay: 1.5 }, { top: "25%", left: "90%", size: 1.5, delay: 0.2 },
  { top: "60%", left: "95%", size: 1, delay: 0.7 }, { top: "50%", left: "0%", size: 2, delay: 2.5 }
];

function EarthRadar() {
  return (
    <div className="relative z-0 flex h-[500px] w-full items-center justify-center pointer-events-none opacity-100 mix-blend-screen overflow-visible lg:-translate-y-6">
      
      {/* ── Background Deep Space Stars ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         {constellationStars.map((star, i) => (
           <motion.div 
             key={i} 
             animate={{ opacity: [0.2, 1, 0.2] }}
             transition={{ repeat: Infinity, duration: 3 + star.delay, ease: "easeInOut" }}
             className="absolute rounded-full bg-blue-100 shadow-[0_0_12px_rgba(255,255,255,0.9)]" 
             style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
           />
         ))}
      </div>

      {/* Intense Deep Space Azure Backlight Glow */}
      <div className="absolute h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      
      {/* ── 3D Hyper-Translucent Blue Earth Globe ── */}
      <div className="relative flex h-[340px] w-[340px] items-center justify-center rounded-full bg-transparent shadow-[inset_0_0_80px_rgba(37,99,235,0.2),0_0_60px_rgba(59,130,246,0.3)] overflow-hidden z-10 transition-transform hover:scale-105 duration-1000">
        
        {/* Outer Atmospheric Rim Glow (Thicker to stand out against transprency) */}
        <div className="absolute inset-0 rounded-full border-[2px] border-blue-400/50 shadow-[inset_0_0_30px_rgba(59,130,246,0.8),0_0_20px_rgba(59,130,246,0.4)] z-30" />

        {/* Seamless Scrolling Translucent Map Layer (Perfect 2:1 Math) */}
        {/* 400% width ensures each hemisphere is perfectly 200% (2:1 aspect ratio for world map) */}
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute inset-y-0 left-0 flex w-[400%] items-center z-0 opacity-90"
        >
          {/* First Complete World Map */}
          <div 
            className="h-full w-1/2 bg-gradient-to-br from-blue-200 via-blue-400 to-indigo-600"
            style={{ 
              WebkitMaskImage: "url('/world-map.svg')", 
              WebkitMaskSize: "100% 100%", 
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat"
            }}
          />
          {/* Second Complete World Map (Infinite Loop) */}
          <div 
            className="h-full w-1/2 bg-gradient-to-br from-blue-200 via-blue-400 to-indigo-600"
            style={{ 
              WebkitMaskImage: "url('/world-map.svg')", 
              WebkitMaskSize: "100% 100%", 
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat"
            }}
          />
        </motion.div>

        {/* ── Internal Compass Radar Sweep ── */}
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full overflow-hidden pointer-events-none mix-blend-screen">
          
          {/* Compass Axis Reticle */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent" />
          <div className="absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          {/* Concentric Radar Rings */}
          <div className="absolute h-[120px] w-[120px] rounded-full border border-cyan-400/15" />
          <div className="absolute h-[240px] w-[240px] rounded-full border border-dashed border-cyan-400/20" />

          {/* Cardinal Directions for Compass Feel */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-cyan-300/80 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">N</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-cyan-300/80 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">S</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-cyan-300/80 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">E</span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-cyan-300/80 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">W</span>

          {/* Center Targeting Node */}
          <div className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1),0_0_20px_rgba(34,211,238,1)] animate-pulse" />

          {/* The Spinning Radar Sweep Beam */}
          <motion.div
            animate={{ rotateZ: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(34,211,238,0.1) 330deg, rgba(34,211,238,0.5) 360deg)",
            }}
          >
            {/* The sweeping scanner thick beam arm */}
            <div className="absolute top-0 bottom-1/2 left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-t from-transparent to-cyan-300 shadow-[0_0_15px_rgba(34,211,238,1)]" />
          </motion.div>
        </div>

        {/* Depth shadows giving spherical illusion to 2D layer */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,transparent_30%,rgba(0,0,0,0.6)_95%)] z-20" />
      </div>

      {/* ── Space of Stocks: 3D Orbiting Compass Rings & Starlight Tickers ── */}
      <div 
        className="absolute flex items-center justify-center transform-gpu z-0" 
        style={{ transformStyle: "preserve-3d", transform: "rotateX(70deg)" }}
      >
        {/* Deep Space Outer Orbital Trajectory Ring */}
        <motion.div
          animate={{ rotateZ: 360 }}
          transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
          className="absolute h-[800px] w-[800px] rounded-full border border-dashed border-blue-500/15"
        />
        
        {/* Middle Targeting Compass Ring */}
        <motion.div
          animate={{ rotateZ: -360 }}
          transition={{ repeat: Infinity, duration: 70, ease: "linear" }}
          className="absolute h-[620px] w-[620px] rounded-full border-[1.5px] border-transparent border-t-cyan-500/20 border-b-blue-600/20"
        >
          <div className="absolute -top-4 left-1/2 h-8 w-1.5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
          <div className="absolute -bottom-4 left-1/2 h-8 w-1.5 -translate-x-1/2 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
        </motion.div>

        {/* Inner Tracking Target */}
        <motion.div
          animate={{ rotateZ: 360 }}
          transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
          className="absolute h-[460px] w-[460px] rounded-full border border-dotted border-blue-400/20"
        />
      </div>

    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden pb-16 pt-8 lg:pb-0 lg:pt-0">
      {/* ─── Cinematic Background ──────────────────────────── */}
      <CinematicBackground />

      {/* Radial glows on top of canvas */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute -top-20 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/[0.08] blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/[0.06] blur-[100px]" />
      </div>

      {/* ─── Content ──────────────────────────────────────── */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 px-5 py-24 lg:grid-cols-2 lg:px-10 lg:py-0 lg:min-h-[100svh]">

        {/* ── LEFT: Copy ──────────────────────────────────── */}
        <div className="flex flex-col mt-4 z-10 relative">
          
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-sans text-[2.8rem] font-bold leading-[1.08] tracking-tighter text-white sm:text-5xl lg:text-[4rem] xl:text-[4.5rem]"
          >
            <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">The Unified Intelligence</span>
            <br />
            <span className="relative inline-block mt-1">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent pb-1 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                Infrastructure
              </span>
            </span>
            <br />
            <span className="text-slate-400 text-[2rem] lg:text-[2.2rem] font-medium tracking-tight block mt-2">
              for Global Markets.
            </span>
          </motion.h1>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:bg-blue-500 active:scale-[0.98]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Start Trading Worldwide
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            {[
              "5000+ Equities",
              "Real-time Sentiment AI",
              "Free to Start",
              "Global Exchanges",
            ].map((stat) => (
              <div key={stat} className="flex items-center gap-2">
                <span className="text-sm font-bold text-cyan-400/80">+</span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">{stat}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT: Earth Compass Radar ──────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:flex lg:flex-col lg:items-center lg:justify-start w-full pt-8"
          style={{ perspective: "1200px" }}
        >
          {/* Massive 3D Holographic Globe & Radar Rendering taking absolute center stage */}
          <EarthRadar />
          
          {/* System Console Status Badge placed underneath the Scanner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="group relative z-20 inline-flex w-fit items-center gap-3 overflow-hidden rounded-full border border-blue-500/30 bg-[#040812]/90 px-6 py-3 shadow-[0_4px_30px_rgba(37,99,235,0.25)] backdrop-blur-xl transition-all hover:border-cyan-400/50 hover:bg-black cursor-default lg:-translate-y-4"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-400/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,1)]" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-blue-50 antialiased">
              SYSTEM ONLINE <span className="mx-2 text-blue-500/30">·</span> AI ACTIVE <span className="mx-2 text-blue-500/30">·</span> MARKETS LIVE
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade into next section */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-[#070a12] to-transparent" />
    </section>
  );
}
