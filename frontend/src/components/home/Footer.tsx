"use client";

import { motion } from "framer-motion";
import { Compass, Globe2 } from "lucide-react";
import Image from "next/image";

// The animated digital compass + world map radar background
function GlobalRadarMap() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none overflow-hidden">
      
      {/* ── World Map Background ── */}
      {/* We use CSS mask-image so the SVG controls the opacity of a glowing gradient box, giving it a high-tech monochrome look */}
      <div 
        className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-blue-500/10 to-transparent"
        style={{
          maskImage: "url('/world-map.svg')",
          maskSize: "contain",
          maskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskImage: "url('/world-map.svg')",
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
        }}
      />

      {/* Grid Overlay to slice the map */}
      <div 
        className="absolute inset-0 z-[1] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:64px_64px] mix-blend-overlay"
      />

      {/* ── Central Glow ── */}
      <div className="absolute h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px]" />

      {/* ── Animated Digital Compass ── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        className="relative z-[2] flex h-[800px] w-[800px] items-center justify-center"
      >
        {/* Outer dashed ring */}
        <div className="absolute h-[700px] w-[700px] rounded-full border border-dashed border-indigo-400/10" />
        {/* Middle solid ring */}
        <div className="absolute h-[500px] w-[500px] rounded-full border border-indigo-500/20" />
        {/* Inner dotted ring */}
        <div className="absolute h-[300px] w-[300px] rounded-full border-[1.5px] border-dotted border-indigo-300/30" />

        {/* Compass Crosshairs (Thin coordinates) */}
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
        <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

        {/* Radar Sweep Arc */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[350px] w-[350px] origin-top-left"
        >
          {/* Leading beam */}
          <div className="h-full w-[2px] bg-gradient-to-b from-indigo-400/80 to-transparent shadow-[0_0_20px_rgba(99,102,241,1)]" />
          {/* Sweeping tail */}
          <div 
            className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-indigo-500/10 to-transparent" 
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} 
          />
        </motion.div>
        
        {/* Decorative Grid Nodes / Sensors */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.9)]"
            style={{
              height: 5, width: 5,
              transform: `rotate(${deg}deg) translateY(-350px)`,
            }}
          />
        ))}
        {/* Secondary inner nodes */}
        {[45, 135, 225, 315].map((deg) => (
          <div
            key={`inner-${deg}`}
            className="absolute rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            style={{
              height: 3, width: 3,
              transform: `rotate(${deg}deg) translateY(-250px)`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#070a12] pt-40 pb-12 overflow-hidden">
      
      {/* Animated World Map + Compass Radar Overlay */}
      <GlobalRadarMap />

      {/* Top ambient fade so it transitions smoothly from the sections above */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#070a12] to-transparent z-10" />

      {/* Foreground Content */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-5 text-center lg:px-8">
        
        {/* Brand Logo & Name */}
        <div className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 shadow-[0_0_40px_-5px_rgba(99,102,241,0.5)]">
            <Compass className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            StockCompass<span className="text-indigo-400"> AI</span>
          </span>
        </div>

        {/* Premium Value Statement */}
        <p className="mx-auto mb-20 max-w-2xl text-[17px] font-medium leading-relaxed text-slate-300 drop-shadow-md">
          The unified intelligence infrastructure for global markets. We abstract away the noise of high-frequency data, providing institutional-grade analytical clarity directly to your browser. 
        </p>

        {/* Bottom Strip */}
        <div className="flex w-full flex-col items-center justify-between gap-6 border-t border-white/[0.08] pt-8 md:flex-row md:gap-0 bg-[#070a12]/50 backdrop-blur-sm px-6 py-4 rounded-2xl">
          
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-400">
            <Globe2 className="h-4 w-4 text-indigo-400" />
            Global Sentiment Scanners Active
          </div>

          <span className="flex items-center gap-2.5 text-[13px] font-bold tracking-widest text-slate-400 uppercase">
            <span className="flex h-2.5 w-2.5 relative">
               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
               <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            </span>
            Core Systems Operational
          </span>
          
        </div>
      </div>
    </footer>
  );
}
