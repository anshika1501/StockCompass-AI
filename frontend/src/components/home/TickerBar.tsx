"use client";

// ✅ Static display data — NO live API / yfinance calls.
// Prices are hardcoded for UI demonstration only.
import { motion, useAnimationControls } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const tickers = [
  { symbol: "RELIANCE", price: "₹2,847.50", change: "+1.24%", up: true },
  { symbol: "TCS", price: "₹3,412.80", change: "+0.87%", up: true },
  { symbol: "HDFCBANK", price: "₹1,623.45", change: "-0.43%", up: false },
  { symbol: "INFY", price: "₹1,482.10", change: "+2.11%", up: true },
  { symbol: "ITC", price: "₹438.25", change: "+0.62%", up: true },
  { symbol: "SBIN", price: "₹792.60", change: "-0.91%", up: false },
  { symbol: "HINDUNILVR", price: "₹2,261.70", change: "+0.38%", up: true },
  { symbol: "INDIGO", price: "₹3,108.90", change: "-1.57%", up: false },
  { symbol: "WIPRO", price: "₹548.30", change: "+1.83%", up: true },
  { symbol: "BAJFINANCE", price: "₹6,734.20", change: "+0.55%", up: true },
  { symbol: "TATAMOTORS", price: "₹924.15", change: "-0.27%", up: false },
  { symbol: "ADANIGREEN", price: "₹1,647.40", change: "+3.12%", up: true },
];

const allTickers = [...tickers, ...tickers, ...tickers];

export default function TickerBar() {
  const controls = useAnimationControls();

  const start = () => {
    controls.start({
      x: ["0%", "-33.33%"],
      transition: { duration: 50, ease: "linear", repeat: Infinity },
    });
  };

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] w-full overflow-hidden border-b border-white/[0.05] bg-[#040810]/85 backdrop-blur-xl">
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#040810] to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#040810] to-transparent" />

      {/* Label */}
      <div className="pointer-events-none absolute left-4 top-0 z-20 flex h-full items-center gap-2">
        <span className="flex h-4 w-4 items-center justify-center rounded bg-indigo-500/20 font-mono text-[8px] font-black text-indigo-400">
          ▶
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-600">
          NSE
        </span>
      </div>

      <div
        className="flex overflow-hidden py-[9px] pl-20"
        onMouseEnter={() => controls.stop()}
        onMouseLeave={start}
      >
        <motion.div
          className="flex shrink-0 items-center"
          animate={controls}
          onViewportEnter={start}
        >
          {allTickers.map((ticker, i) => (
            <div
              key={`${ticker.symbol}-${i}`}
              className="group flex shrink-0 cursor-default select-none items-center gap-2.5 border-r border-white/[0.04] px-4 transition-colors hover:bg-white/[0.03]"
            >
              {/* Symbol */}
              <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-slate-300">
                {ticker.symbol}
              </span>

              {/* Price */}
              <span className="font-mono text-[10px] font-semibold tabular-nums text-white">
                {ticker.price}
              </span>

              {/* Change badge */}
              <span
                className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums transition-all ${
                  ticker.up
                    ? "bg-emerald-500/10 text-emerald-400 group-hover:shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                    : "bg-rose-500/10 text-rose-400 group-hover:shadow-[0_0_10px_rgba(251,113,133,0.3)]"
                }`}
              >
                {ticker.up ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                {ticker.change}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
